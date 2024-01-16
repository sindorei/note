# tcp基础和客户端/服务器的实现


## TCP 协议是什么？

TCP 是一种面向连接的、可靠的、基于字节流的传输层全双工通信协议，因此，它有 4 个特点：面向连接、可靠、流式、全双工。下面我们详细讲解这些特性。

## 面向连接的本质

TCP 中的连接是一个虚拟的连接，本质上是主机在内存里记录了对端的信息，我们可以将连接理解为一个通信的凭证。如下图所示。

tu 11-1

那么如何建立连接呢？ TCP 的连接是通过三次握手建立的。

服务器首先需要监听一个端口。
客户端主动往服务器监听的端口发起一个 syn 包（第一次握手）。
当服务器所在操作系统收到一个 syn 包时，会先根据 syn 包里的目的 IP 和端口找到对应的监听 socket，如果找不到则回复 rst 包，如果找到则发送 ack 给客户端（第二次握手），并新建一个通信 socket 并插入到监听 socket 的连接中队列（具体的细节会随着不同版本的操作系统而变化。比如连接中队列和连接完成队列是一条队列还是两条队列，再比如是否使用了 syn cookie 技术来防止 syn flood 攻击，如果使用了，收到 syn 包的时候就不会创建 socket，而是收到第三次握手的包时再创建）。
客户端收到服务器的 ack 后，再次发送 ack 给服务器，客户端就完成三次握手进入连接建立状态了。
当服务器所在操作系统收到客户端的 ack 时（第三次握手），处于连接中队列的 socket 就会被移到连接完成队列中。
当操作系统完成了一个 TCP 连接，操作系统就会通知相应的进程，进程从连接完成队列中摘下一个已完成连接的 socket 结点，然后生成一个新的 fd，后续就可以在该 fd 上和对端通信。具体的流程如下图所示。

tu 11-2

完成三次握手后，客户端和服务器就可以进行数据通信了 。 操作系统收到数据包和收到 syn 包的流程不一样，操作系统会根据报文中的 IP 和端口找到处理该报文的通信 socket（而不是监听 socket），然后把数据包（操作系统实现中是一个 skb 结构体）挂到该通信 socket 的数据队列中，如下图所示。

tu 11-3

当应用层调用 read 读取该 socket 的数据时，操作系统会根据应用层所需大小，从一个或多个 skb 中返回对应的字节数。同样，写也是类似的流程，当应用层往 socket 写入数据时，操作系统不一定会立刻发送出去，而是会保存到写缓冲区中，然后根据复杂的 TCP 算法发送。

当两端完成通信后需要关闭连接，否则会浪费内存。 TCP 通过四次挥手实现连接的断开，第一次挥手可以由任意一端发起。前面讲过 TCP 是全双工的，所以除了通过四次挥手完成整个 TCP 连接的断开外，也可以实现半断开，比如客户端关闭写端表示不会再发送数据，但是仍然可以读取来自对端发送端数据。四次挥手的流程如下。

tu 11-4

### 可靠
TCP 发送数据时会先缓存一份到已发送待确认队列中，并启动一个超时重传计时器，如果一定时间内没有收到对端的确认 ack，则触发重传机制，直到收到 ack 或者重传次数达到阈值。以下是某个版本的操作系统关于重传次数达到阈值时的逻辑。

```
// 重传次数达到阈值
if (sk->retransmits > TCP_RETR2) 
{
    // 设置错误码，通知进程
    sk->err = ETIMEDOUT;
    sk->error_report(sk);
    // 删除重传定时器
    del_timer(&sk->retransmit_timer);
    // 修改 socket 为关闭状态
    tcp_set_state(sk, TCP_CLOSE);
}

```

### 流式协议的本质

建立连接后，应用层就可以调用发送接口源源不断地发送数据。通常情况下，并不是每次调用发送接口，操作系统就直接把数据发送出去，这些数据的发送是由操作系统按照一定的算法去发送的。对操作系统来说，它看到的是字节流，它会按照 TCP 算法打包出一个个包发送到对端，所以当对端收到数据后，需要处理好数据边界的问题。

tu 11-5

从上图中可以看到，假设应用层发送了两个 HTTP 请求，操作系统在打包数据发送时可能的场景是第一个包里包括了 HTTP 请求 1 的全部数据和部分请求 2 的数据，所以当对端收到数据并进行解析时，就需要根据 HTTP 协议准确地解析出第一个 HTTP 请求对应的数据。

因为 TCP 的流式协议，所以基于 TCP 的应用层通常需要定义一个应用层协议，然后按照应用层协议实现对应的解析器，这样才能完成有效的数据通信，比如常用的 HTTP 协议。对比来说 UDP 是面向数据包的协议，当应用层把数据传递给 UDP 时，操作系统会直接打包发送出去（如果数据字节大小超过阈值则会报错）。

### 全双工的本质
刚才提到 TCP 是全双工的，全双工就是通信的两端都有一个发送队列和接收队列，可以同时发送和接收，互不影响。另外也可以选择关闭读端或者写端。

tu 11-6

### TCP 协议的使用
了解了 TCP 的基础概念后，来看看如何使用 TCP 协议进行通信。TCP / IP 协议是由操作系统内核实现的，当我们需要使用 TCP 协议进行通信时，可以通过操作系统提供的系统调用来完成。首先看如何创建一个服务器（伪代码）

```
// 创建一个 socket（socket 表示通信的一端），但是还没有绑定地址信息
const fd = socket();  
// 绑定到具体的 IP 和端口，如果没有显式配置，则操作系统自己决定
bind(fd, ip, port);  
// 修改 socket 为监听状态，就可以接收 TCP 连接了
listen(fd);  
// 等待完成三次握手的连接，如果 fd 是阻塞的，则进程被阻塞
const acceptedFd = accept(fd);  
// 当收到一个 TCP 连接时，accept 会返回对应的连接，通过 fd 表示，然后进行数据通信
read(acceptedFd);  
write(acceptedFd, 'hello');  
```

我们看一下这几个函数的作用。

socket：socket 函数用于从操作系统申请一个 socket 结构体，该结构体用于表示和对端通信的一个连接，但是目前它还没有绑定到具体的通信地址。因为 Linux 中万物皆文件，所以最后操作系统会返回一个 fd，fd 在操作系统中类似数据库的 id，操作系统底层维护了 fd 和对应的资源关系，比如网络、文件、管道等。后续调用操作系统的接口时，传入这个 fd 和相关的参数，操作系统就会根据 fd 操作对应的资源。在 TCP 中，socket 代表了一个虚拟的连接，它由源 IP、源端口、目的 IP和目的端口组成并唯一标识。
bind：bind 函数用于给 fd 对应的 socket 设置本端对应的地址（IP 和端口），对于服务器来说，通常需要显式调用 bind，这样客户端才知道通过哪个端口和服务器通信，如果没有显式设置，那么操作系统会选择一个随机的端口，然后再通过其他 API 获取操作系统为我们选择的端口。
listen：listen 函数用于修改 fd 对应的 socket 的状态为监听状态。只有监听状态的 socket 才可以接受客户端的连接。socket 可以分为两种，一种是监听型的，一种是通信型的，监听型的 socket 只负责接收连接，通信型的 socket 负责和客户端通信。
accept：accept 用于从操作系统中获取一个已经完成三次握手的连接，该函数默认会阻塞进程，直到有连接到来并完成三次握手。我们也可以调用其他函数修改 socket 为非阻塞模式，这样调用 accept 时，如果没有已完成三次握手的连接，操作系统不会阻塞进程，而是会返回一个错误码。
read：当操作系统收到对端发过来的数据时，会先把它保存到 socket 的接收缓冲区。当应用层调用 read 时，就会把队列中数据返回给应用层。
write：write 用于给服务器发送数据，不过通常并不是直接发送。因为这些数据只是保存到 socket 的发送缓冲区，底层会根据 TCP 协议决定什么时候发送数据。
执行完以上代码，就完成了一个服务器的启动，操作系统中的关系图如下所示。

tu 11-7

接下来看一下如何创建一个 TCP 客户端

```
const fd = socket(); 
// 绑定到具体的 IP 和端口，如果没有显式配置，则操作系统自己决定
bind(fd, ip, port);  
// 发起一个连接，IP 和 port 表示对端的地址，connect 默认会引起进程阻塞
const connectRet = connect(fd, ip, port);  
// 到这说明连接结束，如果 connectRet 为 0 说明成功，可以进行数据读写
write(fd, 'hello');  
read(fd);  

```

客户端比服务器稍微简单一点，看看这几个函数的作用。

socket：和服务器一样，客户端也需要申请一个 socket 用于和服务器通信。

bind：bind 函数用于给 fd 对应的 socket 设置本端对应的地址（IP 和端口）。和服务器不一样的是，客户端通常不需要调用 bind，操作系统会决定使用哪个地址作为客户端地址。

connect：connect 用于绑定服务器地址。当进程调用 connect 时，操作系统会执行三次握手，默认情况操作系统会阻塞进程，直到连接有结果，连接结果会通过 connect 返回值告诉调用方。如果三次握手成功，我们就可以开始读取 / 发送数据了。同样，我们也可以设置 socket 为非阻塞模式。这样发起连接时，操作系统会先返回一个错误码，我们可以借助事件驱动模块订阅 socket 的可写事件，等待可写事件触发时再通过其他系统调用函数来获取连接结果。

以上是 TCP 协议在底层的一些基础知识，Node.js 的 TCP 模块本质上是基于这些底层能力，再结合 V8 实现的。接下来，我们就来看看 Node.js 中是如何实现 TCP 模块的。

Node.js TCP 服务器的实现
启动服务器
在 Node.js 中，我们通常使用以下方式创建一个服务器。


```js
// 创建一个 TCP Server
const server = net.createServer((socket) => {
  // 处理连接
});

// 监听端口，启动服务器
server.listen(8888);
```

使用 net.createServer 可以创建一个服务器，然后拿到一个 Server 对象，接着调用 Server 对象的 listen 函数就可以启动一个 TCP 服务器了。下面来看一下具体的实现。


```js
function createServer(options, connectionListener) {  
  return new Server(options, connectionListener);  
}  
  
function Server(options, connectionListener) {  
  EventEmitter.call(this);  
  // 服务器收到的连接数，可以通过 maxConnections 限制并发连接数  
  this._connections = 0;  
  // C++ 层的对象，真正实现 TCP 功能的地方
  this._handle = null;  
  // 服务器下的连接是否允许半关闭，下一节课详细讲解  
  this.allowHalfOpen = options.allowHalfOpen || false;  
  // 有连接时是否注册可读事件，如果该 socket 是交给其他进程处理的话可以设置为 true 
  this.pauseOnConnect = !!options.pauseOnConnect;  
}  
```

createServer 返回的是一个一般的 JS 对象，继续看一下 listen 函数的逻辑，listen 函数逻辑很繁琐，但是原理大致是一样的，所以我们只讲解常用的情况。

```js
Server.prototype.listen = function(...args) {  
  /*
    处理入参，listen 可以接收很多种格式的参数，
    假设我们这里只传了 8888 端口号
  */
    const normalized = normalizeArgs(args);  
    //  normalized = [{port: 8888}, null];  
    const options = normalized[0]; 
    // 监听成功后的回调 
    const cb = normalized[1];  
    
    // listen 成功后执行的回调  
    if (cb !== null) {
        this.once('listening', cb);
    }
    listenIncluster(this, 
                    null, 
                    options.port | 0, 
                    4,      
                    ...); 
    return this;  
};  
```

listen 处理了入参后，接着调用了 listenIncluster。

```js
function listenIncluster(server, 
                         address, 
                         port, 
                         addressType,      
                         backlog, 
                         fd, 
                         exclusive) {  
  exclusive = !!exclusive;  
  if (cluster === null) cluster = require('cluster'); 
  if (cluster.isMaster || exclusive) {  
    server._listen2(address, port, addressType, backlog, fd);
    return;  
  }  
}  
```

我们只分析在主进程创建服务器的情况，子进程中创建服务器的逻辑在 Cluster 模块分析。listenIncluster 中执行了 _listen2，_listen2 对应的函数是 setupListenHandle。

```js
function setupListenHandle(address, port, addressType, backlog, fd) {  
    // 通过 C++ 层导出的 API 创建一个对象，该对象关联了 C++ 层的 TCPWrap 对象
    this._handle = new TCP(TCPConstants.SERVER);
    // 创建 socket 并绑定地址到 socket 中
    this._handle.bind(address, port); 
    // 有完成三次握手的连接时执行的回调  
    this._handle.onconnection = onconnection;  
    // 互相关联
    this._handle[owner_symbol] = this;
    // 执行 C++ 层 listen  
    this._handle.listen(backlog || 511);  
    // 触发 listen 回调  
    nextTick(this[async_id_symbol], emitListeningNT, this);  
}  
```

setupListenHandle 的逻辑如下。

调用 new TCP 创建一个 handle（new TCP 对象关联了 C++ 层的 TCPWrap 对象）。
保存处理连接的函数 onconnection，当有连接时被执行。
调用了 bind 绑定地址到 socket。
调用 listen 函数修改 socket 状态为监听状态。
首先看看 new TCP 做了什么。

```c++
void TCPWrap::New(const FunctionCallbackInfo<Value>& args) {
  new TCPWrap(env, args.This(), ...);
}

TCPWrap::TCPWrap(Environment* env, Local<Object> object, ProviderType provider)
    : ConnectionWrap(env, object, provider) {
  // 初始化一个 tcp handle
  int r = uv_tcp_init(env->event_loop(), &handle_);
}
```

new TCP 本质上是创建一个 TCP 层的 TCPWrap 对象，并初始化了 Libuv 的数据结构 uv_tcp_t（TCPWrap 是对 Libuv uv_tcp_t 的封装）。

接着看 bind，通过前面的学习，我们知道这时候会调用 C++ 层的 Bind。

```c++
template <typename T>
void TCPWrap::Bind(...) {
  // 通过 JS 对象拿到关联的 C++ TCPWrap 对象
  TCPWrap* wrap;
  ASSIGN_OR_RETURN_UNWRAP(&wrap,
                          args.Holder(),
                          args.GetReturnValue().Set(UV_EBADF));
  // 通过 JS 传入的地址信息直接调用 Libuv
  uv_tcp_bind(&wrap->handle_,
              reinterpret_cast<const sockaddr*>(&addr),
              flags);
}
```

Bind 函数的逻辑很简单，直接调用了 Libuv 函数。

```c
int uv_tcp_bind(...) {
  return uv__tcp_bind(handle, addr, addrlen, flags);
}

int uv__tcp_bind(uv_tcp_t* tcp,
                 const struct sockaddr* addr,
                 unsigned int addrlen,
                 unsigned int flags) {
  // 创建一个 socket，并把返回的 fd 保存到 tcp 结构体中
  maybe_new_socket(tcp, addr->sa_family, 0);

  on = 1;
  // 默认设置了 SO_REUSEADDR 属性，后面具体分析
  setsockopt(tcp->io_watcher.fd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on));
  // 绑定地址信息到 socket
  bind(tcp->io_watcher.fd, addr, addrlen);
  return 0;
}
```

uv__tcp_bind 创建了一个 TCP socket 然后把地址信息保存到该 socket 中，另外 Libuv 默认设置了 SO_REUSEADDR 标记，这个的意义我们在下节课分析。

执行 bind 绑定了地址信息后就继续调用 listen 把 socket 变成监听状态，C++ 层代码和 Bind 的差不多，就不再分析，直接看 Libuv 的代码。

```c
int uv_listen(uv_stream_t* stream, int backlog, uv_connection_cb cb) {
  uv_tcp_listen((uv_tcp_t*)stream, backlog, cb);
}

int uv_tcp_listen(uv_tcp_t* tcp, int backlog, uv_connection_cb cb) {
  static int single_accept = -1;
  unsigned long flags;
  int err;
  if (single_accept == -1) {
    const char* val = getenv("UV_TCP_SINGLE_ACCEPT");
    single_accept = (val != NULL && atoi(val) != 0); 
  }
  // 有连接时是否连续接收，或者间歇性处理，见后面分析
  if (single_accept)
    tcp->flags |= UV_HANDLE_TCP_SINGLE_ACCEPT;

  flags = 0;
  // 设置 flags 到 handle 上，因为已经创建了 socket
  maybe_new_socket(tcp, AF_INET, flags);
  listen(tcp->io_watcher.fd, backlog)
  // 保存回调，有连接到来时被 Libuv 执行
  tcp->connection_cb = cb;
  tcp->flags |= UV_HANDLE_BOUND;
  // 有连接来时的处理函数，该函数再执行上面的 connection_cb
  tcp->io_watcher.cb = uv__server_io;
  // 注册可读事件，等待连接到来
  uv__io_start(tcp->loop, &tcp->io_watcher, POLLIN);

  return 0;
}
```

uv_tcp_listen 首先调用了 listen 函数修改 socket 状态为监听状态，这样才能接收 TCP 连接，接着保存了 C++ 层的回调，并设置 Libuv 层的回调，最后注册可读事件等待 TCP 连接的到来。这里需要注意两个回调函数的执行顺序，当有 TCP 连接到来时 Libuv 会执行 uv__server_io，在 uv__server_io 里再执行 C++ 层的回调 cb。

至此，服务器就启动了。


### 处理连接

当有三次握手的连接完成时，操作系统会新建一个通信的 socket，并通知 Libuv，Libuv 会执行 uv__server_io。

```c
void uv__server_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  uv_stream_t* stream;
  int err;

  stream = container_of(w, uv_stream_t, io_watcher);
 
  uv__io_start(stream->loop, &stream->io_watcher, POLLIN);
  // 回调了可能关闭了 server，所以需要实时判断
  while (uv__stream_fd(stream) != -1) {
    // 摘取一个 TCP 连接，成功的话，err 保存了对应的 fd
    err = uv__accept(uv__stream_fd(stream));
    // 保存 fd 在 accepted_fd，等待处理
    stream->accepted_fd = err;
    // 执行回调
    stream->connection_cb(stream, 0);
    // 如果回调里没有处理该 accepted_fd，则注销可读事件、先不处理新的连接
    if (stream->accepted_fd != -1) {
      uv__io_stop(loop, &stream->io_watcher, POLLIN);
      return;
    }
    // 设置了 UV_HANDLE_TCP_SINGLE_ACCEPT 则进入睡眠，让其他进程有机会参与处理
    if (stream->type == UV_TCP &&
        (stream->flags & UV_HANDLE_TCP_SINGLE_ACCEPT)) {
      struct timespec timeout = { 0, 1 };
      nanosleep(&timeout, NULL);
    }
  }
}

```

uv__server_io 中通过 uv__accept 从操作系统中摘取一个完成连接的 TCP socket 并拿到一个 fd ，接着保存到 accepted_fd 中并执行 connection_cb 回调。

此外，我们需要注意 UV_HANDLE_TCP_SINGLE_ACCEPT 标记。因为可能有多个进程监听同一个端口，当多个连接到来时，多个进程可能会竞争处理这些连接（惊群问题）。这样一来，首先被调度的进程可能会直接处理所有的连接，导致负载不均衡。通过 UV_HANDLE_TCP_SINGLE_ACCEPT 标记，可以在通知进程接收连接时，每接收到一个后先睡眠一段时间，让其他进程也有机会接收连接，一定程度解决负载不均衡的问题，不过这个逻辑最近被去掉了，Libuv 维护者 bnoordhuis 的理由是，第二次调用 uv__accept 时有 99.9% 的概念会返回 EAGAIN，那就是没有更多的连接可以处理，这样额外调用 uv__accept 带来的系统调用开销是比较可观的，有兴趣的可以参考这个 [PR](https://github.com/libuv/libuv/pull/3696)。

接着我们看看 connection_cb，connection_cb 对应的是 C++ 层的 OnConnection。

```c++
// WrapType 为 TCPWrap，UVType 为 uv_tcp_t
template <typename WrapType, typename UVType>  
void ConnectionWrap<WrapType, UVType>::OnConnection(uv_stream_t* handle, int status) {  
    // HandleWrap 中保存了 handle 和 TCPWrap 的关系，这里取出来使用               
    WrapType* wrap_data = static_cast<WrapType*>(handle->data);  
    Environment* env = wrap_data->env();  
    Local<Value> argv[] = {  
        Integer::New(env->isolate(), status),  
        Undefined(env->isolate())  
    };  
    
    // 新建一个表示和客户端通信的对象，和 JS 层执行 new TCP 一样 
    Local<Object> client_obj = WrapType::Instantiate(env,wrap_data,WrapType::SOCKET);  
    WrapType* wrap;  
    // 从 client_obj 中取出关联的 TCPWrap 对象存到 wrap 中 
    ASSIGN_OR_RETURN_UNWRAP(&wrap, client_obj);  
    // 拿到 TCPWrap 中的 uv_tcp_t 结构体，再转成 uv_stream_t，因为它们类似父类和子类的关系
    uv_stream_t* client_handle = reinterpret_cast<uv_stream_t*>(&wrap->handle_);  
    // 把通信 fd 存储到 client_handle 中  
    uv_accept(handle, client_handle);
    argv[1] = client_obj;  
    // 回调上层的 onconnection 函数  
    wrap_data->MakeCallback(env->onconnection_string(), arraysize(argv), argv);  
}  
```

当建立了新连接时，操作系统会新建一个 socket。同样，在 Node.js 层，也会通过 Instantiate 函数新建一个对应的对象表示和客户端的通信。结构如下所示。

tu 11-8

Instantiate 代码如下所示。

```c++
MaybeLocal<Object> TCPWrap::Instantiate(Environment* env,
                                        AsyncWrap* parent,
                                        TCPWrap::SocketType type) {
  // 拿到导出到 JS 层的 TCP 构造函数（缓存在env中）
  Local<Function> constructor = env->tcp_constructor_template()
                                    ->GetFunction(env->context())
                                    .ToLocalChecked();
  Local<Value> type_value = Int32::New(env->isolate(), type);
  // 相当于我们在 JS 层调用 new TCP() 时拿到的对象
  return handle_scope.EscapeMaybe(
      constructor->NewInstance(env->context(), 1, &type_value));
}
```

新建完和对端通信的对象后，接着调用 uv_accept 消费刚才保存在 accepted_fd 中的 fd，并把对应的 fd 保存到 C++ TCPWrap 对象的 uv_tcp_t 结构体中。

```c++
int uv_accept(uv_stream_t* server, uv_stream_t* client) {
  int err;
  // 把 accepted_fd 保存到 client 中
  uv__stream_open(client,
                  server->accepted_fd,
                  UV_HANDLE_READABLE | UV_HANDLE_WRITABLE);
  // 处理了，重置该字段
  server->accepted_fd = -1;
  // 保证注册了可读事件，继续处理新的连接
  uv__io_start(server->loop, &server->io_watcher, POLLIN);
  return err;
}
```

C++ 层拿到一个新的对象并且保存了 fd 到对象后，接着回调 JS 层的 onconnection。

```js
// clientHandle 代表一个和客户端建立 TCP 连接的实体  
function onconnection(err, clientHandle) {  
  const handle = this;  
  const self = handle.owner;  
  // 建立过多，关掉  
  if (self.maxConnections && self._connections >= self.maxConnections) {  
    clientHandle.close();  
    return;  
  }  
  // 新建一个 socket 用于通信  
  const socket = new Socket({  
    handle: clientHandle,  
    allowHalfOpen: self.allowHalfOpen,  
    pauseOnCreate: self.pauseOnConnect  
  });  
  // 服务器的连接数加一  
  self._connections++;  
  // 触发用户层连接事件  
  self.emit('connection', socket); 
} 
```

在 JS 层也会封装一个 Socket 对象用于管理和客户端的通信，整体的关系如下。

tu 11-9

接着触发 connection 事件，剩下的事情就是应用层处理了。

## Node.js TCP 客户端的实现

了解了服务器的实现后，接下来看看客户端的实现。在 Node.js 中，我们可以通过 net.connect 发起 TCP 连接，下面具体来分析下 connect 函数。

```js
function connect(...args) {  
  // 处理参数  
  const normalized = normalizeArgs(args);  
  const options = normalized[0];  
  // 申请一个 socket 表示一个客户端  
  const socket = new Socket(options);  
  // 设置超时，超时后会触发 timeout，用户可以自定义处理超时逻辑
  if (options.timeout) {  
    socket.setTimeout(options.timeout);  
  }  
  // 调用 socket 的 connect  
  return socket.connect(normalized);
}  
```

从代码中可以看到，connect 函数是对 Socket 对象的封装，Socket 表示一个通信的端点。我们主要分析 new Socket 和 Socket 的 connect。那么，新建一个客户端 Socket 对象都做了什么事情呢？

```js
function Socket(options) {
  // 是否正在建立连接，即三次握手中  
  this.connecting = false;
  // 对应的底层 handle，比如 TCPWrap 对象
  this[kHandle] = null;
  // 是否允许半开关，即收到对端 fin 包后是否默认也发送 fin 包给对端（四次挥手）来断开连接
  options.allowHalfOpen = Boolean(options.allowHalfOpen);
  // Socket 是全双工流
  stream.Duplex.call(this, options);
  // 注册读端关闭的回调 
  this.on('end', onReadableStreamEnd);
}
```

Socket 是对 C++ 模块 TCPWrap 的封装，主要初始化了一些属性和监听一些事件，这里简单列了一些字段。创建了一个 socket 后，接着看一下 socket 的 connect 函数。

```js
// 建立连接，即三次握手  
Socket.prototype.connect = function(...args) {  
  const normalized = normalizeArgs(args);
  const options = normalized[0];  
  const cb = normalized[1]; 
  // 创建一个 C++ 层的 TCPWrap 对象表示客户端  
  this._handle = new TCP(TCPConstants.SOCKET); 
  // 设置 handle 关联的 JS socket 对象
  self._handle[owner_symbol] = self;
  // 有数据可读时的回调 
  self._handle.onread = onStreamRead;
  // 可能需要 DNS 解析，解析成功再发起连接  
  lookupAndConnect(this, options);  
  return this;  
};  
```

connect 函数主要是 3 个逻辑。

首先通过 new TCP() 创建一个底层的 C++ 对象。
设置可读回调。
做 DNS 解析（如果需要的话），然后发起三次握手。
new TCP 刚才已经分析过了，所以这里就不再分析，直接看 lookupAndConnect。lookupAndConnect 主要是对参数进行校验，如果传的是域名，就进行 DNS 解析，否则就不解析。

```js
function lookupAndConnect(self, options) {
    const { localAddress, localPort } = options;
    const host = options.host || 'localhost';
    let { port } = options;
    port |= 0;
    // 是 IP，则不需要 DNS 解析，直接连接
    const addressType = isIP(host);
    if (addressType) {
        internalConnect(self, host, port, addressType, localAddress, localPort);
    } else {
        lookup(host, dnsopts, function emitLookup(err, ip, addressType) {
          internalConnect(self, ip, port, addressType, localAddress, localPort);
        });
    }
}
```

最终拿到 IP 后就可以发起连接了。

```js
function internalConnect(  
  self,   
  // 需要连接的服务器的 IP、端口  
  address,   
  port,   
  addressType,   
  /*
      用于和对端连接的本地 IP、端口，
      如果不设置，则操作系统自己决定  
  */
  localAddress,   
  localPort) {  
  var err;  
   /*
      如果传了本地的地址或端口，则 TCP 连接中的源 IP
      和端口就是传的，否则由操作系统自己选
  */  
  if (localAddress || localPort) {  
      // IP v4  
    if (addressType === 4) {  
      localAddress = localAddress || '0.0.0.0';  
      // 绑定本地地址和端口到 handle，即使用本主机的哪个 IP 和端口发起连接
      err = self._handle.bind(localAddress, localPort);  
    } else if (addressType === 6) {  
      localAddress = localAddress || '::';  
      err = self._handle.bind6(localAddress, localPort);  
    }   
  }  
    // 对端的地址信息
  if (addressType === 6 || addressType === 4) {  
    // 新建一个请求对象，C++ 层定义  
    const req = new TCPConnectWrap();  
    // 设置一些列属性  
    req.oncomplete = afterConnect;  
    req.address = address;  
    req.port = port;  
    req.localAddress = localAddress;  
    req.localPort = localPort;  
    // 调用底层对应的函数  
    if (addressType === 4)  
      err = self._handle.connect(req, address, port);  
    else  
      err = self._handle.connect6(req, address, port);  
  }  
}  
```

这里的代码比较多，主要的逻辑是 bind 和 connect。bind 函数前面已经讲解过了，它就是给 socket 设置客户端 IP 和端口的值。我们主要来分析 connect，把 connect 这段逻辑拎出来。

```js
const req = new TCPConnectWrap();  
// 设置一些列属性  
req.oncomplete = afterConnect;  
req.address = address;  
req.port = port;  
req.localAddress = localAddress;  
req.localPort = localPort;  
// 调用底层对应的函数  
self._handle.connect(req, address, port); 
```

TCPConnectWrap 是 C++ 层提供的类，用来表示一个 TCP 连接请求的上下文，connect 对应C++ 层的 Conenct。

```c++
void TCPWrap::Connect(const FunctionCallbackInfo<Value>& args) {
  int port = static_cast<int>(args[2].As<Uint32>()->Value());
  Connect<sockaddr_in>(args, [port](const char* ip_address, sockaddr_in* addr) {
      return uv_ip4_addr(ip_address, port, addr);
  });
}
```

这里把 JS 层传入的 IP 和端口取出来，继续调另一个 Connect。

```c++
template <typename T>
void TCPWrap::Connect(const FunctionCallbackInfo<Value>& args,
    std::function<int(const char* ip_address, T* addr)> uv_ip_addr) {
    
  Environment* env = Environment::GetCurrent(args);

  TCPWrap* wrap;
  // 拿到 C++ 层的 TCPWrap
  ASSIGN_OR_RETURN_UNWRAP(&wrap,
                          args.Holder(),
                          args.GetReturnValue().Set(UV_EBADF));

  Local<Object> req_wrap_obj = args[0].As<Object>();
  node::Utf8Value ip_address(env->isolate(), args[1]);

  T addr;
  int err = uv_ip_addr(*ip_address, &addr);

  if (err == 0) {
    // req_wrap 和 req_wrap_obj 互相关联
    ConnectWrap* req_wrap = new ConnectWrap(env, req_wrap_obj, ...);
    // 发起请求，即调用 uv_tcp_connect 发起一个 TCP 连接
    err = req_wrap->Dispatch(uv_tcp_connect,
                             &wrap->handle_,
                             reinterpret_cast<const sockaddr*>(&addr),
                             // 连接结束后执行的回调
                             AfterConnect);
  }
  args.GetReturnValue().Set(err);
}

```

接着进入了 Libuv 层。

```c
int uv__tcp_connect(uv_connect_t* req,
                    uv_tcp_t* handle,
                    const struct sockaddr* addr,
                    unsigned int addrlen,
                    uv_connect_cb cb) {
  int err;
  int r;

  // 申请一个 socket 并保存 fd 到 handle 中
  err = maybe_new_socket(handle,
                         addr->sa_family,
                         UV_HANDLE_READABLE | UV_HANDLE_WRITABLE);
  // 以非阻塞的方式发起一个 TCP 连接
  connect(uv__stream_fd(handle), addr, addrlen);
 
  // 初始化一个 request，并设置某些字段
  uv__req_init(handle->loop, req, UV_CONNECT);
  req->cb = cb;
  // 保存关联的 handle
  req->handle = (uv_stream_t*) handle;
  QUEUE_INIT(&req->queue);
  handle->connect_req = req;
  // 注册到 IO 观察者队列，handle->io_watcher 已经保存了 fd
  uv__io_start(handle->loop, &handle->io_watcher, POLLOUT);

  return 0;
}
```

uv__tcp_connect 以非阻塞的方式发起 TCP 连接，这样就不会阻塞线程，接着把相关请求信息保存到请求对象中，最后注册可写事件，等待连接结果。执行完的结构图如下（ConnectWrap 继承 ReqWrap，TCPWrap 继承 HandleWrap）。

tu 11-10

连接结束后就会执行 uv__stream_connect，该函数在流机制的课程中已经讲过，就不再具体分析，它主要是获取连接结果，然后执行 C++ 层的 AfterConnect。

```c++
template <typename WrapType, typename UVType>
void ConnectionWrap<WrapType, UVType>::AfterConnect(uv_connect_t* req,
                                                    int status) {
  // 根据引用关系拿到请求对应的 JS 层请求上下文，
  // 具体是在发起 connect 时设置的（void ReqWrap<T>::Dispatched()）
  std::unique_ptr<ConnectWrap> req_wrap(static_cast<ConnectWrap*>(req->data));
  
  // 根据引用关系拿到请求对应的 C++ 层 TCPWrap 对象，具体是 HandleWrap::HandleWrap 设置的
  WrapType* wrap = static_cast<WrapType*>(req->handle->data);
  Environment* env = wrap->env();

  Local<Value> argv[5] = {
    Integer::New(env->isolate(), status),
    wrap->object(),
    req_wrap->object(),
    ...
  };
  // 执行 JS 层 oncomplete 回调函数
  req_wrap->MakeCallback(env->oncomplete_string(), arraysize(argv), argv);
}
```

AfterConnect 会执行 oncomplete 属性对应的函数，对应的是 JS 层的 afterConnect。

```js
function afterConnect(status, handle, req, readable, writable) {
  // 获取 C++ 层对象关联的 JS socket 对象，在创建 socket 对象时设置的
  const self = handle[owner_symbol];
  // 触发 connect 事件
  self.emit('connect');
  // 如果需要开启读操作，则注册可读事件
  if (readable && !self.isPaused())
    self.read(0);
}
```

这样就完成了 TCP连接，一般情况下，连接成功后，JS 层会调用 self.read(0) 注册等待可读事件，我们下节课再详细讲解。

总结
TCP 协议是 TCP / IP 协议簇中非常重要且复杂的协议，这一节课我们首先介绍了 TCP 协议的概念和特性。

面向连接：通信前需要先建立连接，使用完需要关闭（主动关闭或者空闲时间达到阈值由操作系统关闭）。

可靠：发送端通过超时重发和确认等机制确保数据发送到对端。

流式协议：把数据当作 01 比特流传输，不感知所承载的数据格式，数据由上层解释。

全双工：通信两端可以同时发送和接收数据，两端都有自己的发送和接收缓冲区。

我们需要对这 TCP 协议的核心概念有深入的理解才能更好地理解 TCP 协议的工作原理。这样我们学习和使用 RPC 或者 HTTP 等协议时也会更容易。

接着我们讲了在网络编程中如何通过 TCP 协议进行通信。TCP 通信涉及服务器和客户端两个端。

服务器首先申请一个 socket，然后调用 bind 绑定地址，接着通过 listen 进入监听状态，有连接到来时通过 accept 进行处理。

客户端相比来说简单点，客户端也是需要先申请一个 socket，然后通过 connect 发起对服务器的连接就行，我们也可以选择通过 bind 绑定本地地址到 socket 中，但是通常不需要。

讲完基础部分后，最后我们深入分析了 Node.js 中 TCP 服务器和客户端的实现。它本质上是结合网络编程和 V8 实现的。

服务器的实现：Node.js 中，通过 createServer() 可以创建一个服务器，接着调用它的 listen 函数就可以启动服务器，listen 函数本质上是对操作系统 bind 和 listen 的封装，执行完 listen 后，Node.js 注册了可读事件等待连接的到来，当新连接到来时，操作系统会通知 Node.js，从而 Node.js 处理该连接。

客户端的实现：Node.js 中，通过 net.connect 可以发起一个 TCP 连接，connect 本质上是对操作系统 bind 和 connect 的封装，调用 connect 函数后，Node.js 注册了等待可写事件，接着操作系统会发起三次握手，等待连接结束后，操作系统会通知 Node.js，Node.js 通过系统 API 获取连接结果。

深入理解 Node.js 中 TCP 服务器和客户端的实现，不仅可以帮助我们更好地使用 Node.js，同时碰到问题时我们也可以自己排查。

下一节课我们会在服务器和客户端建立的 TCP 连接的基础上讲解数据通信、连接管理以及 TCP 常用的一些特性。