# Node.js TCP 数据通信的实现

建立了 TCP 连接后，我们就可以在这个连接上进行数据通信，下面我们来详细讲解数据通信的内容。

读操作
上节课讲过，建立 TCP 连接后，Node.js 会创建一个 socket 对象来表示通信的一端。那么，socket 的读操作逻辑是怎样的呢？连接成功后，socket 会通过 read 函数在底层注册等待可读事件。

```js
function afterConnect(status, handle, req, readable, writable) {
  // self 是 JS 层的 Socket 对象
  const self = handle[owner_symbol];
  // 则注册可读事件
  self.read(0);
}
```

因为 Socket 继承了 Readable，所以调用 read 时执行的是 Readable 的 read 函数。

```js
Readable.prototype.read = function(n) {
    this._read(state.highWaterMark);
};
```

_read 函数是由 Socket 实现。

```js
Socket.prototype._read = function(n) {
  tryReadStart(this);
};

function tryReadStart(socket) {
  socket._handle.reading = true;
  socket._handle.readStart();
}
```

最终调用了 _handle 的 readStart（_handle 是 new TCP 返回的对象，关联了 C++ 层的 TCPWrap 对象），该函数在 TCPWrap 的父类中定义，对应为 StreamBase::ReadStartJS 函数。关键代码在 tcp_wrap.cc 的下面这一句。

```c++
// t 为 JS 层使用的 TCP 函数模版，即上面的 _handle
t->Inherit(LibuvStreamWrap::GetConstructorTemplate(env));
```

接着看一下 LibuvStreamWrap::GetConstructorTemplate。

```c++
Local<FunctionTemplate> LibuvStreamWrap::GetConstructorTemplate(
    Environment* env) {
  Local<FunctionTemplate> tmpl = env->libuv_stream_wrap_ctor_template();
  if (tmpl.IsEmpty()) {
    // 新的函数模版 LibuvStreamWrap
    tmpl = env->NewFunctionTemplate(nullptr);
    tmpl->SetClassName(FIXED_ONE_BYTE_STRING(env->isolate(), "LibuvStreamWrap"));
    // 忽略一些不相关代码
    // 新增一些 StreamBase 中的方法
    StreamBase::AddMethods(env, tmpl);
    env->set_libuv_stream_wrap_ctor_template(tmpl);
  }
  return tmpl;
}
```

继续看 StreamBase::AddMethods 的关键代码。

```c++
env->SetProtoMethod(t, "readStart", JSMethod<&StreamBase::ReadStartJS>);
env->SetProtoMethod(t, "readStop", JSMethod<&StreamBase::ReadStopJS>);
```

因为 C++ 层导出的 TCP 函数继承了 LibuvStreamWrap， LibuvStreamWrap 中通过 StreamBase::AddMethods 定义了 readStart，所以可以在 _handle 中直接使用 readStart，接下来继续分析 readStart。readStart 对应函数是 JSMethod，这是个模版函数。

```c++
template <int (StreamBase::*Method)(const FunctionCallbackInfo<Value>& args)>
void StreamBase::JSMethod(const FunctionCallbackInfo<Value>& args) {
  // 拿到 JS 对象关联的 TCPWrap 对象
  StreamBase* wrap = StreamBase::FromObject(args.Holder().As<Object>());
  args.GetReturnValue().Set((wrap->*Method)(args));
}
```

JSMethod 首先根据 JS 对象拿到 C++ 对象，然后执行它的 ReadStartJS 函数。

```c++
int StreamBase::ReadStartJS(const FunctionCallbackInfo<Value>& args) {
  return ReadStart();
}
```

ReadStart 由 LibuvStreamWrap（LibuvStreamWrap 是 StreamBase 子类，TCPWrap 的父类） 定义，具体在 stream_wrap.cc。

```c++
// 注册读事件  
int LibuvStreamWrap::ReadStart() {
  return uv_read_start(
   stream(),
   [](uv_handle_t* handle, size_t suggested_size, uv_buf_t* buf) {
     // 分配存储数据的内存
     static_cast<LibuvStreamWrap*>(handle->data)->OnUvAlloc(suggested_size, buf);
   },
   [](uv_stream_t* stream, ssize_t nread, const uv_buf_t* buf) {
     LibuvStreamWrap* wrap = static_cast<LibuvStreamWrap*>(stream->data);
     // 读取数据的回调  
     wrap->OnUvRead(nread, buf);
   });
} 
```

ReadStart 中调用 uv_read_start 往 Libuv 注册了等待可读事件，然后在有数据可读时执行 OnUvRead 函数，最终执行 JS 层的 onread 回调，对应函数为 onStreamRead。

```js
function onStreamRead(arrayBuffer) {
  const nread = streamBaseState[kReadBytesOrError];

  const handle = this;
  // 获取关联的流，这里是 socket 对象
  const stream = this[owner_symbol];
  // 有数据
  if (nread > 0 && !stream.destroyed) {
    let ret;
    // 把数据 push 到可读流中，一般是触发 data 事件
    let result = stream.push(...);
    // 返回 false 说明累积的数据达到阈值，停止读操作
    if (!result) {
      handle.reading = false;
      handle.readStop();
    }
    return ret;
  }
  
  if (nread === 0) {
    return;
  }
  
  // 不等于流结束的错误码，说明读出错了，关闭连接
  if (nread !== UV_EOF) {
    stream.destroy(errnoException(nread, 'read'));
    return;
  }
  
  // 没有数据可以读了，push null 表示可读流结束
  stream.push(null);
   /*
    执行 read，如果流中没有缓存的数据则会触发 end 事件，
    否则等待消费完后再触发  
  */
  stream.read(0);
}
```

socket 可读事件触发时，大概有下面几种情况。

有数据则把数据追加到流中，并触发 data 事件通知用户。
没有有效数据可读，忽略。
读出错，销毁流，即关闭连接。
读结束。
前 3 种情况很好理解，这里我们重点分析下第 4 种情况。新建一个 socket 的时候注册了读结束的处理函数 onReadableStreamEnd。

```js
function onReadableStreamEnd() {
  // 不允许半关闭
  if (!this.allowHalfOpen) {
    // 修改 write 函数，用户再调用 write 的函数则报错 This socket has been ended by the other party
    this.write = writeAfterFIN;
    // 如果还可写，则发送 fin 给对端，说明不会再发送数据了
    if (this.writable)
      this.end();
  }
  // 如果没有待发送的数据并且不可写了则销毁流
  if (!this.destroyed && !this.writable && !this.writableLength)
    this.destroy();
}
```

当 socket 的读端结束时，如果写端没有结束，则判断 allowHalfOpen 是否允许半关闭，不允许半开关则关闭写端（该逻辑在新版 Node.js 有所改动），如果后续再调用 write 则会报错 This socket has been ended by the other party。

写操作
接着来看 socket 写入数据的逻辑。Socket 继承 Writable 流，所以执行 write 时调用 Writable 的 write 函数。

```js
Writable.prototype.write = function(chunk, encoding, cb) {
  const state = this._writableState;
  // 返回是否还能继续写，false 的话最好不要继续调用 write，否则内存挤压数据过多
  return writeOrBuffer(this, state, chunk, encoding, cb);
};

function writeOrBuffer(stream, state, chunk, encoding, cb) {
  
  const len = state.objectMode ? 1 : chunk.length;
  // 等待写的数据长度
  state.length += len;
  // 是否超过了阈值
  const ret = state.length < state.highWaterMark;
  doWrite(stream, state, false, len, chunk, encoding, cb);
  // 返回是否还可以继续写
  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  stream._write(chunk, encoding, ...);
}
```

write 是通用的逻辑，具体的写入逻辑由子类的 _write 实现，这里是 Socket。

```js
// 单个写  
Socket.prototype._write = function(data, encoding, cb) {  
  this._writeGeneric(false, data, encoding, cb);  
};  

Socket.prototype._writeGeneric = function(writev, data, encoding, cb) {  
  writeGeneric(this, data, encoding, cb);
};  

function writeGeneric(self, data, encoding, cb) {
  const req = new WriteWrap();
  const handle = self[kHandle];
  req.handle = handle;
  req.oncomplete = onWriteComplete;
  req.async = false;
  req.bytes = 0;
  req.buffer = null;
  
  handle.writeUtf8String(req, data);
  return req;
}
```

writeGeneric 创建一个写请求对象，然后调用 writeUtf8String，writeUtf8String 对应 C++ 函数为 JSMethod<&StreamBase::WriteString>。

```c++
template <enum encoding enc>
int StreamBase::WriteString(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  
  Local<Object> req_wrap_obj = args[0].As<Object>();
  Local<String> string = args[1].As<String>();
  // 计算要发送的数据的大小
  size_t storage_size = // 忽略细节处理
  
  char stack_storage[16384];  // 16kb
  size_t data_size;
  size_t synchronously_written = 0;
  uv_buf_t buf;
  // 是否可以直接发送（小于 16kb 并且不需要发送文件描述符），还是等待可写事件
  bool try_write = storage_size <= sizeof(stack_storage) && (!IsIPCPipe() || send_handle_obj.IsEmpty());
  if (try_write) {
    // 数据编码处理
    data_size = StringBytes::Write(env->isolate(),
                                   stack_storage,
                                   storage_size,
                                   string,
                                   enc);
    buf = uv_buf_init(stack_storage, data_size);

    uv_buf_t* bufs = &buf;
    size_t count = 1;
    // 尝试直接发送，count 保存了剩余的 buf 数
    const int err = DoTryWrite(&bufs, &count);
    // 失败或者发完了就直接返回
    if (err != 0 || count == 0) {
      SetWriteResult(StreamWriteResult { false, err, nullptr, data_size });
      return err;
    }
  }
  // 忽略细节处理
  // 继续发剩下的
  Write(&buf, 1, send_handle, req_wrap_obj);
}
```
WriteString 首先计算发送数据的大小，如果满足条件则会先尝试直接进行发送，否则注册等待可写事件，等事件触发后再发送。我们只看 Write 函数。

```c++
inline StreamWriteResult StreamBase::Write(
    uv_buf_t* bufs,
    size_t count,
    uv_stream_t* send_handle,
    v8::Local<v8::Object> req_wrap_obj) {
  Environment* env = stream_env();
  int err;

  // 创建一个用于请求Libuv的写请求对象，和 ConnectWrap 类似
  WriteWrap* req_wrap = CreateWriteWrap(req_wrap_obj);
  // 执行写
  DoWrite(req_wrap, bufs, count, send_handle);
 
}
```
Write 是通用的逻辑，最终通过子类的 DoWrite 实现数据的发送。对于 TCP 模块来说是LibuvStreamWrap 中的 DoWrite 函数。

```c++
int LibuvStreamWrap::DoWrite(WriteWrap* req_wrap,
                             uv_buf_t* bufs,
                             size_t count,
                             uv_stream_t* send_handle) {
  LibuvWriteWrap* w = static_cast<LibuvWriteWrap*>(req_wrap);
  return w->Dispatch(uv_write2,
                     stream(),
                     bufs,
                     count,
                     send_handle,
                     AfterUvWrite);
}
```

最终调用 Libuv 的 uv_write2 发送数据，就是我们前面课程介绍的 Libuv 流机制，Libuv 把数据写入操作系统后，就执行 C++ 的 AfterUvWrite 回调。

```c++
void LibuvStreamWrap::AfterUvWrite(uv_write_t* req, int status) {
  // 拿到写请求的 C++ 对象
  LibuvWriteWrap* req_wrap = static_cast<LibuvWriteWrap*>(LibuvWriteWrap::from_req(req));
  req_wrap->Done(status);
}

inline void StreamReq::Done(int status, const char* error_str) {
  // 执行子类的OnDone
  OnDone(status);
}

// 请求Libuv结束后的回调
inline void WriteWrap::OnDone(int status) {
  stream()->EmitAfterWrite(this, status);
}

inline void StreamResource::EmitAfterWrite(WriteWrap* w, int status) {
  listener_->OnStreamAfterWrite(w, status);
}

// 实现写结束时的处理逻辑
inline void StreamListener::OnStreamAfterWrite(WriteWrap* w, int status) {
  previous_listener_->OnStreamAfterWrite(w, status);
}

void ReportWritesToJSStreamListener::OnStreamAfterWrite(
    WriteWrap* req_wrap, int status) {
  OnStreamAfterReqFinished(req_wrap, status);
}

void ReportWritesToJSStreamListener::OnStreamAfterReqFinished(
    StreamReq* req_wrap, int status) {
  // 请求所操作的流
  StreamBase* stream = static_cast<StreamBase*>(stream_);
  Environment* env = stream->stream_env();
  AsyncWrap* async_wrap = req_wrap->GetAsyncWrap();
  // 获取原始的 JS 层对象
  Local<Object> req_wrap_obj = async_wrap->object();

  Local<Value> argv[] = {
    Integer::New(env->isolate(), status),
    stream->GetObject(),
    Undefined(env->isolate())
  };

  // 回调 JS 层
  if (req_wrap_obj->Has(env->context(), env->oncomplete_string()).FromJust())
    async_wrap->MakeCallback(env->oncomplete_string(), arraysize(argv), argv);
}
```

这里的逻辑非常复杂和繁琐，主要是利用了 C++ 层的流机制，我们需要梳理清楚它们的关系才能知道整个流程是怎样的，有兴趣的可以看这篇[文章](https://theanarkh.github.io/understand-nodejs/chapter06-C%2B%2B%E5%B1%82/)。最终调用 JS 的回调 onWriteComplete 函数，也就是 Writable 的回调，Writable 会继续下一次数据的发送（如果有的话），如此类推。



# Node.js TCP 连接的管理
完成了数据通信后，我们需要主动关闭连接，以免浪费资源。上一节课讲过 TCP 是全双工的，支持关闭读端 / 写端或者全部关闭（Node.js 中没有单独关闭读端的概念，对端关闭写端就行）。下面我们来具体分析。

关闭写操作
当发送完数据后，可以通过调用 socket 对象的 end 函数关闭流的写端。看一下 end 的逻辑。

```js
Socket.prototype.end = function(data, encoding, callback) {  
  stream.Duplex.prototype.end.call(this, 
                                   data, 
                                   encoding, 
                                   callback);  
};  
```

Socket 的 end 是调用的 Duplex 的 end，而 Duplex 的 end 是继承于 Writable 的 end。Writable 的 end 最终会执行 _final 函数（所有数据写到操作系统后）。

```js
Socket.prototype._final = function(cb) {
  const req = new ShutdownWrap();
  req.oncomplete = afterShutdown;
  req.handle = this._handle;
  req.callback = cb;
  this._handle.shutdown(req);
};
```

_final 中调用了 shutdown 关闭 socket 到写端，对应 C++ 函数为 StreamBase::Shutdown。

```c++
int StreamBase::Shutdown(const FunctionCallbackInfo<Value>& args) {
  Local<Object> req_wrap_obj = args[0].As<Object>();
  return Shutdown(req_wrap_obj);
}

int StreamBase::Shutdown(v8::Local<v8::Object> req_wrap_obj) {
  Environment* env = stream_env();
  // 创建一个关闭请求对象，和前面的 ConnectWrap 类似
  ShutdownWrap* req_wrap = CreateShutdownWrap(req_wrap_obj);
  DoShutdown(req_wrap);
}

int LibuvStreamWrap::DoShutdown(ShutdownWrap* req_wrap_) {
  LibuvShutdownWrap* req_wrap = static_cast<LibuvShutdownWrap*>(req_wrap_);
  return req_wrap->Dispatch(uv_shutdown, stream(), AfterUvShutdown);
}
```


最终调用 uv_shutdown 关闭流的写端，关闭完成后，执行 C++ 的回调函数 AfterUvShutdown。

```c++
void LibuvStreamWrap::AfterUvShutdown(uv_shutdown_t* req, int status) {
  LibuvShutdownWrap* req_wrap = static_cast<LibuvShutdownWrap*>(
      LibuvShutdownWrap::from_req(req));
  req_wrap->Done(status);
}

void StreamReq::Done(int status, const char* error_str) {
  OnDone(status);
}

void ShutdownWrap::OnDone(int status) {
  stream()->EmitAfterShutdown(this, status);
}

void StreamResource::EmitAfterShutdown(ShutdownWrap* w, int status) {
  DebugSealHandleScope handle_scope(v8::Isolate::GetCurrent());
  listener_->OnStreamAfterShutdown(w, status);
}

void ReportWritesToJSStreamListener::OnStreamAfterShutdown(
    ShutdownWrap* req_wrap, int status) {
  OnStreamAfterReqFinished(req_wrap, status);
}

void ReportWritesToJSStreamListener::OnStreamAfterReqFinished(
    StreamReq* req_wrap, int status) {
  async_wrap->MakeCallback(env->oncomplete_string(), arraysize(argv), argv);
}
```

上面的逻辑比较绕，主要还是 C++ 层的流机制相关，不深究也没关系。C++ 层最终调用了 JS 层的 afterShutdown。

```js
function afterShutdown(status, handle, req) {  
  // 拿到 JS socket 对象
  const self = this.handle[owner_symbol];
  // 执行回调
  this.callback();

  // Callback may come after call to destroy.
  if (self.destroyed)
    return;
  // 如果读端也不可读了，则销毁socket
  if (!self.readable || self.readableEnded) {
    self.destroy();
  }
}  
```

销毁

当一个 socket 不可读也不可写或者出错时， Node.js 内部会调用 destroy 函数销毁 socket，我们也可以主动调用 destroy 销毁 socket，例如如下代码。

```js
const net = require('net');
net.createServer((socket) => {
    socket.destroy();
}).listen(8888);
```

我们发现 Socket 本身没有 destroy 函数，不过 Socket 继承了 Duplex，来看一下 Duplex 这个函数。

```js
function Duplex(options) {
  // ...
  Readable.call(this, options);
  Writable.call(this, options);
}
```

Duplex 又继承了 Readable 和 Writable 的能力，但是我们发现 Readable 和 Writable 都有 destroy 函数。

```js
Writable.prototype.destroy = function(err, cb) {};

Readable.prototype.destroy = destroyImpl.destroy;
```
那么到底调了哪个呢？_stream_duplex.js 中有一个关键的操作。

```js
// Duplex 继承 Readable 能力
ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
ObjectSetPrototypeOf(Duplex, Readable);
// Duplex 也继承 Writable，但是如果已经实现了则不会覆盖
{
  for (const method of ObjectKeys(Writable.prototype)) {
    if (!Duplex.prototype[method])
      Duplex.prototype[method] = Writable.prototype[method];
  }
}
```

从上面代码中可以看到，优先使用的是 Readable 中的 destroy 函数，所以最终调用的是 Readable 的 destroy 函数，我们看下具体的函数实现。

```js
function destroy(err, cb) {
  const r = this._readableState;
  const w = this._writableState;
  // 设置状态
  if (w) {
    w.destroyed = true;
  }
  if (r) {
    r.destroyed = true;
  }
  // 调用子类的 _destroy
  this._destroy(err || null, (err) => {
    // 触发 close 事件
    process.nextTick(emitCloseNT, this);
  });

  return this;
}
```

destroy 只是实现了通用逻辑，具体操作由子类（这里是 Socket 对象）的 _destroy 实现资源的销毁。

```js
Socket.prototype._destroy = function(exception, cb) {  
   // 关闭底层 handle  
   this._handle.close();
   this._handle = null;
} 
```

_destory 函数调用了 _handle 的 close 函数关闭底层的资源（不知道大家是否还记得 this._handle = null 的作用。），这里的 close 是 HandleWrap 的 close 函数，最终调用了 Libuv 的 uv_close。

```c++
void uv_close(uv_handle_t* handle, uv_close_cb close_cb) {
  switch (handle->type) {
      case UV_TCP:
        uv__tcp_close((uv_tcp_t*)handle);
        break;
  }
}

void uv__tcp_close(uv_tcp_t* handle) {
  uv__stream_close((uv_stream_t*)handle);
}

void uv__stream_close(uv_stream_t* handle) {
  if (handle->io_watcher.fd != -1) {
      uv__close(handle->io_watcher.fd);
    handle->io_watcher.fd = -1;
  }
}
```
前面课程已经分析过就不再具体分析，这里重点提一下 uv__close。uv__close 调用了操作系统的 close 函数关闭 fd，从而开始四次挥手的流程，最终完成连接的关闭。下面是操作系统中关闭一个 TCP socket 的流程。

```c++
static void tcp_close(struct sock *sk, int timeout)
{
    // 修改 socket 状态
    tcp_close_state(sk,1);
    // 发送 fin 包，第一次握手
    tcp_send_fin(sk);
}

static int tcp_close_state(struct sock *sk, int dead)
{   
    // 默认状态是关闭
    int ns=TCP_CLOSE;
    // 默认不需要发送fin包
    int send_fin=0;
    switch(sk->state)
    {   
        case TCP_ESTABLISHED: 
            ns=TCP_FIN_WAIT1;
            send_fin=1;
            break;
    }
    // 修改 socket 状态为 TCP_FIN_WAIT1
    tcp_set_state(sk,ns);
    return send_fin;
}

static void tcp_send_fin(struct sock *sk)
{
    struct proto *prot =(struct proto *)sk->prot;
    // dummy_th 保存了本端发送数据给对端时的 TCP 报文，参考 TCP 协议格式
    struct tcphdr *th =(struct tcphdr *)&sk->dummy_th;
    struct tcphdr *t1;
    struct sk_buff *buff;
    struct device *dev=NULL;
    int tmp;
        
    // 分配内存保存 fin 包的数据
    buff = prot->wmalloc(sk, MAX_RESET_SIZE,1 , GFP_KERNEL);
    sk->inuse = 1;
    buff->sk = sk;
    // 当前已用的大小，一个 TCP 头，内容在下面赋值
    buff->len = sizeof(*t1);
    // 指向数据部分的内存地址
    t1 =(struct tcphdr *) buff->data;
    // 构建 IP 头、MAC 头，返回写入的大小字节数
    tmp = prot->build_header(buff,sk->saddr, sk->daddr, &dev,
               IPPROTO_TCP, sk->opt,
               sizeof(struct tcphdr),sk->ip_tos,sk->ip_ttl);
    
    // 指向下一个可以写的地址
    t1 =(struct tcphdr *)((char *)t1 +tmp);
    // 更新已使用的大小
    buff->len += tmp;
    // 写入 tcp 头的内容
    memcpy(t1, th, sizeof(*t1));
    // 序列号
    t1->seq = ntohl(sk->write_seq);
    // 是个 fin 包
    t1->fin = 1;
    t1->rst = 0;
    // TCP 头长度
    t1->doff = sizeof(*t1)/4;
    // 还有数据没有发出去则先入队等待
    if (skb_peek(&sk->write_queue) != NULL) 
    {
        // 放到写队列末尾，等到前面的数据先发出去
        skb_queue_tail(&sk->write_queue, buff);
    } 
    else 
    {   // 立刻发出去
        sk->prot->queue_xmit(sk, dev, buff, 0);
        // 启动超时重传定时器，超时时间时为 rto
        reset_xmit_timer(sk, TIME_WRITE, sk->rto);
    }
}
```

上面的代码修改了连接为关闭状态，并且开始四次挥手的流程。

TCP 的特性
TCP 协议除了正常的数据通信，还支持非常多的特性。比如单个服务器监听不同类型的地址、多个服务器监听不同类型的地址、Keepalive 机制以及半开关等等。了解这些特性不仅可以帮助我们深入理解网络原理，还能帮助我们解决工作中碰到的问题。

单个服务器监听不同类型的地址
我们平时使用 TCP 模块时，都是简单地 listen 一个端口 ，然后服务器就启动，但是我们是否了解过 listen 背后的意义呢？下面来具体看看监听不同地址的效果，我们通常通过以下代码启动一个服务器。

```js
const net = require('net');
net.createServer().listen(8888);
```

通过 lsof -i:8888 查看一下端口监听的情况。

tu 12-1

可以看到红色框里是一个 * 开头的字符串，它表示监听了本机器上所有 IP，也就是说收到 8888 的数据包时，主要目的 IP 是本主机的 IP 都会被处理，比如以下代码。

```js
const net = require('net');
const server = net.createServer().listen(8888, () => {
    // 下面 IP 改成自己的局域网 IP（Macos 可通过 ifconfig 获取），或改成 127.0.0.1 试试
    const socket = net.connect(8888, '192.168.3.9');
    socket.on('connect', () => {
        console.log('connect successfully');
        socket.destroy();
        server.close();
    })
});
```

可以发现不管 connect 中的 IP 指定成 192.168.3.9 还是 127.0.0.1，甚至不指定都可以连接成功。那么如果我们监听一个固定的 IP 会怎样呢？

```js
const net = require('net');
const server = net.createServer().listen(8888, '127.0.0.1', () => {
    const socket = net.connect(8888, '192.168.3.9');
    socket.on('connect', () => {
        console.log('connect successfully');
        socket.destroy();
        server.close();
    })
});
```

上面的例子中我们指定了监听的 IP 为 127.0.0.1，但是 connect 中指定的 IP 为 192.168.3.9 ，执行的时候报错如下。

```
Error: connect ECONNREFUSED 192.168.3.9:8888
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1142:16)
Emitted 'error' event on Socket instance at:
    at emitErrorNT (node:internal/streams/destroy:157:8)
    at emitErrorCloseNT (node:internal/streams/destroy:122:3)
    at processTicksAndRejections (node:internal/process/task_queues:83:21) {
  errno: -61,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '192.168.3.9',
  port: 8888
}
```

为什么呢？因为我们监听的是 127.0.0.1 ，所以连接时必须是指定 127.0.01 才能连接成功。通过命令可以看到端口监听的情况。

tu 12-2

如果去掉 connect 函数的 IP 则可以连接成功，说明不设置 IP 时操作系统默认会选 127.0.0.1（MacOS 下测试情况），反过来，监听 192.168.3.9，connect 时不指定 IP 也会报错。

所以当我们监听时指定了 IP，连接时也需要指定 IP。因此，当我们发现明明监听了这个端口，但是连接时却报错了，则可以看一下是不是监听了固定的 IP 或者通过 lsof 看看监听的情况。

多个服务器监听不同类型的地址
SO_REUSEADDR
长期以来，我们都有一个认知，就是不能监听同一个端口。那么真的不能这样做吗？下面我们通过一个例子来分析下。

```js
const net = require('net');
net.createServer().listen(8888);
net.createServer().listen(8888);
```

执行以上代码后，我们会看到 Address already in use 的错误。刚才讲过，当监听时不指定 IP 则操作系统会监听所有的 IP，所以上面的代码就相当于有两个 socket 监听了一样的地址，那么当操作系统收到一个连接时应该交给谁处理呢？从报错的情况来看操作系统无法决定，所以会报错。

tu 12-3

但是真的不能绑定到同一个端口吗？接下来再看一个例子。

```js
const net = require('net');

net.createServer((socket) => {
    console.log('server1', socket.remoteAddress);
}).listen(8888, '192.168.3.9', () => {
    net.connect(8888, '192.168.3.9');
});

net.createServer((socket) => {
    console.log('server2', socket.remoteAddress);
}).listen(8888, '127.0.0.1', () => {
    net.connect(8888, '127.0.0.1');
});
```
执行上面的代码，我们发现不会报错，通过 lsof 命令看看情况。

tu 12-4

可以看到这两个 socket 监听的 IP 是不一样的，这样操作系统收到连接时就可以根据报文的目的 IP 来判断这个包应该给谁处理。以上的代码输出如下。

```
server1 192.168.3.9
server2 127.0.0.1
```

操作系统的处理如下。

tu 12-5 

那么如果我们分别监听固定 IP 和全部 IP 会怎样呢？下面来看一下。

```js
const net = require('net');

net.createServer((socket) => {
    console.log('server1', socket.remoteAddress);
}).listen(8888, () => {
    net.connect(8888, '192.168.3.9');
});

net.createServer((socket) => {
    console.log('server2', socket.remoteAddress);
}).listen(8888, '127.0.0.1', () => {
    net.connect(8888, '127.0.0.1');
});
```

上面的例子中一个监听了所有 IP，一个监听了具体 IP，可以成功执行。看看 lsof 的输出。

tu 12-6

看起来操作系统在这种情况下知道如何分发连接，但真的是这样吗？下面通过另外一个例子看看是否是这样。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>

void start_server(__uint32_t host) {
    int listenfd, connfd;
    struct sockaddr_in servaddr;

    if( (listenfd = socket(AF_INET, SOCK_STREAM, 0)) == -1 ){
        goto ERROR;
    }
    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = host;
    servaddr.sin_port = htons(6666);

    if(bind(listenfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) == -1){
        goto ERROR;
    }

    if(listen(listenfd, 10) == -1) {
        goto ERROR;
    }
    return;
    ERROR:
        printf("bind socket error: %s(errno: %d)\n", strerror(errno), errno);
}
int main()
{
   start_server(htonl(INADDR_ANY));
   start_server(inet_addr("127.0.0.1"));
}
```

通过 gcc test.c && ./a.out 编译执行上面的代码报错如下。

```
bind socket error: Address already in use(errno: 48)

```

以上代码也是绑定了所有 IP 和具体 IP，为什么还会报错呢？这和 Node.js 的实现有什么区别？我们再改一下

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>

void start_server(__uint32_t host) {
    int listenfd, connfd;
    struct sockaddr_in servaddr;

    if( (listenfd = socket(AF_INET, SOCK_STREAM, 0)) == -1 ){
        goto ERROR;
    }
    int on = 1;
    // 设置 SO_REUSEADDR
    if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on))) {
        goto ERROR;
    }

    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = host;
    servaddr.sin_port = htons(6666);

    if(bind(listenfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) == -1){
        goto ERROR;
    }

    if(listen(listenfd, 10) == -1) {
        goto ERROR;
    }
    return;
    ERROR:
        printf("bind socket error: %s(errno: %d)\n", strerror(errno), errno);
}
int main()
{
   start_server(htonl(INADDR_ANY));
   start_server(inet_addr("127.0.0.1"));
}
```
这一次的代码可以执行成功，区别是设置了 SO_REUSEADDR 属性（Node.js 是默认设置的）。这是干什么的呢？

TIME_WAIT 状态的端口可以快速复用，否则需要等待 2 * MSL（Maximum Segment Lifetime） 时间。
可以同时绑定全部 IP 和具体 IP。

> 第二点在 MacOS 下可以，Linux 下不支持，Linux 文档的描述如下。

When the listening socket is bound to INADDR_ANY with a specific port then it is not possible to bind to this port for any local address.

文档说了，如果端口绑定到了所有 IP，就不能再绑定具体的 IP 了。

正是因为 Node.js 默认设置了 SO_REUSEADDR，所以监听全部 IP 和具体 IP 的代码才能成功运行，否则操作系统收到具体 IP 的包时，还是无法决定给监听了具体 IP 的 socket 还是监听了全部 IP 的 socket 处理（虽然理论上可以选择给具体 IP，但是操作系统实现上并不是这样）。另外，除了通过 IP 因子外，通过协议也可以实现监听不同的端口。比如下面的例子。

```js
const net = require('net');
const dgram = require('dgram');

net.createServer().listen(8888);
dgram.createSocket('udp4').bind(8888).on('message', () => {});
```

下面是 lsof -i:8888 命令的输出。

tu 12-7

从中可以看到监听的协议是不一样的，这样操作系统就可以根据 IP 报文的协议字段进行分发。

SO_REUSEPORT
刚才讲 SO_REUSEADDR 的第一个例子中，我们创建了两个 socket，这两个 socket 都监听了同一个端口和全部 IP，因为操作系统无法决定把收到的包给谁，所以导致了报错。但是真的不能监听同一个地址吗（IP 和端口都一样）？我们一起来看一个例子（Linux 下运行）。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>

void start_server(__uint32_t host) {
    int listenfd, connfd;
    struct sockaddr_in servaddr;
    int on = 1;
    
    if( (listenfd = socket(AF_INET, SOCK_STREAM, 0)) == -1 ){
        goto ERROR;
    }
    // 去掉试试
    if (setsockopt(listenfd, SOL_SOCKET, SO_REUSEPORT, &on, sizeof(on))) {
        goto ERROR;
    }

    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = host;
    servaddr.sin_port = htons(6666);

    if(bind(listenfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) == -1){
        goto ERROR;
    }

    if(listen(listenfd, 10) == -1) {
        goto ERROR;
    }
    return;
    ERROR:
        printf("bind socket error: %s(errno: %d)\n", strerror(errno), errno);
}
int main()
{
   start_server(htonl(INADDR_ANY));
   start_server(htonl(INADDR_ANY));
}
```
编译执行上面代码可以执行成功。这是为什么呢？因为 SO_REUSEPORT 在底层实现了新的分发机制，虽然两个 socket 监听的地址是一样的，但是操作系统收到一个包的时候会基于某种算法把请求分发到某一个 socket 中。Node.js 中因为操作系统兼容性问题没有支持 SO_REUSEPORT，但是我们可以了解它的使用，必要时也可以通过 Addon 的方式实现这个能力。

总的来说，只要操作系统实现上能判断一个包给谁处理，那么这个地址就可以被绑定，但是不同操作系统的实现间可能有差别，我们只需要了解这些情况就行，碰到问题的时候具体分析。实现多个服务器监听同一个端口可以使得应用可以在多个进程中共同处理连接，这样可以利用多核提高处理效率。当然，实现多个进程监听同一个端口的技术很多，这里只是其中一种，后面 Cluster 课程我们会详细介绍。

Keepalive
接下来看一下 TCP 协议的另一个特性 Keepalive。因为 TCP 是面向连接的，前面讲过连接的本质就是在两端的内存中保存了一个数据结构记录这个关系，当不再使用这个连接时需要显式断开才能释放对应的内存。

但是很多时候可能会出现一些不是我们预期的情况，比如我们 HTTP 长连接或者 WebSocket 的场景下，我们希望这个 TCP 连接能保持一段时间甚至一直保持。如果这时候某一端断网了，那么另一端就会一直保持这个 TCP 连接，因为它无法知道对端已经无法工作了，这就导致了内存无法释放，同时文件描述符也不会被关闭。

Keepalive 就是用于解决这个问题的，它可以探测对端是否还存活。当我们给一个 Socket 设置了 Keepalive 后，没有数据通信时操作系统会定时发送心跳检测对端的情况，如果对端有回复 ack 则说明还存活，如果一直没有回复，则达到阈值后操作系统就会自动关闭这个连接。 具体的策略如下。

多久没有数据包通信，则开始发送探测包（有数据通信时则重置定时器）。
每隔多久发送一次探测包。
发送多少个探测包后，如果还没有回复，则断开连接。
下面看一个例子。

```js
const net = require('net');
// 创建 TCP 服务器
const server = net.createServer((socket) => {
    socket.setKeepAlive(true, 10 * 1000);
});
// 启动服务器
server.listen(8080, () => {
    net.connect(8080);
});
```

上面的代码建立了一个 TCP 连接，并且设置了 10 s 没有数据通信时开始发送心跳包（因为系统兼容性问题，Node.js 只能设置多久没有数据通信后开始发送心跳包）。从下图可以看到 10 s 操作系统发送了第一个心跳包。

tu 12-8

Keepalive 机制看起来很好，但是现实情况却很复杂，前面讲到 Keepalive 会在没有数据通信时才会触发，如果两端正在通信，某一端突然断网了，这时候另一端就会触发重试机制而不会触发 Keepalive 机制，这样就会导致操作系统不断地重传数据，直到达到了重传次数的阈值才会关闭连接，白白浪费资源。TCP_USER_TIMEOUT 就是用来解决这个问题的，它设置了数据通信的最大 ack 时长，也就是说当操作系统发送一个包时，对端超过 TCP_USER_TIMEOUT 还没有回复 ack，则连接会被关闭。不过遗憾的是因为系统兼容性问题，无法在 Node.js 里使用TCP_USER_TIMEOUT。

半开关
前面讲过，TCP 协议是全双工的协议，两端可以同时发送和接收数据。半开关就是可以先关闭一端。比如服务端收到客户端的 fin 包并回复 ack 后就进入了半开关状态，这时候客户端不会发送数据了，但是服务端还可以给客户端发送数据。

是否需要半开关这个特性要根据具体情况来判断，比如服务器收到了完整的 HTTP 请求报文后，客户端关闭了写端则是正常的，服务器只需要处理完请求后关闭连接就行，而如果收到半个 HTTP 请求报文客户端就关闭了写端，则服务器需要关闭这个异常的连接。下面看一个例子。

```js
const net = require('net');
// 创建 TCP 服务器
const server = net.createServer({ allowHalfOpen: true }, (socket) => {
    socket.on('data', () => {});
    setTimeout(() => {
        socket.end("end");
    }, 1000);
});
// 启动服务器
server.listen(8888, () => {
    const socket = net.connect(8888);
    socket.on('connect', () => {
        socket.end('no data yet');
    });
    socket.on('data', (buffer) => {
        console.log(buffer.toString());
    });
});
```

比如，我们可以看到在上面代码中，客户端连接成功后发送了 no data yet 给服务器并且关闭了写端，因为服务器设置了 allowHalfOpen 为 true，所以不会关闭整个 TCP 连接，1 s 后服务器返回 end 给客户端并关闭写端，从而关闭整个连接。流程如下。

tu 12-9

下面看看没有设置 allowHalfOpen 的情况。

```js
const net = require('net');
// 创建 TCP 服务器
const server = net.createServer((socket) => {
    // 需要消费数据才能触发 end，然后才会关闭写端
    socket.on('data', () => {});
    setTimeout(() => {
        socket.end("end");
    }, 1000);
});
// 启动服务器
server.listen(8888, () => {
    const socket = net.connect(8888);
    socket.on('connect', () => {
        socket.end('no data yet');
    });
    socket.on('data', (buffer) => {
        console.log(buffer.toString());
    });
});
```

连接成功后客户端发送了 no data yet 并且关闭了写端，因为服务器没有设置 allowHalfOpen（默认为 false），所以服务器也会关闭写端，从而完成四次挥手关闭整个 TCP 连接，1 s 后服务器再执行 end 给客户端发送数据时会触发报错 This socket has been ended by the other party。整体流程如下。

tu 12-10

这个行为在后续的版本中有所修改，我们只需要理解半开关的原理就行。


总结
这节课我们基于上节课讲解的 TCP 基础，进一步学习了 Node.js TCP 数据通信、连接管理和 TCP 的特性。

在 TCP 连接上，Node.js 通过事件驱动模块实现了数据通信。建立连接后，Node.js 通过注册可读事件等待数据的到来，通过注册可写事件实现数据的发送。因为 TCP 连接是全双工的，所以我们可以选择关闭一端或者全关闭，全关闭的本质就是关闭 TCP 连接。

此外，我们还介绍了 4 种 TCP 的特性：

通过监听端口、监听 IP + 端口和监听不同的 IP 等场景介绍了 TCP 中监听不同地址的情况和原理，以后我们碰到相关问题时也可以迎刃而解，比如我们连接某个端口时报了 ECONNREFUSED 错误，但是通过 lsof 又发现监听了这个端口，则可以进一步判断是否监听时指定了 IP。
通过 SO_REUSEADDR 和 SO_REUSEPORT 可以不同程度地实现多个服务器监听同一个端口，尤其是 SO_REUSEPORT 可以直接监听同一个 IP 和端口，使得我们可以在多个进程中共同处理连接，提高效率。
关于 TCP Keepalive 机制，我们需要知道它的作用和使用场景。比如我们实现连接池时，就可以通过 Keepalive 机制探测空闲 socket 的对端是否还存活。
最后是半开关的使用场景，如果我们想在 TCP 协议之上通过 JSON 格式的数据进行通信，客户端就可以通过关闭写端来通知服务器请求报文发送完毕，服务器再通过 JSON.parse 解析收到的数据，然后返回结果。否则，如果我们在一个连接中发送多个请求，服务器需要实现一个解析器来解析一个个请求。