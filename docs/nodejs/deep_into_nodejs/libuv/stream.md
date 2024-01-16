# libuv 的流机制


## 流是什么？

流是一种数据处理的机制，主要用来解决生产者 / 消费者之间不同步的问题。比如说，如果进程想往一个目的地写入数据但无法写入，进程就会被阻塞，后面的事件也就都无法继续进行。同样地，如果一个进程想读取数据，但数据还没有准备好，进程就需要一直等待而不能做其他事情。面对这些不合理的情况，流机制借助事件驱动模块的能力，封装了数据处理的具体逻辑，简化了上层调用者的成本。我们除了需要了解流的概念和作用，还需要深入了解和理解其工作原理。

在 Libuv 中流是围绕着文件描述符进行工作的，当我们想对文件描述符执行读写等操作时，我们不会直接操作这个文件描述符，而是由流机制进行管理，因为当我们进行读写操作时，当前并不一定满足条件。也就是说，当我们想从文件描述符中读取数据时，当前可能没有数据可以读，写入数据时同理。这时候，Libuv 会先在流中记录相关的操作和数据，然后 Libuv 会往事件驱动模块注册相应的事件，等到事件触发时才进行真正的读写，并通过回调来通知用户事件的发生。

那么，流具体是如何实现的呢？在流的实现中，最核心的数据结构是 IO 观察者（封装了文件描述符、感兴趣的事情和回调），其余的字段和流的操作相关，比如读一个流，写一个流，关闭一个流，在流中都有对应的字段去支持。

读一个流时，注册 IO 观察者中文件描述符的可读事件，可读事件触发时执行用户的读回调。
写一个流，先把数据写到流队列中，然后等到 IO 观察者中文件描述符的可写事件触发时，执行写入，并执行用户的写完成回调，但是如果当前待写队列为空，则会先尝试执行一次写入，因为文件描述符是非阻塞的，所以写入失败也没关系，可写事件触发时再写就行。
关闭一个流，就是 IO 观察者中文件描述符的可写事件触发时，如果待写的数据已经写完，然后执行关闭流操作。
流通过 IO 观察者，并结合事件驱动模块，很好地解决了生产者和消费者同步的问题。下面具体讲一下流在 Libuv 中的实现，首先看一下流的初始化。

### 初始化流

```c
void uv__stream_init(uv_loop_t* loop, uv_stream_t* stream, uv_handle_type type) {
    int err;
    // 初始化 handle
    uv__handle_init(loop, (uv_handle_t*)stream, type);
    // 各种操作的回调
    stream->read_cb = NULL;
    stream->alloc_cb = NULL;
    stream->close_cb = NULL;
    stream->connection_cb = NULL;
    // 各种操作对应的上下文结构体
    stream->connect_req = NULL;
    stream->shutdown_req = NULL;
    // 接收的 TCP 连接或者传递过来的文件描述符
    stream->accepted_fd = -1;
    stream->queued_fds = NULL;
    // 操作对应的错误码
    stream->delayed_error = 0;
    // 写操作相关的数据结构
    QUEUE_INIT(&stream->write_queue);
    QUEUE_INIT(&stream->write_completed_queue);
    stream->write_queue_size = 0;
    /*
        初始化 IO 观察者，把文件描述符（这里还没有，所以是 -1）和
        回调 uv__stream_io 记录在 io_watcher 上
    */
    uv__io_init(&stream->io_watcher, uv__stream_io, -1);
}
```

流的初始化主要是初始化了一些字段，来记录流操作的一些上下文，例如。

TCP 服务器（流）发起 listen 时会传入一个回调并记录到 connection_cb 中，当连接到来时会执行 connection_cb。
TCP 客户端（流）发起连接时的上下文就会记录到 connect_req，当连接结束后执行 connect_req 的回调。
往流写入数据时，数据会先被记录到 write_queue 队列中等待写入。
可以看到，针对流的操作几乎都是异步的，即发起操作和执行真正的操作是分开进行的。因此，流就需要额外的字段来记录这些操作上下文，这样当满足操作条件时，流才能根据保存的上下文进行操作。另外我们还可以看到，流的所有操作对应的回调都是 uv__stream_io，在uv__stream_io 会针对触发的事件进行不同的处理。

```c
static void uv__stream_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  uv_stream_t* stream;

  stream = container_of(w, uv_stream_t, io_watcher);
  // 连接操作
  if (stream->connect_req) {
    uv__stream_connect(stream);
    return;
  }
  
  // 触发了可读事件，执行读操作
  if (events & (POLLIN | POLLERR | POLLHUP))
    uv__read(stream);
    
  // 读回调关闭了流
  if (uv__stream_fd(stream) == -1)
    return;
    
  // 对端关闭了
  if ((events & POLLHUP) &&
      (stream->flags & UV_HANDLE_READING) &&
      (stream->flags & UV_HANDLE_READ_PARTIAL) &&
      !(stream->flags & UV_HANDLE_READ_EOF)) {
    uv_buf_t buf = { NULL, 0 };
    uv__stream_eof(stream, &buf);
  }
  // 流关闭了
  if (uv__stream_fd(stream) == -1)
    return;  /* read_cb closed stream. */
    
  // 可写事件触发
  if (events & (POLLOUT | POLLERR | POLLHUP)) {
    uv__write(stream);
    uv__write_callbacks(stream);

    // 待写队列为空
    if (QUEUE_EMPTY(&stream->write_queue))
      uv__drain(stream);
  }
}
```

因为这里面涉及所有流的操作逻辑，所以暂时不深入讲解，在下面的内容中会具体分析每一个操作的实现。

前面讲到，流是围绕着文件描述符进行工作的，但我们发现初始化时，还没有文件描述符。文件描述符通常是在真正使用流的时候才会实时创建，比如当我们通过 Node.js 创建一个 TCP 服务器时，只有在调用 listen 的时候，Node.js 才会通过 Libuv 创建对应的文件描述符（具体是在 bind 操作时）。有了文件描述符之后，就可以通过 uv__stream_open 设置到流中。

```c
int uv__stream_open(uv_stream_t* stream, int fd, int flags) {
    // 设置流的标记
    stream->flags |= flags;
    // 针对 TCP 流的处理
    if (stream->type == UV_TCP) {
        // 关闭 nagle 算法
        if ((stream->flags & UV_HANDLE_TCP_NODELAY) && uv__tcp_nodelay(fd,1))
            return UV__ERR(errno);
        
        // 开启 TCP KEEPALIVE
        if ((stream->flags & UV_HANDLE_TCP_KEEPALIVE) && uv__tcp_keepalive(fd, 1, 60)) {
            return UV__ERR(errno);
        }
    }
    // 保存文件描述符到 IO 观察者中
    stream->io_watcher.fd = fd;
    
    return 0;
}
```

uv__stream_open 主要是记录文件描述符和标记到流的结构体中，有了文件描述符，后续就可以操作这个流了。下面我们一起看看具体的操作。

### 对流发起一个连接

连接操作是针对面向连接的流，如 TCP、Unix 域。因为 TCP 和 Unix 域的实现类似，所以这里以 TCP 连接为例。

```c
int uv__tcp_connect(uv_connect_t* req,
                    uv_tcp_t* handle,
                    const struct sockaddr* addr,
                    unsigned int addrlen,
                    uv_connect_cb cb) {
  int err;
  int r;

  // 创建一个用于通信的 socket，把 socket 对应的 fd 保存到 handle 中
  maybe_new_socket(handle,
                   addr->sa_family,
                   UV_HANDLE_READABLE | UV_HANDLE_WRITABLE);

  do {
    errno = 0;
    // 发起对 addr 的连接
    r = connect(uv__stream_fd(handle), addr, addrlen);
  } while (r == -1 && errno == EINTR);
  // 连接还没有成功或者直接失败了
  if (r == -1 && errno != 0) {
    if (errno == EINPROGRESS) // 连接中，正常状态
      ; /* not an error */
    else if (errno == ECONNREFUSED) // 直接返回连接失败，比如 Unix 域
      handle->delayed_error = UV__ERR(errno);
    else
      return UV__ERR(errno);
  }
  // 初始化一个连接请求
  uv__req_init(handle->loop, req, UV_CONNECT);
  req->cb = cb;
  req->handle = (uv_stream_t*) handle;
  QUEUE_INIT(&req->queue);
  handle->connect_req = req;
  // 注册可写事件
  uv__io_start(handle->loop, &handle->io_watcher, POLLOUT);
  // 连接出错，插入pending队列，而不是直接执行上层回调
  if (handle->delayed_error)
    uv__io_feed(handle->loop, &handle->io_watcher);

  return 0;
}
```

连接操作首先会直接调用系统函数 connect 发起一个连接，因为文件描述符是非阻塞的，所以不会导致进程阻塞。对于 TCP 连接，这时候就会发起三次握手，然后返回错误码 EINPROGRESS。接着 Libuv 就会把连接请求的上下文保存到 connect_req，等待三次握手结束时进行下一步处理。接着，我们来看连接结束后的逻辑。

```c
static void uv__stream_connect(uv_stream_t* stream) {
  int error;
  uv_connect_t* req = stream->connect_req;
  socklen_t errorsize = sizeof(int);
  // 处理在 uv__tcp_connect 中发起连接时的出错
  if (stream->delayed_error) {
    error = stream->delayed_error;
    stream->delayed_error = 0;
  } else {
    // 到这里说明 uv__tcp_connect 中没有出错，然后从内核获取三次握手的结果
    getsockopt(uv__stream_fd(stream),
               SOL_SOCKET,
               SO_ERROR,
               &error,
               &errorsize);
    error = UV__ERR(error);
  }
  // 还在连接中，则忽略，等待下次回调
  if (error == UV__ERR(EINPROGRESS))
    return;

  stream->connect_req = NULL;
  uv__req_unregister(stream->loop, req);
  
  // 如果连接错误，或者没有数据等待写入则注销可写事件
  if (error < 0 || QUEUE_EMPTY(&stream->write_queue)) {
    uv__io_stop(stream->loop, &stream->io_watcher, POLLOUT);
  }
  // 执行发起连接的回调
  if (req->cb)
    req->cb(req, error);

  if (uv__stream_fd(stream) == -1)
    return;
  // 如果有数据等待发送，则执行写回调
  if (error < 0) {
    uv__stream_flush_write_queue(stream, UV_ECANCELED);
    uv__write_callbacks(stream);
  }
}
```

发起连接的逻辑大致分为两种情况。第一种是调用 connect 时就失败了，这时候 Libuv 会把错误码记录到 delayed_error 中，往 pending 阶段插入一个任务，最后在 pending 阶段时执行上层回调把错误码告诉上层。第二种情况是成功发起了连接，在异步地等待连接结果，比如三次握手的结果，等到有结果后，就会在 Poll IO 阶段处理连接结果。这时候需要通过 getsockopt 从内核中拿到连接的结果，并把结果通过回调告诉上层。

除此之外，连接过程中 Libuv 允许写入数据，因为 Libuv 会缓存，等到连接成功后再执行写入，如果连接失败了 Libuv 会清除写事件并且执行写回调告诉上层。


### 读取流中的数据

当想从流中读取数据时，我们可以执行 uv_read_start。uv_read_start 会注册可读事件，这样流的数据（如果有的话）就会源源不断地流向调用方。

```c
int uv_read_start(uv_stream_t* stream,
                  uv_alloc_cb alloc_cb,
                  uv_read_cb read_cb) {
    // 标记正在读
    stream->flags |= UV_HANDLE_READING;
    // 保存回调，当有数据到来时，操作系统会通知 Libuv，然后 Libuv 最终执行这个回调通知上层
    stream->read_cb = read_cb;
    // 设置分配内存的函数，保存数据所需要的内存由上层负责管理
    stream->alloc_cb = alloc_cb;
    // 注册读事件
    uv__io_start(stream->loop, &stream->io_watcher, POLLIN);
    uv__handle_start(stream);
    return 0;
}
```

uv_read_start 没有尝试发起读操作，而是记录读操作相关的回调，然后把流对应的文件描述符和感兴趣的事情注册到事件驱动模块中，当可读事件触发时，读回调就会被执行。

```c
static void uv__read(uv_stream_t* stream) {
  uv_buf_t buf;
  ssize_t nread;
  int count;
  int err;
  int is_ipc;

  // 有数据时，会连续执行读操作，但是为了避免让其他事件也可以执行，所以不会一直执行读
  count = 32;
  // is_ipc，用于 Unix 域，后续分析
  is_ipc = stream->type == UV_NAMED_PIPE && ((uv_pipe_t*) stream)->ipc;

  while (stream->read_cb
      && (stream->flags & UV_HANDLE_READING)
      && (count-- > 0)) {
      
    buf = uv_buf_init(NULL, 0);
    // 分配内存，地址保存在 buf 中，alloc_cb 由上层实现
    stream->alloc_cb((uv_handle_t*)stream, 64 * 1024, &buf);
    
    // 单纯的数据读取
    if (!is_ipc) {
      do {
        nread = read(uv__stream_fd(stream), buf.base, buf.len);
      }
      while (nread < 0 && errno == EINTR);
    } else {
      // 传递了文件描述符，在讲 Unix 域时单独分析
    }
    // 读出错
    if (nread < 0) {
      // 
    } else if (nread == 0) {
      // 读到底了
      uv__stream_eof(stream, &buf);
      return;
    } else {
      // 读成功
      ssize_t buflen = buf.len;
      // 执行上层回调
      stream->read_cb(stream, nread, &buf);
      // 读取的数据大小比buf的小，因为每次最多读 64 * 1024 字节
      if (nread < buflen) {
        stream->flags |= UV_HANDLE_READ_PARTIAL;
        return;
      }
    }
  }
}
```

读操作首先会调用 alloc_cb 分配 64 * 1024 字节的内存，然后调用 read 函数进行数据的读取，接着执行 read_cb 通知上层，如果读到的字节数是 0 则说明读对端关闭了写端，这时候执行 uv__stream_eof 进行处理。

```c
static void uv__stream_eof(uv_stream_t* stream, const uv_buf_t* buf) {
  // 标记读完了
  stream->flags |= UV_HANDLE_READ_EOF;
  // 撤销等待可读事件
  uv__io_stop(stream->loop, &stream->io_watcher, POLLIN);
  // 如果也没有注册等待可写事件，则停掉 handle
  if (!uv__io_active(&stream->io_watcher, POLLOUT))
    uv__handle_stop(stream);
  uv__stream_osx_interrupt_select(stream);
  // 触发回调
  stream->read_cb(stream, UV_EOF, buf);
  stream->flags &= ~UV_HANDLE_READING;
}
```

uv__stream_eof 同样调用 read_cb 通知上层，并传入 UV_EOF 表示读结束了。有注册读操作，就会有停止读操作，对应的函数是 uv_read_stop。

```c
int uv_read_stop(uv_stream_t* stream) {
    // 清除正在读取的标记
    stream->flags &= ~UV_HANDLE_READING;
    // 撤销等待读事件
    uv__io_stop(stream->loop, &stream->io_watcher, POLLIN);
    
    // 如果对写事件也不感兴趣，则停掉 handle，允许事件循环退出
    if (!uv__io_active(&stream->io_watcher, POLLOUT))
        uv__handle_stop(stream);
    
    stream->read_cb = NULL;
    stream->alloc_cb = NULL;
    return 0;
}
```

和 start 相反，start 是注册等待可读事件和打上正在读取这个标记，stop 则是撤销等待可读事件和清除这个标记。这些操作本质上是对事件驱动模块的操作。

### 写入数据到流中

我们可以通过 uv_write 往流中写入数据，但是数据不一定会被马上写入，而是会先缓存在流中，等待可写时，再把写入流对应的文件描述符中。

```c
int uv_write(uv_write_t* req, // 记录本次写请求的上下文
             uv_stream_t* handle, // 往哪个流写
             const uv_buf_t bufs[], // 需要写入的数据
             unsigned int nbufs,// buf个数
             uv_write_cb cb // 写完后执行的回调
) {
        return uv_write2(req, handle, bufs, nbufs, NULL, cb);
}

```

uv_write 直接调用 uv_write2。其中第四个参数是 NULL，代表写一般的数据，比如 hello 字符串，不传递文件描述符。

```c
int uv_write2(uv_write_t* req,
              uv_stream_t* stream,
              const uv_buf_t bufs[],
              unsigned int nbufs,
              // 需要传递的文件描述符所在的流，这里是 NULL
              uv_stream_t* send_handle,
              uv_write_cb cb
)
{
        int empty_queue;
        // write_queue_size 为 0 代表当前没有等待写入的数据，则可以尝试直接写入
        empty_queue = (stream->write_queue_size == 0);
        // 初始化一个写请求
        uv__req_init(stream->loop, req, UV_WRITE);
        // 写完后执行的回调
        req->cb = cb;
        // 记录所操作的流
        req->handle = stream;
        // 操作错误码
        req->error = 0;
        QUEUE_INIT(&req->queue);
        // 存储数据元信息的 bufs
        req->bufs = req->bufsml;
        // 不够则扩容
        if (nbufs > ARRAY_SIZE(req->bufsml))
            req->bufs = uv__malloc(nbufs * sizeof(bufs[0]));
        // 把需要写入的数据填充到 req->bufs 中
        memcpy(req->bufs, bufs, nbufs * sizeof(bufs[0]));
        // 需要写入的 buf 个数
        req->nbufs = nbufs;
        // 目前写入的 buf 个数，初始化是 0
        req->write_index = 0;
        // 更新流中待写数据的总长度，就是每个 buf 的数据大小加起来
        stream->write_queue_size += uv__count_bufs(bufs, nbufs);
        // 插入待写队列
        QUEUE_INSERT_TAIL(&stream->write_queue, &req->queue);
        /*
            stream->connect_req 非空说明流作为客户端，并且正在建立连接，
            则不能执行写入，建立连接成功会置 connect_req 为 NULL 并触发可写事件。
        */
        if (stream->connect_req) {
            /* Still connecting, do nothing. */
        }
        //  待写数据队列为空，说明没有数据等待写入，则这次的写操作可以直接发起
        else if (empty_queue) {
            uv__write(stream);
        }
        else {
            /*
                队列非空，说明还有数据等待被写入，先注册等待可写事件，
                事件触发的时候，再执行写入
            */
            uv__io_start(stream->loop, &stream->io_watcher, POLLOUT);
        }
        
        return 0;
}
```

uv_write2 首先封装一个写请求并插入到流的待写队列，然后根据当前流状态进行下一步操作。

如果正在发起连接，则不需要执行写操作，因为连接成功后会触发可写事件。
如果待写队列为空，则直接进行写操作，因为文件描述符是非阻塞的，所以就算写失败了也不会阻塞进程，
如果队列非空则注册可写事件，等待可写时再写入。

从上图中可以看到，Libuv 只是保存了指向待写数据的指针，而不是进行数据的复制。数据所占内存的管理由调用方管理，如果数据保存在堆内存，则需要在写回调中释放对应的内存。如下是当可写事件触发时，真正的写操作逻辑。

```c
static void uv__write(uv_stream_t* stream) {

    struct iovec* iov;
    QUEUE* q;
    uv_write_t* req;
    int iovmax;
    int iovcnt;
    ssize_t n;
    int err;
        
start:
    // 待写队列为空，没数据需要写
    if (QUEUE_EMPTY(&stream->write_queue))
        return;
    // 取出一个写请求
    q = QUEUE_HEAD(&stream->write_queue);
    req = QUEUE_DATA(q, uv_write_t, queue);
    /*
        struct iovec {
            ptr_t iov_base; // 数据首地址
            size_t iov_len; // 数据长度
        };
        iovec 和 bufs 结构体的定义一样
    */
    /*
        req->write_index 表示当前待写 buf 的索引，
        一个请求里可以有多个 buf，转成 iovec 格式发送
    */
    iov = (struct iovec*) &(req->bufs[req->write_index]);
    // 待写的 buf 个数，nbufs 是总数，write_index 是当前已写的个数
    iovcnt = req->nbufs - req->write_index;
    // 最多能写几个
    iovmax = uv__getiovmax();
    
    // 取最小值
    if (iovcnt > iovmax)
        iovcnt = iovmax;
    
    // 需要传递的描述符
    if (req->send_handle) {
        // 需要传递文件描述符的逻辑，分析 Unix 域的时候再分析
    } else { // 单纯发送数据，则直接写
        do {
            if (iovcnt == 1) {
                n = write(uv__stream_fd(stream), iov[0].iov_base, iov[0].iov_len);
            } else {
                n = writev(uv__stream_fd(stream), iov, iovcnt);
            }
        } while (n == -1 && errno == EINTR);
    }
    // 写失败
    if (n < 0) {
        // 发送失败的逻辑，我们不具体分析
    } else {
        // 写成功，n 是写成功的字节数
        while (n >= 0) {
            // 当前 buf
            uv_buf_t* buf = &(req->bufs[req->write_index]);
            // buf 的数据长度
            size_t len = buf->len;
            /*
                len 代表需要写入的，n 表示已经写入的
                len 如果大于 n 说明该 buf 的数据还没有完全被写入
            */
            if ((size_t)n < len) {
                // 更新指针，指向下次待发送的数据首地址
                buf->base += n;
                // 记录 buf 中还有多少数据等待发送
                buf->len -= n;
                // 更新待写数据的总长度
                stream->write_queue_size -= n;
                n = 0;
                // 设置了一直写标记，则跳到 start 标签继续写
                if (stream->flags & UV_HANDLE_BLOCKING_WRITES) {
                    goto start;
                } else {
                    // 否则等待可写事件触发的时候再写
                    break;
                }
            } else { // n >= len 说明成功写入了一个或多个 buf 的数据
                // 该 buf 的数据全部写入成功，更新索引到下一个 buf 的位置
                req->write_index++;
                n -= len;
                // 更新待写数据总长度
                stream->write_queue_size -= len;
                // 是否全部数据都写入完毕
                if (req->write_index == req->nbufs) {
                    // 写完了本请求的数据，做后续处理
                    uv__write_req_finish(req);
                    return;
                }
            }
        }
    }
    // 到这说明数据还没有完全被写入，保证注册了等待可写事件，等待继续写
    uv__io_start(stream->loop, &stream->io_watcher, POLLOUT);
}
```

写完一个请求的数据后 Libuv 是如何处理的呢？从上面的代码中可以看到，写完一个请求的数据后，会调用 uv__write_req_finish 函数。

```c
// 把 buf 的数据写入完成或写出错后触发回调
static void uv__write_req_finish(uv_write_t* req) {
    uv_stream_t* stream = req->handle;
    // 移出队列
    QUEUE_REMOVE(&req->queue);
    // 插入写完成队列
    QUEUE_INSERT_TAIL(&stream->write_completed_queue, &req->queue);
    // 插入 pending 队列，在 pending 阶段执行业务回调
    uv__io_feed(stream->loop, &stream->io_watcher);
}

void uv__io_feed(uv_loop_t* loop, uv__io_t* w) {
  if (QUEUE_EMPTY(&w->pending_queue))
    QUEUE_INSERT_TAIL(&loop->pending_queue, &w->pending_queue);
}
```
uv__write_req_finish 的逻辑比较简单，就是把节点从待写队列中移除，然后插入写完成队列，结构如下图所示。

最后把 IO 观察者插入 pending 队列。在 pending 阶段会执行 IO 观察者的回调 uv__stream_io。


```c
static void uv__stream_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  uv_stream_t* stream;

  stream = container_of(w, uv_stream_t, io_watcher);
  if (events & (POLLOUT | POLLERR | POLLHUP)) {
    // 如果有数据等话，继续写，如果写完了就返回 
    uv__write(stream);
    // 执行业务回调
    uv__write_callbacks(stream);
  }
}
```

uv__stream_io 中首先执行 uv__write 判断是否还有数据需要写，有就继续写，没有就直接返回，然后通过 uv__write_callbacks 执行业务回调。

```c
static void uv__write_callbacks(uv_stream_t* stream) {
  uv_write_t* req;
  QUEUE* q;
  QUEUE pq;
  // 写完成队列为空，不需要处理
  if (QUEUE_EMPTY(&stream->write_completed_queue))
    return;

  QUEUE_MOVE(&stream->write_completed_queue, &pq);
  // 清空写完成队列，并执行业务回调
  while (!QUEUE_EMPTY(&pq)) {
    q = QUEUE_HEAD(&pq);
    req = QUEUE_DATA(q, uv_write_t, queue);
    QUEUE_REMOVE(q);
    // 请求结束，请求个数减一
    uv__req_unregister(stream->loop, req);

    // 执行上层回调
    if (req->cb)
      req->cb(req, req->error);
  }
}
```

### 关闭流的写端

面向连接的流是全双工的，每一端都可以同时进行数据的读写，所以关闭时，某一端可以选择关闭读或者写。Libuv 没有关闭读端的功能，我们可以通过关闭流或者不订阅可读事件来实现，想要关闭写端，可以通过 uv_shutdown 函数来操作

```c
// 关闭流的写端
int uv_shutdown(uv_shutdown_t* req, uv_stream_t* stream, uv_shutdown_cb cb)
{
    uv__req_init(stream->loop, req, UV_SHUTDOWN);
    req->handle = stream;
    // 关闭操作完成后执行的上层回调
    req->cb = cb;
    stream->shutdown_req = req;
    // 设置正在操作的标记
    stream->flags |= UV_HANDLE_SHUTTING;
    
    // 注册可写事件
    uv__io_start(stream->loop, &stream->io_watcher, POLLOUT);
    
    return 0;
}
```

uv_shutdown 只是把请求上下文保存到 stream 中，接着注册可写事件，等到可写事件触发时 Libuv 会执行 uv__stream_io 关闭流的写端。

```c
static void uv__stream_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  uv_stream_t* stream;

  stream = container_of(w, uv_stream_t, io_watcher);

  // 可写事件触发
  if (events & (POLLOUT | POLLERR | POLLHUP)) {
    uv__write(stream);
    uv__write_callbacks(stream);

    // 待写队列为空才关闭流
    if (QUEUE_EMPTY(&stream->write_queue))
      uv__drain(stream);
  }
}
```

可以看到，如果流中还有数据则不能关闭流，需要等到数据写入完毕，当写入完毕后，执行 uv__drain 关闭。

```c
static void uv__drain(uv_stream_t* stream) {
  uv_shutdown_t* req;
  int err;
  
  // 撤销等待可写事件，因为没有数据需要写入了
  uv__io_stop(stream->loop, &stream->io_watcher, POLLOUT);
  // 流还没有关闭并且设置了关闭标记，则关闭写端
  if ((stream->flags & UV_HANDLE_SHUTTING) &&
      !(stream->flags & UV_HANDLE_CLOSING) &&
      !(stream->flags & UV_HANDLE_SHUT)) {

    req = stream->shutdown_req;
    stream->shutdown_req = NULL;
    // 清除标记
    stream->flags &= ~UV_HANDLE_SHUTTING;
    uv__req_unregister(stream->loop, req);

    err = 0;
    // 关闭写端
    if (shutdown(uv__stream_fd(stream), SHUT_WR))
      err = UV__ERR(errno);
    // 标记已关闭写端
    if (err == 0)
      stream->flags |= UV_HANDLE_SHUT;
    // 执行回调
    if (req->cb != NULL)
      req->cb(req, err);
  }
}
```

最终调用系统函数 shutdown 关闭流的写端，但是读端还没有关闭，还可以读数据 。


### 关闭流

当我们不再使用一个流的时候，可以通过 uv_close 关闭它，uv_close 最终会执行 uv__stream_close 关闭流。

```c
void uv__stream_close(uv_stream_t* handle) {
    unsigned int i;
    uv__stream_queued_fds_t* queued_fds;
    // 关闭 IO 观察者，对 fd 的事件不再感兴趣
    uv__io_close(handle->loop, &handle->io_watcher);
    uv_read_stop(handle);
    // 关闭 handle
    uv__handle_stop(handle);
    // 不再读写
    handle->flags &= ~(UV_HANDLE_READABLE | UV_HANDLE_WRITABLE);
    
    // 关闭文件描述符，除了标准输入，输出，错误流
    if (handle->io_watcher.fd != -1) {
        /* Don't close stdio file descriptors. Nothing good comes from it. */
        if (handle->io_watcher.fd > STDERR_FILENO)
            // 关闭文件描述符
            uv__close(handle->io_watcher.fd);
            handle->io_watcher.fd = -1;
    }
    // 关闭已经接收但是还没有处理的 fd，比如 TCP 连接
    if (handle->accepted_fd != -1) {
        uv__close(handle->accepted_fd);
        handle->accepted_fd = -1;
    }
    
    // 关闭传递过来但还没有被处理的 fd，用于 Unix 域 IPC 时
    if (handle->queued_fds != NULL) {
        queued_fds = handle->queued_fds;
        for (i = 0; i < queued_fds->offset; i++)
        uv__close(queued_fds->fds[i]);
        uv__free(handle->queued_fds);
        handle->queued_fds = NULL;
    }
}
```
关闭流就是清除流中的状态和资源，不同类型的流对应不同的操作，比如 Unix 域用于 IPC 时才有 handle->queued_fds。关闭了流之后，在 close 阶段时会销毁流。


```c
// 执行 close 阶段的回调
static void uv__finish_close(uv_handle_t* handle) {
  switch (handle->type) {
    // ...
    case UV_NAMED_PIPE:
    case UV_TCP:
    case UV_TTY:
      uv__stream_destroy((uv_stream_t*)handle);
      break;

  }
  // ...
}
```

销毁流的函数是 uv__stream_destroy。

```c
void uv__stream_destroy(uv_stream_t* stream) {
      // 正在发起连接则执行回调
      if (stream->connect_req) {
        // 销毁一个request
        uv__req_unregister(stream->loop, stream->connect_req);
        // 执行上层回调
        stream->connect_req->cb(stream->connect_req, UV_ECANCELED);
        stream->connect_req = NULL;
      }
      // 清空待写队列
      uv__stream_flush_write_queue(stream, UV_ECANCELED);
      // 执行写回调
      uv__write_callbacks(stream);
      // 正在发起关闭写端操作则执行回调
      if (stream->shutdown_req) {
        uv__req_unregister(stream->loop, stream->shutdown_req);
        // 调用回调
        stream->shutdown_req->cb(stream->shutdown_req, UV_ECANCELED);
        stream->shutdown_req = NULL;
      }
}
```

uv__stream_destroy 一共三个逻辑，分别是对发起连接、关闭写端和写入数据的处理，具体的处理就是执行上层的回调。

### 总结

本节课介绍了 Libuv 流的概念、工作机制以及围绕着流的各种操作的实现。流本质是对文件描述符的封装，依赖事件驱动模块进行工作，当我们操作一个文件描述符时，通常不是直接发起操作，而是注册相关的事件，等待事件完成后，事件驱动就会通知 Libuv，接着再发起真正的操作，比如数据读写。了解这些之后，我们再学习后面的 TCP、Unix 域的时候就会轻松很多，因为它们都是基于流机制进行工作的。