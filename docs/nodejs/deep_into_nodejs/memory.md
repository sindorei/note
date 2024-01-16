# Node.js中js和c++对象的内存管理机制

虽然 JS 自带 GC ，但开发者依然需要关注它的内存问题。 V8 会回收不再使用的对象，但如果开发者不再使用一个对象却保留了引用，该对象的内存就无法被释放，从而导致内存泄露。

Node.js 内部同样如此，Node.js 的维护者必须小心处理代码的逻辑以避免内存泄露。而且，相比前端，避免内存泄露在 Node.js 中更重要。前端页面通常不会长时间运行，刷新页面之后一切如初，但是 Node.js 通常作为长时间运行的进程，一旦发生内存泄露就会导致进程 OOM 退出。此外，如果释放了还需要使用的内存则会导致应用 Crash。这些情况都直接影响了服务的稳定性

在 Node.js 中，如果是单纯的 JS 对象，当我们不再使用该对象时，保证没有变量引用到该对象就可以保证它能被 GC。但如果是关联了 C++ 对象的 JS 对象，情况就复杂了。当我们不再使用该对象时，必须要保证 JS 和 C++ 对象共存亡和不要释放还需要使用的内存。Node.js 中解决这个问题主要是利用了 V8 提供的持久句柄和弱引用回调的机制。持久句柄保持对 JS 对象的引用使得不会被 GC，弱引用回调可以设置当只有该持久句柄引用了某 JS 对象时，这个 JS 对象可以被 GC 并执行持久句柄设置的回调函数，通过这个机制我们就可以解决这种复杂的场景。

本节课将会讲解不同场景下，Node.js 中 JS 和 C++ 对象的内存管理机制，这部分内容是非常核心的，其使用遍布 Node.js 整个项目中，理解它的实现将会帮助我们更深刻地理解 Node.js，同时也可以应用到我们的项目中。

## Node.js 的内存管理机制

基于 HandleWrap 的内存管理机制

下面以 UDP 模块为例介绍基于 HandleWrap 的模块的内存管理机制，首先看一下 C++ 层的 UDP 模块给 JS 层暴露的功能。

```c++
void UDPWrap::Initialize(Local<Object> target,
                         Local<Value> unused,
                         Local<Context> context,
                         void* priv) {
  Environment* env = Environment::GetCurrent(context);
  // 创建一个函数模版
  Local<FunctionTemplate> t = env->NewFunctionTemplate(New);
  t->InstanceTemplate()->SetInternalFieldCount(1);
  Local<String> udpString = FIXED_ONE_BYTE_STRING(env->isolate(), "UDP");
  t->SetClassName(udpString);
  // 设置一些原型方法
  env->SetProtoMethod(t, "open", Open);
  // 继承 HandleWrap 的方法，JS 层可以调用，比如 close
  t->Inherit(HandleWrap::GetConstructorTemplate(env));
  // 设置一系列函数
  // 暴露到 JS 层
  target->Set(env->context(),
              udpString,
              t->GetFunction(env->context()).ToLocalChecked()).Check();
}
```

接着看一下在 JS 层是如何使用的。

```js
const { UDP } = internalBinding('udp_wrap');
```

internalBinding 用于加载 C++ 模块，可以看到 C++ 模块暴露了一个对象 UDP，当我们创建一个 UDP Socket 时，就会相应的创建一个 C++ 层的 UDP 对象，以下为示例代码。

```js
function createSocket(type, listener) {
  return new Socket(type, listener);
}

function Socket() {
    this.handle = new UDP();
}
```

接下来看一下当执行 new UDP 时 C++ 的逻辑，根据 C++ 模块的定义，这时候会执行 UDPWrap::New。

```c++
void UDPWrap::New(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  // args.This() 为 JS 层 this.handle 引用的对象
  new UDPWrap(env, args.This());
}

UDPWrap::UDPWrap(Environment* env, Local<Object> object)
    : HandleWrap(env, object, ...) {
  // ...
}
```

UDPWrap 继承 HandleWrap，HandleWrap 继承 AsyncWrap，AsyncWrap 继承 BaseObject。我们直接看 BaseObject。

```c++
BaseObject::BaseObject(Environment* env, v8::Local<v8::Object> object)
    : persistent_handle_(env->isolate(), object), env_(env) {
  // 把 this存到 object中
  object->SetAlignedPointerInInternalField(0, static_cast<void*>(this));
  // env 退出释放当前 this 对象的内存
  env->AddCleanupHook(DeleteMe, static_cast<void*>(this));
}
```

因为 C++ 层通过持久句柄 persistent_handle_ 引用了 JS 的对象 object，所以就算 JS 层没有变量引用 object 它也不会被 GC。那么它什么时候会被 GC 呢？那就是当调用 Socket 的 close 时。

```js
Socket.prototype.close = function(callback) {
  // 下面是示例代码
  this.handle.close();
  this.handle = null;
 }
```

这里有两个操作，首先调用了 C++ 的 close 函数，然后把 handle 置为 null，即不再引用。因为 UDP 继承了 HandleWrap，所以这里的 close 其实就是 HandleWrap 的 close。


```c++
void HandleWrap::Close(const FunctionCallbackInfo<Value>& args) {
  HandleWrap* wrap;
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());
  wrap->Close(args[0]);
}

void HandleWrap::Close(Local<Value> close_callback) {
  uv_close(handle_, OnClose);
}
```

HandleWrap 是对 Libuv handle 的封装，所以需要先关闭 handle，接着在 close 阶段执行回调。

```c++
void HandleWrap::OnClose(uv_handle_t* handle) {
  // BaseObjectPtr 管理 HandleWrap 对象
  BaseObjectPtr<HandleWrap> wrap { static_cast<HandleWrap*>(handle->data) };
  wrap->Detach();
}
```

BaseObjectPtr 是一个智能指针（using BaseObjectPtr = BaseObjectPtrImpl<T, false>），里面维护了 HandleWrap 对象。

```c++
template <typename T, bool kIsWeak>
BaseObjectPtrImpl<T, kIsWeak>::BaseObjectPtrImpl(T* target)
  : BaseObjectPtrImpl() {
  data_.target = target;
  get()->increase_refcount();
}

void BaseObject::increase_refcount() {
  // 引用数加一
  unsigned int prev_refcount = pointer_data()->strong_ptr_count++;
  // 如果之前引用数为 0，则清除弱引用回调，防止被 GC
  if (prev_refcount == 0 && !persistent_handle_.IsEmpty())
    persistent_handle_.ClearWeak();
}
```

```c++
void BaseObject::Detach() {
  pointer_data()->is_detached = true;
}
```

Detach 只是设置了一个标记，在执行完 OnClose 后 BaseObjectPtr 会被析构。

```c++
template <typename T, bool kIsWeak>
BaseObjectPtrImpl<T, kIsWeak>::~BaseObjectPtrImpl() {
    // get() 返回 BaseObject*
    get()->decrease_refcount();
}

void BaseObject::decrease_refcount() {
  PointerData* metadata = pointer_data();
  // 引用数减一
  unsigned int new_refcount = --metadata->strong_ptr_count;
  if (new_refcount == 0) {
    // 为 true
    if (metadata->is_detached) {
      // OnGCCollect 最终执行 delete this;
      OnGCCollect();
    } else if (metadata->wants_weak_jsobj && !persistent_handle_.IsEmpty()) {
      MakeWeak();
    }
  }
}
```

BaseObjectPtr 析构后就会释放 this 指针指向的内存，从而 BaseObject 对象的字段 persistent_handle_ 对象（Global 类型）也被析构。

```c++
~Global() { this->Reset(); }
```

Reset 使得 persistent_handle_不再引用 JS 对象，最终 JS 对象失去了所有的引用，从而 JS 对象也被 GC。可以通过一个例子看一下。

```js
const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
socket.close();
setInterval(() => {
    gc();
}, 1000);
```

基于 ReqWrap 的内存管理机制

接下来看一下基于 ReqWrap 的请求对象的内存管理机制，以 TCP 的 TCPConnectWrap 为例，首先看一下 C++ 层 TCPConnectWrap 的定义。

```c++
// 创建一个函数模版
Local<FunctionTemplate> cwt = BaseObject::MakeLazilyInitializedJSTemplate(env);
cwt->Inherit(AsyncWrap::GetConstructorTemplate(env));
SetConstructorFunction(context, target, "TCPConnectWrap", cwt);
```

以上 C++ 代码给 JS 暴露了一个 TCPConnectWrap 函数，类似 C++ 层暴露的 TCP 函数 一样，但是在 JS 层执行 new TCPConnectWrap 时不会关联到 C++ 层的某一个对象，接下来看看如何使用。

```js
const req = new TCPConnectWrap();
req.oncomplete = afterConnect;
req.address = address;
req.port = port;
req.localAddress = localAddress;
req.localPort = localPort;
// _handle 为 new TCP 返回的对象
self._handle.connect(req, address, port);
// 执行完后 JS 层将失去对 TCPConnectWrap 的引用
```

当发起一个 TCP 连接时，就会创建一个 TCPConnectWrap 表示一次连接请求，接着看 C++ 层 connect 的逻辑。

```c++
ConnectWrap* req_wrap = new ConnectWrap(env, req_wrap_obj, ...);
```

C++ 层首先创建了一个 ConnectWrap 对象，ConnectWrap 继承 ReqWrap，ReqWrap 继承 AsyncWrap，AsyncWrap 继承 BaseObject。所以 new ConnectWrap 就是把 JS 层传进来的 TCPConnectWrap 和 C++ 层的 ConnectWrap 关联起来，另外 ReqWrap 构造函数中有一个非常关键的操作。

```c++
template <typename T>
ReqWrap<T>::ReqWrap(Environment* env,
                    v8::Local<v8::Object> object,
                    ...)
    : AsyncWrap(env, object, provider),
      ReqWrapBase(env) {
  MakeWeak();
}
```

MakeWeak 用于给持久引用设置弱引用回调。

```c++
void BaseObject::MakeWeak() {
  persistent_handle_.SetWeak(
      this,
      [](const WeakCallbackInfo<BaseObject>& data) {
        //
      },
      WeakCallbackType::kParameter);
}
```

回调的逻辑我们在后面再具体分析。创建完 ConnectWrap 后，接着执行了 req_wrap->Dispatch。

```c++
err = req_wrap->Dispatch(uv_tcp_connect,
                         &wrap->handle_,
                         reinterpret_cast<const sockaddr*>(&addr),
                         AfterConnect);
  // err < 0
  if (err) {
      delete req_wrap;
  }
```

如果 Dispatch 调用 Libuv 的 uv_tcp_connect 失败则直接删除 req_wrap， 即释放 ConnectWrap 对象的内存。ConnectWrap 析构的时候，父类 BaseObject 的 persistent_handle_ 也会析构，从而 JS 层的对象 TCPConnectWrap 将失去唯一的引用，最后被 GC。接下来再看看 Libuv 操作成功的逻辑。

```c++
int ReqWrap<T>::Dispatch(LibuvFunction fn, Args... args) {
  int err = CallLibuvFunction<T, LibuvFunction>::Call(
      fn,
      env()->event_loop(),
      req(),
      MakeLibuvRequestCallback<T, Args>::For(this, args)...);
  // 操作成功
  if (err >= 0) {
    ClearWeak();
    env()->IncreaseWaitingRequestCounter();
  }
  return err;
}
```

这里有两个关键的操作，第一个 ClearWeak，ClearWeak 是删除 ReqWrap 构造函数中设置的弱引用回调，使得 JS 层 TCPConnectWrap 对象被 ConnectWrap 的持久句柄 persistent_handle_ 引用，所以不会被 GC，否则因为连接是一个异步操作，在等待连接结果的过程中 JS 对象被 GC 会导致进程 Crash。另一个关键操作是 For 函数。

```c++
  static void Wrapper(ReqT* req, Args... args) {
    // BaseObjectPtr 构造函数导致 C++ 对象的引用数加一
    BaseObjectPtr<ReqWrap<ReqT>> req_wrap{ReqWrap<ReqT>::from_req(req)};
    req_wrap->Detach();
    req_wrap->env()->DecreaseWaitingRequestCounter();
    F original_callback = reinterpret_cast<F>(req_wrap->original_callback_);
    original_callback(req, args...);
  }
  
  static F For(ReqWrap<ReqT>* req_wrap, F v) {
    // 保存原始回调函数
    req_wrap->original_callback_ = reinterpret_cast<typename ReqWrap<ReqT>::callback_t>(v);
    return Wrapper;
  }
```

For 函数保存了原始回调，然后返回一个 Wrapper 函数，当 Libuv 回调时就会执行 Wrapper，Wrapper 中通过拿到的 C++ 对象 ReqWrap（ConnectWrap 是 ReqWrap 的子类） 定义了一个智能指针 BaseObjectPtr（ConnectWrap 引用数加一），然后调用 Detach，前面讲过 Detach 会设置一个 detach 标记，调完 Detach 后就执行真正的回调函数 original_callback，这里是 AfterConnect。

```c++
void ConnectionWrap<WrapType, UVType>::AfterConnect(uv_connect_t* req,
                                                    int status) {
  BaseObjectPtr<ConnectWrap> req_wrap{static_cast<ConnectWrap*>(req->data)};
  // 执行 JS 回调
 }
```

AfterConnect 中也定义了一个 BaseObjectPtr，所以这时候 C++ 对象 ConnectWrap 引用数又加 1 变成 2，接着执行了 JS 层回调函数，执行完之后，Wrapper 和 AfterConnect 函数中的 BaseObjectPtr 会析构，从而 ConnectWrap 对象被析构，最终 BaseObject 的持久句柄会被析构，JS 对象失去最后一个引用而被 GC（如果该对象返回给 JS 层使用，则在 JS 层失去引用后再被 GC）。下面看一个例子。

```js
const net = require('net');
setInterval(() => {
    gc();
}, 2000);
setTimeout(() => {
    // 随便连接一个端口
    net.connect(8888, '127.0.0.1').on('error', () => {});
}, 1000);
```
下图为 AfterConnect 中 BaseObjectPtr 对象析构时的调用栈。

图8-1

这时候 BaseObject 的引用数为 2，减去 1 为 1。下图为 Wrapper 函数中 BaseObjectPtr 对象析构时的调用栈。

图8-2

Wrapper 中的 BaseObjectPtr 析构后，BaseObject 的引用数为 0，所以会释放 BaseObject 的内存，从而持久句柄 persistent_handle_ 被析构，最后 JS 对象 TCPConnectWrap 被 GC。这种方式对用户是无感知的，完全由 Node.js 控制内存的使用和释放。

关联底层资源的 JS 对象的内存管理机制

正常来说，JS 对象失去引用后会直接被 V8 GC 回收，我们不需要额外关注，但是如果这个 JS 对象关联了底层的资源，比如 C++ 对象，那情况就会变得不一样了。这里以 trace_events 模块为例，我们可以通过 trace_events 的 createTracing 创建一个收集 trace event 数据的对象。

```js
function createTracing(options) {
  return new Tracing(options.categories);
}

class Tracing {
  constructor(categories) {
    this[kHandle] = new CategorySet(categories);
  }
}

```

createTracing 中创建了一个 Tracing 对象，Tracing 对象中又创建了一个 CategorySet 对象，CategorySet 是 C++ 层导出的函数。

```c++
  Local<FunctionTemplate> category_set = NewFunctionTemplate(isolate, NodeCategorySet::New);
  category_set->InstanceTemplate()->SetInternalFieldCount(NodeCategorySet::kInternalFieldCount);
  category_set->Inherit(BaseObject::GetConstructorTemplate(env));
  SetConstructorFunction(context, target, "CategorySet", category_set);
```

JS 执行 new CategorySet 时会执行 C++ 的 NodeCategorySet::New。

```c++
void NodeCategorySet::New(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  // 忽略其他代码
  new NodeCategorySet(env, args.This(), std::move(categories));
}
```

最终创建了一个 NodeCategorySet 对象，NodeCategorySet 继承 BaseObject。

```c++
  NodeCategorySet(Environment* env,
                  Local<Object> wrap,
                  std::set<std::string>&& categories) :
        BaseObject(env, wrap), categories_(std::move(categories)) {
    MakeWeak();
  }
```

NodeCategorySet 默认调用了 MakeWeak，所以如果 JS 层没有变量引用 new CategorySet 返回的对象，则它会被 GC。下面看一个例子。

```js
setInterval(() => {
    gc();
}, 1000);

const trace_events = require('trace_events');
trace_events.createTracing({categories: ['node.perf', 'node.async_hooks']});
```

因为 trace_events.createTracing 返回的对象没有被任何变量引用，导致 Tracing 对象中的 CategorySet 也没有被引用，从而被 GC，下面是调用栈。

图8-3

如果我们把 createTracing 返回的对象赋值给 global.demo，则不会被 GC。下面再来看一个例子。

```js
setInterval(() => {
    gc();
}, 1000);

const trace_events = require('trace_events');
const events = trace_events.createTracing({categories: ['node.perf', 'node.async_hooks']});
events.enable();
```

执行 enable 后也不会被 GC，为什么呢？看看 enable 的实现。

```js
  const enabledTracingObjects = new SafeSet();

  enable() {
    // 忽略其他代码
    enabledTracingObjects.add(this);
  }
```

enable 会把 this 加入到了 enabledTracingObjects 变量，而 enabledTracingObjects 是一直存在的，所以 Tracing 不会被 GC。从 trace_events 的内存管理机制中可以看到，对于关联了 C++ 对象的 JS 对象，需要设置弱引用回调，这样当 JS 对象失去引用而被 GC 时，它关联的 C++ 对象才可以被释放，否则就会造成内存泄露。

基于引用数的对象的内存管理机制
刚才 trace_events 的例子中，关联了 C++ 对象的 JS 对象是直接暴露给用户的，所以只需要设置弱引用回调，然后在 JS 对象被 GC 时释放关联的 C++ 对象即可。但是如果这个 JS 对象是由 Node.js 内核管理，然后通过其他 API 来操作这个对象的话，情况又变得不一样了。接下来再以 diagnostics_channel 的代码为例看看另一种使用方式。

```js
const channels = ObjectCreate(null);

function channel(name) {
  const channel = new Channel(name);
  channels[name] = new WeakReference(channel);
  return channel;
}
```

我们可以通过 diagnostics_channel 的 channel 函数创建一个 Channel 对象，然后以此作为订阅发布机制。当 Node.js 创建一个 Channel 对象时，它会以该 Channel 对象为参数创建一个 WeakReference 对象，然后把 WeakReference 对象保存到 channels 中，结构图如下。

图8-4

WeakReference 是 C++ 提供的对象。

```c++
  Local<FunctionTemplate> weak_ref = NewFunctionTemplate(isolate, WeakReference::New);
  weak_ref->InstanceTemplate()->SetInternalFieldCount(WeakReference::kInternalFieldCount);
  weak_ref->Inherit(BaseObject::GetConstructorTemplate(env));
  SetProtoMethod(isolate, weak_ref, "get", WeakReference::Get);
  SetProtoMethod(isolate, weak_ref, "incRef", WeakReference::IncRef);
  SetProtoMethod(isolate, weak_ref, "decRef", WeakReference::DecRef);
  SetConstructorFunction(context, target, "WeakReference", weak_ref);
```

当在 JS 层执行 new WeakReference 时，就会执行 C++ 的 WeakReference::New。

```c++
void WeakReference::New(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  // args.This() 为 JS 执行 new WeakReference 返回的对象，
  // args[0] 为 JS 层传入的第一个参数
  new WeakReference(env, args.This(), args[0].As<Object>());
}
```

接着看 WeakReference 构造函数。

```c++
WeakReference::WeakReference(Environment* env,
                             Local<Object> object,
                             Local<Object> target)
    : WeakReference(env, object, target, 0) {}
    
WeakReference::WeakReference(Environment* env,
                             Local<Object> object,
                             Local<Object> target,
                             uint64_t reference_count)
    : SnapshotableObject(env, object, type_int), // 
    reference_count_(reference_count) {
  // 如果 JS 层没有变量引用 new WeakReference 返回的对象，则释放 C++ 的 WeakReference 对象的内存
  MakeWeak();
  if (!target.IsEmpty()) {
    // target_ 是持久句柄，保存对传入的 JS 对象（Channel）的引用
    target_.Reset(env->isolate(), target);
    if (reference_count_ == 0) {
      // 如果只有 target_ 引用传入的 JS 对象，则该 JS 对象可以被 GC
      target_.SetWeak();
    }
  }
}
```

WeakReference 通过 reference_count_ 字段记录了 target （JS 层传入的 Channel 对象）有多少个引用。SnapshotableObject 继承 BaseObject，用于关联 JS 的 WeakReference 和 C++ 的 WeakReference 对象。接着通过 WeakReference 的 target_ 引用 JS 层传入的对象，因为 reference_count_ 是 0，所以执行 SetWeak，表示如果只有持久句柄 target_ 引用传入的 JS 对象，则该 JS 对象可以被 GC。回到 JS 层。

```js
function channel(name) {
  const channel = new Channel(name);
  channels[name] = new WeakReference(channel);
  return channel;
}
```

可以看到通过 channel 获取的 Channel 对象直接返回给用户，WeakReference 会被 channels 引用，但是存在一个问题是，如果用户没有变量引用该返回的 Channel 对象，则会导致 Channel 被 GC，例如[如下情况](https://github.com/nodejs/node/issues/42170)。

```js
const { channel } = require('diagnostics_channel')
const strongRef = channel('strong')

strongRef.subscribe(message => {
  console.log(message) // outputs because the subscriber is still available
})

channel('weak').subscribe(message => {
  console.log(message) // no output because the subscriber was garbage collected
})

setTimeout(() => {
  channel('weak').publish('weak output')
  strongRef.publish('strong output')
})

gc()
```

channel('weak') 创建了一个 Channel 对象，但是 JS 里没有地方引用返回的 Channel 对象，从而 Channel 对象被 GC，当 setTimeout 中执行 channel('weak').publish 时会重新创建一个新的 Channel，导致 pubilsh 不符合预期。这个是 Node.js 中的一个 bug，后面被修复了，修复代码如下。

```js
function subscribe(name, subscription) {
  const chan = channel(name);
  channels[name].incRef();
  chan.subscribe(subscription);
}
```

修复后，需要通过 subscribe 进行订阅，subscribe 会调用 channel 函数创建一个 Channel 对象，然后执行 incRef。

```c++
void WeakReference::IncRef(const FunctionCallbackInfo<Value>& args) {
  WeakReference* weak_ref = Unwrap<WeakReference>(args.Holder());
  weak_ref->reference_count_++;
  if (weak_ref->target_.IsEmpty()) return;
  if (weak_ref->reference_count_ == 1) weak_ref->target_.ClearWeak();
}
```

IncRef 的逻辑很简单，就是 Channel 对象的引用数加一，并且清除弱引用设置，这样保证即使 JS 层没有变量引用该 Channel 对象，也不会被 GC。同理，当显式调用 unsubscribe 时才会导致 Channel 对象被 GC。

```js
function unsubscribe(name, subscription) {
  const chan = channel(name);
  if (!chan.unsubscribe(subscription)) {
    return false;
  }

  channels[name].decRef();
  return true;
}
```

看一下 C++ 层的 decRef。

```c++
void WeakReference::DecRef(const FunctionCallbackInfo<Value>& args) {
  WeakReference* weak_ref = Unwrap<WeakReference>(args.Holder());
  weak_ref->reference_count_--;
  if (weak_ref->target_.IsEmpty()) return;
  if (weak_ref->reference_count_ == 0) weak_ref->target_.SetWeak();
}
```

decRef 中判断了如果 reference_count_ 为 0，则设置 Channel 的弱引用回调，所以最终被 GC，除非用户再次调用 subscribe。这种就是基于引用计数来对对象进行内存管理的方式。

不知道大家有没有发现另一个问题，就是 WeakReference 对象什么时候被 GC？纵观 diagnostics_channel 的代码我们只看到给 channels 对象新增属性的代码，没有删除属性的代码，通过代码测试一下。

```js
const { subscribe, unsubscribe } = require('diagnostics_channel');

function noop() {}

console.log(process.memoryUsage().heapUsed);

for (let i = 0; i < 1000000; i++) {
    subscribe(String(i), noop);
    unsubscribe(String(i), noop);
}

gc();

console.log(process.memoryUsage().heapUsed);
```

在 Node.js V18.9.0 中输出如下。

```
4949688
46934032
```

可以发现尽管调用了 unsubscribe，内存还是新增了非常多，这里的确存在了一个内存泄露的问题，[相关PR](https://github.com/nodejs/node/pull/45633)，修复方式如下。

```js
function unsubscribe(name, subscription) {
  const chan = channel(name);
  if (!chan.unsubscribe(subscription)) {
    return false;
  }

  channels[name].decRef();
  // 引用数为 0 时删除该 key
  if (channels[name].getRef() === 0) {
    delete channels[name];
  }
  return true;
}
```

## 如何使用 Node.js 的内存管理机制

那么对于我们来说，这种机制有什么用处呢？Node.js 除了提供 BaseObject 管理内部对象的内存，也通过 ObjectWrap 导出了这个功能。

```c++
class ObjectWrap {
 public:
  ObjectWrap() {
    refs_ = 0;
  }
  
  template <class T>
  static inline T* Unwrap(v8::Local<v8::Object> handle) {
    void* ptr = handle->GetAlignedPointerFromInternalField(0);
    ObjectWrap* wrap = static_cast<ObjectWrap*>(ptr);
    return static_cast<T*>(wrap);
  }

  inline v8::Local<v8::Object> handle() {
    return handle(v8::Isolate::GetCurrent());
  }

  inline v8::Local<v8::Object> handle(v8::Isolate* isolate) {
    return v8::Local<v8::Object>::New(isolate, persistent());
  }

  inline v8::Persistent<v8::Object>& persistent() {
    return handle_;
  }

 protected:
  inline void Wrap(v8::Local<v8::Object> handle) {
    // 关联 JS 和 C++ 对象
    handle->SetAlignedPointerInInternalField(0, this);
    persistent().Reset(v8::Isolate::GetCurrent(), handle);
    // 默认设置了弱引用，如果 JS 对象没有被其他变量引用则会被 GC
    MakeWeak();
  }
  // 设置弱引用回调
  inline void MakeWeak() {
    persistent().SetWeak(this, WeakCallback, v8::WeakCallbackType::kParameter);
  }
  // 引用数加 1，清除弱引用回调
  virtual void Ref() {
    persistent().ClearWeak();
    refs_++;
  }
  // 和 Ref 相反
  virtual void Unref() {
    if (--refs_ == 0)
      MakeWeak();
  }

  int refs_;  // ro

 private:
  // 弱引用回调
  static void WeakCallback(
      const v8::WeakCallbackInfo<ObjectWrap>& data) {
    ObjectWrap* wrap = data.GetParameter();
    // 解除引用 JS 对象
    wrap->handle_.Reset();
    // 释放内存
    delete wrap;
  }

  // 通过持久引用保存 JS 对象，避免被 GC
  v8::Persistent<v8::Object> handle_;
};
```
ObjectWrap 为开发者提供了 JS 和 C++ 对象的生命周期管理，开发者可以继承该类，但是需要注意的是 ObjectWrap 默认设置了弱引用，如果管理的 JS 对象没有被其他变量引用则会被 GC，如果想改变这个行为，则可以主动调 Ref，有兴趣的同学可以参考[这个例子](https://github.com/theanarkh/nodejs-book/tree/main/src/ObjectWrapper)。

除此之外，我们还可以利用这种机制追踪 JS 对象是否被 GC。

```js
const { createHook, AsyncResource } = require('async_hooks');
const weakMap = new WeakMap();
// 存储被监控对象和 GC 回调的映射
const gcCallbackContext = {};

let hooks;

function trackGC(obj, gcCallback) {
  if (!hooks) {
    hooks = createHook({
      destroy(id) {
        if (gcCallbackContext[id]) {
          gcCallbackContext[id]();
          delete gcCallbackContext[id];
        }
      }
    }).enable();
  }
  const gcTracker = new AsyncResource('none');
  // 通过 asyncId 记录被追踪对象和 GC 回调的映射
  gcCallbackContext[gcTracker.asyncId()] = gcCallback;
  weakMap.set(obj, gcTracker);
}
```

WeakMap 的存储的是键值对，键只能是对象且 WeakMap 对该对象是弱引用，也就是说如果没有其他变量引用该对象则该对象会被 GC，并且值也会被 GC。当我们想追踪一个 JS 对象是否被 GC 时，就可以把该对象作为键保存在 WeakMap 中，再利用一个特殊的值，这个值的特殊之处在于当键被 GC 时，值也会被 GC，再通过给值设置弱引用回调得到通知，那就是说当回调被执行时，说明值被 GC 了，也就说明键被 GC 了。这个值的类型是 AsyncResource，AsyncResource 帮我们处理好了底层的事件，我们只需要通过 async_hooks 的 destroy 钩子就可以知道哪个 AsyncResource 被 GC了，从而知道哪个键被 GC了，最后执行一个回调。来看一下是如何知道 AsyncResource 对象被 GC 的。

```js
class AsyncResource {
  constructor(type, opts = kEmptyObject) {
    // ...
    registerDestroyHook(this, ...);
  }

}
```

当创建一个 AsyncResource 对象时，默认会执行 registerDestroyHook。

```c++
class DestroyParam {
 public:
  double asyncId;
  Environment* env;
  Global<Object> target;
  Global<Object> propBag;
};

static void RegisterDestroyHook(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  DestroyParam* p = new DestroyParam();
  p->asyncId = args[1].As<Number>()->Value();
  p->env = Environment::GetCurrent(args);
  // args[0] 为 JS 层的 AsyncResource 对象
  p->target.Reset(isolate, args[0].As<Object>());
  // 设置弱引用回调，p 为回调时传入的参数
  p->target.SetWeak(p, AsyncWrap::WeakCallback, WeakCallbackType::kParameter);
}
```

RegisterDestroyHook 中创建了一个 DestroyParam 对象保存上下文，然后调用 SetWeak 设置了 JS 对象的弱引用回调，当 AsyncResource 没有被其他变量引用时就会被 GC，从而执行 AsyncWrap::WeakCallback。

```c++
void AsyncWrap::WeakCallback(const WeakCallbackInfo<DestroyParam>& info) {
  HandleScope scope(info.GetIsolate());
  // 智能指针，执行完 WeakCallback 后释放堆对象 DestroyParam 内存
  std::unique_ptr<DestroyParam> p{info.GetParameter()};
  Local<Object> prop_bag = PersistentToLocal::Default(info.GetIsolate(),
                                                      p->propBag);
  Local<Value> val;
  // 触发 async_hooks 的 destroy 钩子函数
  if (val.IsEmpty() || val->IsFalse()) {
    AsyncWrap::EmitDestroy(p->env, p->asyncId);
  }
}
```

WeakCallback 中触发了 async_hooks 的 destroy 钩子，从而通过 destroy 钩子的 asyncId 就可以知道哪个 AsyncResource 对象被 GC 了，从而根据 WeakMap 的映射关系知道哪个被追踪的 JS 对象被 GC 了。我们看一个例子。

```js
function memory() {
  return ~~(process.memoryUsage().heapUsed / 1024 / 1024);
}

console.log(`before new Array: ${memory()} MB`);

let key = {
  a: new Array(1024 * 1024 * 10)
};

let key2 = {
  a: new Array(1024 * 1024 * 10)
};

console.log(`after new Array: ${memory()} MB`);

trackGC(key, () => {
  console.log("key gc");
});

trackGC(key2, () => {
  console.log("key2 gc");
});

global.gc();

console.log(`after gc 1: ${memory()} MB`);

key = null;

key2 = null;

global.gc();

console.log(`after gc 2: ${memory()} MB`);
```

输出：
```text
before new Array: 2 MB
after new Array: 162 MB
after gc 1: 161 MB
after gc 2: 1 MB
key gc
key2 gc
```
从输出中可以看到 key 和 key2 变量被 GC 了，内存也得到了释放。

总结

内存管理是应用非常核心的部分，哪怕语言自带 GC，也不意味着我们就不需要关心内存的管理问题。本节课以 HandleWrap、ReqWrap、trace_events、diagnostics_channel 为例介绍了 Node.js 内核中多种内存管理的机制。

HandleWrap 是对 Libuv handle 的封装，所以当不再使用时，需要显式调用 close 关闭 handle，才能释放内存。
ReqWrap 是对请求的封装，是一次性的操作，发起操作到结束操作整个过程的内存管理都是由 Node.js 负责的。
trace_events 是关联了底层资源的 JS 对象，通过弱引用机制进行 JS 对象和底层资源的内存管理。
diagnostics_channel 是基于引用计数进行内存管理，底层也是使用了弱引用机。
除此之外，还介绍了 Node.js 提供的内存管理机制，包括通过 ObjectWrap 管理 JS 和 C++ 对象的生命周期和通过 AsyncResource 追踪 JS 对象是否被 GC，我们可以把他们应用到项目中。理解这些原理不仅可以加深我们对 V8 和 Node.js 的理解，同时我们在使用 V8 和 Node.js 时，也就知道如何去管理自己的内存，避免出现内存泄露或应用 Crash的问题。


