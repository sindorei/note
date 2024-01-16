# libuv功能是如何引入到js的

## v8基础知识

JS 的拓展能力是由 V8 提供的。也就是说，在 Libuv 实现了网络、文件、进程等功能后，还需要借助 V8 提供的拓展能力引入 JS 中，才能在 JS 里使用相关的功能。因此，我们需要先了解 V8 的一些基础数据结构和提供的拓展机制。

V8 的数据结构非常多，但是常用的是下面的几个，我们需要了解下面的数据结构才能更好地了解和使用 V8。

- Isolate：Isolate 代表一个 V8 的实例，它相当于这一个容器。通常一个线程里面会有一个这样的实例。比如说在 Node.js 主线程里面就会有一个 Isolate 实例，子线程里也会有一个 Isolate 实例。
- Context：Context 是代表代码执行的上下文，起到隔离的作用，即我们改变一个 Context 的内容不会影响另一个 Context，它主要是保存 Object、- Function 这些我们平时经常会用到的内置类型。如果我们想拓展 JS 功能，就可以通过这个对象实现。另外一个 Isolate 中，可以存在多个 Context。
- ObjectTemplate：ObjectTemplate 是用于定义对象的模板。我们可以基于这个模板去创建对象。
- FunctionTemplate：FunctionTemplate 和 ObjectTemplate 是类似的，它主要是用于定义一个函数的模板。我们可以基于这个函数模板去创建一个函数。
- FunctionCallbackInfo： 用于实现 JS 和 C++ 通信的对象。当我们通过 JS 调用 C++ 代码时，就会通过该类的对象获取 JS 层传入的参数。
- Handle：Handle 用于 V8 的内存管理，它保存了 V8 堆对象的地址信息。我们平时定义的对象和数组，就是用 Handle 来管理的。比如在 C++ 层创建一个 JS 对象。

```c++
// Local 是 Handle 的一种，Object::New 用于在 V8 堆分配内存
Local<Value> object = Object::New(isolate);

```

- HandleScope：HandleScope 是一个 Handle 容器，方便管理大量 Handle 的创建和销毁。它主要是利用 C++ 的析构函数机制管理多个 Handle 的生命周期。

```c++
{
    HandleScope scope(env->isolate());
    // 创建两个 Handle 对象，指向两个对象
    Local<Value> object1 = Object::New(isolate);
    Local<Value> object2 = Object::New(isolate);
} // 执行到这后 object1 和 object2 的内存被释放，Object 被 GC

```

接下来我们详细介绍一下 FunctionTemplate 和 ObjectTemplate 这两个非常核心的类，它们是我们拓展 JS 能力时经常会使用到的。就像建房子会根据设计图施工一样，我们可以在 V8 中通过定义某种模板创建出对应的实例，那我们该如何定义一个函数模版呢，具体代码可参考[这里](https://github.com/theanarkh/nodejs-book/tree/main/src/V8/FunctionTemplate)

```c++
Local<String> newString(const char * name) {
  return String::NewFromUtf8(Isolate::GetCurrent(), name, v8::NewStringType::kNormal).ToLocalChecked();
}

void ProtoMethod(const FunctionCallbackInfo<Value>& args) {
    std::cout<<"call ProtoMethod"<<std::endl;
}

// 定义一个加法函数
void InstanceMethod(const FunctionCallbackInfo<Value>& args) {
    std::cout<<"call InstanceMethod"<<std::endl;
}

void Initialize(
  Local<Object> exports,
  Local<Value> module,
  Local<Context> context
) {
        Isolate* isolate = context->GetIsolate();
        // 新建一个函数模版
        Local<FunctionTemplate> parentFunc = FunctionTemplate::New(isolate);
        // 新建一个字符串表示函数名
        Local<String> parentName = String::NewFromUtf8(isolate, "Parent", v8::NewStringType::kNormal).ToLocalChecked();
        // 设置函数名
        parentFunc->SetClassName(parentName);
        // 设置原型属性
        parentFunc->PrototypeTemplate()->Set(isolate, "protoField", Number::New(isolate, 1));
        // 设置原型函数，JS 调 protoMethod 时就会调 ProtoMethod 函数
        parentFunc->PrototypeTemplate()->Set(isolate, "protoMethod", FunctionTemplate::New(isolate, ProtoMethod));
        // 设置对象属性
        parentFunc->InstanceTemplate()->Set(isolate, "instanceField", Number::New(isolate, 2));
        parentFunc->InstanceTemplate()->Set(isolate, "instanceMethod", FunctionTemplate::New(isolate, InstanceMethod));
        // 根据模块创建函数实例
        Local<Function> parentInstance = parentFunc->GetFunction(context).ToLocalChecked();
        // 导出到 JS 层
        exports->Set(context, parentName, parentInstance).Check();
}

// addon 定义
NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)

```

下面来详细解释上面的代码。

通过 FunctionTemplate::New(isolate) 创建一个函数模板，函数模板是定义了当通过这个函数模板创建一个函数时函数的内容，比如函数名，函数的原型对象里有什么属性等，对应 JS 的函数。
通过 SetClassName 定义了当通过这个函数模板创建一个函数时，这个函数的名字。
通过设置 PrototypeTemplate 的属性定义了当通过这个函数模板创建一个函数时，这个函数的原型对象，就是 JS 里的 function.prototype。
通过设置 InstanceTemplate 的属性定义了当通过这个函数模板创建一个函数并且通过 new 执行这个函数时，生成的对象里有哪些内容。

翻译成 JS 如下:

```javascript
function Parent() {
    this.instanceField = 2;
    this.instanceMethod = () => { ... };
}

Parent.prototype.protoField = 1;
Parent.prototype.protoMethod = () => { ... };
```
下面通过使用这个 Addon 来体验下效果:

```javascript
const { Parent } = require('./build/Release/test.node');

const parent = new Parent();
console.log('Parent.prototype: ', Parent.prototype);
console.log('parent.protoField: ', parent.protoField);
parent.protoMethod();
console.log('parent.instanceField: ', parent.instanceField);
parent.instanceMethod();

```

输出如下：
```
Parent.prototype:  Parent { protoField: 1, protoMethod: [Function: protoMethod] } 
parent.protoField:  1 
call ProtoMethod
parent.instanceField:  2 
call InstanceMethod
```

了解了基础使用后，接着看一下高级点的用法：继承，V8 提供了类似 JS 里的原型链继承的功能，具体代码可参考[这里](https://github.com/theanarkh/nodejs-book/tree/main/src/V8/Inherit)。

```c++
Local<FunctionTemplate> childFunc = FunctionTemplate::New(isolate);
Local<String> childName = String::NewFromUtf8(isolate, "Child", v8::NewStringType::kNormal).ToLocalChecked();
childFunc->SetClassName(childName);
// 定义自己的原型属性
childFunc->PrototypeTemplate()->Set(isolate, "childProtoField", Number::New(isolate, 1));
// 定义自己的实例属性
childFunc->InstanceTemplate()->Set(isolate, "childInstanceField", Number::New(isolate, 2));
// 继承 parentFunc 函数模版
childFunc->Inherit(parentFunc);

Local<Function> parentInstance = parentFunc->GetFunction(context).ToLocalChecked();
Local<Function> childInstance = childFunc->GetFunction(context).ToLocalChecked();
exports->Set(context, parentName, parentInstance).Check();
exports->Set(context, childName, childInstance).Check();
```

这里和刚才的区别是多了个继承的设置，这样 child 就可以直接使用 parent 的一些内容了。
```js
const { Parent, Child } = require('./build/Release/test.node');
const child = new Child();
console.log('Child.prototype: ', Child.prototype);
console.log('Parent.prototype === Child.prototype: ', Parent.prototype === Child.prototype);
console.log('child.protoField: ', child.protoField);
child.protoMethod();
console.log('child.instanceField: ', child.instanceField);
console.log('child.instanceMethod: ', child.instanceMethod);

console.log('child.childProtoField: ', child.childProtoField);
console.log('child.childInstanceField: ', child.childInstanceField);
console.log('child instanceof Parent: ', child instanceof Parent);
```

输出：

```
Child.prototype:  Parent { childProtoField: 1 }
Parent.prototype === Child.prototype:  false
child.protoField:  1
call ProtoMethod
child.instanceField:  undefined
child.instanceMethod:  undefined
child.childProtoField:  1
child.childInstanceField:  2
child instanceof Parent:  true

```

下面再看一下另一个高级的用法：JS 和 C++ 对象绑定，也是 Node.js 中非常核心的部分，具体代码可参考[这里](https://github.com/theanarkh/nodejs-book/tree/main/src/V8/WrapperObject)。


```c++
class Dummy {
  public:
    Dummy(Local<Object> object): jsObject(Isolate::GetCurrent(), object) {
      // 设置 JS 对象关联的 C++ 对象
      object->SetAlignedPointerInInternalField(0, static_cast<void*>(this));
      // 给 JS 对象设置一个属性
      Local<Context> context = Isolate::GetCurrent()->GetCurrentContext();
      (void)object->Set(context, newString("hello"), newString("world"));
    };
    // C++ 对象关联的 JS 对象
    Global<Object> jsObject;
    int dummy_field = 1;
};

void New(const FunctionCallbackInfo<Value>& args) {
    new Dummy(args.This());
}

void Method(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    // 获取 JS 对象的属性
    Local<String> hello = newString("hello");
    // 获取 hello 属性等值
    Local<String> helloValue = args.Holder()->Get(context, hello).ToLocalChecked().As<String>();
    // 获取 JS 对象关联的 C++ 对象
    Dummy* dummy = static_cast<Dummy*>(args.Holder()->GetAlignedPointerFromInternalField(0));
    Local<Object> obj = Object::New(isolate);
    // 把 JS 和 C++ 对象的属性返回给 JS 层
    (void)obj->Set(context, hello, helloValue);
    (void)obj->Set(context, newString("dummy_field"), Number::New(isolate, dummy->dummy_field));
    args.GetReturnValue().Set(obj);
}

// 新建一个函数模版
Local<FunctionTemplate> funcWithCallback = FunctionTemplate::New(isolate, New);
// 设置 JS 对象可以关联的 C++ 对象个数
funcWithCallback->InstanceTemplate()->SetInternalFieldCount(1);
funcWithCallback->PrototypeTemplate()->Set(isolate, "method", FunctionTemplate::New(isolate, Method));
// 新建一个字符串表示函数名
Local<String> funcWithCallbackName = String::NewFromUtf8(isolate, "FuncWithCallback", v8::NewStringType::kNormal).ToLocalChecked();
// 设置函数名
funcWithCallback->SetClassName(funcWithCallbackName);
Local<Function> funcWithCallbackInstance = funcWithCallback->GetFunction(context).ToLocalChecked();

```

看一下效果：

```js
const { Parent, Child, FuncWithCallback } = require('./build/Release/test.node');

const instace = new FuncWithCallback();
console.log(instace.method());

```

输出如下：
```
{ hello: 'world', dummy_field: 1 }
```

以上代码用到的技术几乎是 Node.js 每个 C++ 模块都会用到的，下面来详细分析一下上面的代码，看看它的工作原理。

创建一个函数模块，和之前不一样的是，这里会设置一个回调函数是 New，并执行 InstanceTemplate()->SetInternalFieldCount(1)，因为我们需要在 JS 对象中关联一个 C++ 对象，所以需要设置为 1，类似预留一个 slot。
当 JS 执行 new FuncWithCallback 时，C++ 层首先会创建一个 JS 对象，然后调用 New 函数，在 New 函数中可以通过 args.This() 拿到这个 JS 对象。
接着创建一个 Dummy 对象，把这个 JS 对象传入 Dummy 的构造函数中。Dummy 构造函数在 jsObject 字段中保存了 JS 对象，然后在 JS 对象中保存了 Dummy 对象，最后往 JS 对象新增了一个hello 属性，结构图如下：

JS 层 new 执行完毕拿到了一个 JS 对象 instance，接着执行 instace.method() 时就会调用 C++ 的 Method。Method 函数中可以通过 args.Holder() 或 args.This()（通常是一样的）获得函数调用的上下文，类似 JS 函数调用时的 this。
接着通过 GetAlignedPointerFromInternalField(0) 获得之前关联的 C++ 对象。从而取得相应的内容。


## C++ 层核心数据结构

有了 V8 的拓展机制后，理论上就可以把 Libuv 引入 JS 里了，但 Node.js 在 C++ 层还设计了一些通用的数据结构，很多 C++ 模块中都会用到它们，所以我们先来了解下这些数据结构。

BaseObject

BaseObject 是 Node.js 中非常重要的数据结构，是 C++ 层大多数类的基类，用于管理 JS 和所关联 C++ 对象的生命周期，这里只介绍常用的部分。

```c++
class BaseObject : public MemoryRetainer {  
 private:  
  // 持久句柄，指向 JS 对象  
  v8::Global<v8::Object> persistent_handle_;  
  Environment* env_;  
};  
    
```

BaseObject 中最重要的字段是 persistent_handle_，persistent_handle_ 是一个持久句柄，用于保存 JS 层的对象，并且通过弱引用机制管理 JS 和 C++ 对象的生命周期。

构造函数

```c++
    // 把 JS 对象存储到 persistent_handle_ 中，需要的时候通过 object() 函数取出来  
    BaseObject::BaseObject(Environment* env, 
                           v8::Local<v8::Object> object) 
    : persistent_handle_(env->isolate(), object), 
      env_(env) {  
      // 把 this 存到 JS 对象 object 中  
      object->SetAlignedPointerInInternalField(0, static_cast<void*>(this));  
    }  

```

构造函数用于关联 JS 对象和 C++ 对象，下图中的对象即我们平时在 JS 层使用的由 C++ 模块创建的对象，比如 new TCP() 和 TCPWrap 对象的关系，后面我们可以看到用处。


获取 JS 对象

```c++
v8::Local<v8::Object> BaseObject::object() const {  
  return PersistentToLocal::Default(env()->isolate(), persistent_handle_);  
}  
 
```
object 函数用于返回 JS 层使用的对象。


获取 BaseObject 对象

```c++
// 通过 obj 取出里面保存的 BaseObject 对象  
BaseObject* BaseObject::FromJSObject(v8::Local<v8::Object> obj) {
  return static_cast<BaseObject*>(obj->GetAlignedPointerFromInternalField(0));  
}  
// T 为 BaseObject 子类
T* BaseObject::FromJSObject(v8::Local<v8::Object> object) {  
  return static_cast<T*>(FromJSObject(object));  
}  

```

FromJSObject 用于通过 JS 对象获取对应的 C++ 对象，因为它们互相关联，所以很自然可以获取到。

Unwrap

```c++
// 从 obj 中取出对应的 BaseObject 对象  
inline T* Unwrap(v8::Local<v8::Object> obj) {  
  return BaseObject::FromJSObject<T>(obj);  
}  
  
// 从 obj 中获取对应的 BaseObject 对象，如果为空则返回第三个参数的值（默认值）  
#define ASSIGN_OR_RETURN_UNWRAP(ptr, obj, ...) \  
  do {       \  
    *ptr = static_cast<typename std::remove_reference<decltype(*ptr)>::type>( \  
        BaseObject::FromJSObject(obj));   \  
    if (*ptr == nullptr)  \  
      return __VA_ARGS__; \  
  } while (0)  
```

Unwrap 是非常重要的逻辑，基本每次从 JS 层到 C++ 层都用到了这个函数，它用于从 JS 对象中获取对应的 C++ 对象，比如 JS 层调 setNoDelay 时会执行 C++ 层 SetNoDelay。


```c++
void TCPWrap::SetNoDelay(const FunctionCallbackInfo<Value>& args) {
  TCPWrap* wrap;
  ASSIGN_OR_RETURN_UNWRAP(&wrap,
                          // JS 层使用的对象，比如 _handle = new TCP()
                          args.Holder(),
                          args.GetReturnValue().Set(UV_EBADF));
 // ...
}
```


MakeWeak

BaseObject 中通过 persistent_handle_ 持有了一个 JS 对象，MakeWeak 利用了 V8 提供的机制，在 JS 对象只有 persistent_handle_ 引用时可以被 GC，从而释放关联的 C++ 对象的内存。

```c++
void BaseObject::MakeWeak() {
  persistent_handle_.SetWeak(
      this,
      [](const v8::WeakCallbackInfo<BaseObject>& data) {
        BaseObject* obj = data.GetParameter();
        // 不再引用 JS 对象
        obj->persistent_handle_.Reset();
        // 执行 GC 逻辑，默认释放 BaseObject 对象内存
        obj->OnGCCollect();
      }, v8::WeakCallbackType::kParameter);
}

void BaseObject::OnGCCollect() {
  delete this;
}
```

但是 BaseObject 默认不会调用 MakeWeak，这个是子类控制的。另外值得一提的是 SetWeak 也可以不传入如何参数，这种方式会在只有持久句柄引用 JS 对象时，该 JS 对象可以被 GC，并且会重置持久句柄，使得它不再引用该 JS 对象。

AsyncWrap

AsyncWrap 是 BaseObject 的子类，实现了 async_hook 模块的功能，同时实现了异步操作的功能，这里我们只关注异步操作中回调 JS 的功能。当 C++ 层回调 JS 层时会调用 AsyncWrap 的 MakeCallback 函数。

回调 JS

```c++
inline v8::MaybeLocal<v8::Value> AsyncWrap::MakeCallback(
    const v8::Local<v8::Name> symbol,  
    int argc,
    v8::Local<v8::Value>* argv)
{  
  v8::Local<v8::Value> cb_v;  
  // 从对象中取出该 symbol 属性对应的值，值是个函数
  // symbol 的值通常在 JS 层设置，比如 onread = xxx，oncomplete = xxx  
  if (!object()->Get(env()->context(), symbol).ToLocal(&cb_v))  
    return v8::MaybeLocal<v8::Value>();  
  // 需要是个函数  
  if (!cb_v->IsFunction()) {  
    return v8::MaybeLocal<v8::Value>();  
  }  
  // 回调，见 async_wrap.cc  
  return MakeCallback(cb_v.As<v8::Function>(), argc, argv);  
}  
```
以上只是入口函数，看看真正的实现。

```c++
MaybeLocal<Value> AsyncWrap::MakeCallback(const Local<Function> cb,  
                                          int argc,  
                                          Local<Value>* argv) {  
  
  MaybeLocal<Value> ret = InternalMakeCallback(env(), object(), cb, argc, argv, context);  
  return ret;  
}  
```

接着看一下 InternalMakeCallback

```c++
MaybeLocal<Value> InternalMakeCallback(Environment* env,  
                                       Local<Object> recv,  
                                       const Local<Function> callback,  
                                       int argc,  
                                       Local<Value> argv[],  
                                       async_context asyncContext) {  
  // …省略其他代码
  // 执行 JS 层回调  
  callback->Call(env->context(), recv, argc, argv);}  

```

最终通过 V8 Function 的 Call 执行该 JS 函数。

HandleWrap

HandleWrap 是对 Libuv uv_handle_t 结构体和操作的封装，也是很多 C++ 类的基类，比如 TCP、UDP。结构图如下。

```c++
class HandleWrap : public AsyncWrap {  
 public:  
  // 操作和判断 handle 状态函数，对 Libuv 的封装  
  static void Close(...);  
  static void Ref(...);  
  static void Unref(...);  
  static void HasRef(...);  
  static inline bool IsAlive(const HandleWrap* wrap) {  
    return wrap != nullptr && wrap->state_ != kClosed;  
  }  
  
  static inline bool HasRef(const HandleWrap* wrap) {  
    return IsAlive(wrap) && uv_has_ref(wrap->GetHandle());  
  }  
  // 获取封装的 handle  
  inline uv_handle_t* GetHandle() const { return handle_; }  
  // 关闭 handle，如果传入回调则在 close 阶段被执行  
  virtual void Close(v8::Local<v8::Value> close_callback = v8::Local<v8::Value>());  
  
 protected:  
  // 子类可实现
  virtual void OnClose() {}  
  // handle 状态  
  inline bool IsHandleClosing() const {  
    return state_ == kClosing || state_ == kClosed;  
  }  
  
 private:   
  static void OnClose(uv_handle_t* handle);  
  
  // handle 队列  
  ListNode<HandleWrap> handle_wrap_queue_;  
  // handle 的状态  
  enum { kInitialized, kClosing, kClosed } state_;  
  // 所有 handle 的基类  
  uv_handle_t* const handle_;  
};  

```

HandleWrap 有个 handle_ 成员，它指向子类的 handle 类结构体，比如 TCP 模块的 uv_tcp_t，然后剩下的功能就是对 handle 管理的逻辑，比如 Ref 和 Unref 用于控制该 handle 是否影响事件循环的退出。


构造函数

```c++
/* 
  object 为 JS 层对象 
  handle 为子类具体的 handle 类型，不同模块不一样 
*/  
HandleWrap::HandleWrap(Environment* env,  
                       Local<Object> object,  
                       uv_handle_t* handle,  
                       AsyncWrap::ProviderType provider)  
    : AsyncWrap(env, object, provider),  
      state_(kInitialized),  
      handle_(handle) {  
  // 保存 Libuv handle 和 C++ 对象的关系，Libuv 执行 C++ 回调时使用
  handle_->data = this;  
}  

```

判断和操作 handle 状态

```c++
// 修改 handle 为活跃状态  
void HandleWrap::Ref(const FunctionCallbackInfo<Value>& args) {  
  HandleWrap* wrap;  
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());  
  
  if (IsAlive(wrap))  
    uv_ref(wrap->GetHandle());  
}  
  
// 修改 hande 为不活跃状态  
void HandleWrap::Unref(const FunctionCallbackInfo<Value>& args) {  
  HandleWrap* wrap;  
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());  
  
  if (IsAlive(wrap))  
    uv_unref(wrap->GetHandle());  
}  
  
// 判断 handle 是否处于活跃状态  
void HandleWrap::HasRef(const FunctionCallbackInfo<Value>& args) {  
  HandleWrap* wrap;  
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());  
  args.GetReturnValue().Set(HasRef(wrap));  
}  

// 关闭 handle（JS 层调用） 
void HandleWrap::Close(const FunctionCallbackInfo<Value>& args) {  
  HandleWrap* wrap;  
  ASSIGN_OR_RETURN_UNWRAP(&wrap, args.Holder());  
  // 传入回调  
  wrap->Close(args[0]);  
}  

// 真正关闭 handle 的函数  
void HandleWrap::Close(Local<Value> close_callback) {  
  // 正在关闭或已经关闭  
  if (state_ != kInitialized)  
    return;  
  // 调用 Libuv 函数  
  uv_close(handle_, OnClose);  
  // 关闭中  
  state_ = kClosing;  
  // 传了 onclose 回调则保存起来，在 close 阶段后调用  
  if (!close_callback.IsEmpty() && 
       close_callback->IsFunction() &&  
      !persistent().IsEmpty()) {  
    object()->Set(env()->context(),  
                  env()->handle_onclose_symbol(),  
                  close_callback).Check();  
  }  
}  
  
// 关闭 handle 成功后回调，Libuv 层执行  
void HandleWrap::OnClose(uv_handle_t* handle) {  
  Environment* env = wrap->env();  
  wrap->state_ = kClosed;  
  // 执行子类的 onClose，如果没有则是空操作
  wrap->OnClose();  
  // 有 JS 层 onclose 回调则执行  
  if (!wrap->persistent().IsEmpty() &&  
      wrap->object()->Has(env->context(), env->handle_onclose_symbol())  
      .FromMaybe(false)) {  
    wrap->MakeCallback(env->handle_onclose_symbol(), 
                       0,
                       nullptr);  
  }  
}  

```

ReqWrap

ReqWrap 表示通过 Libuv 对 handle 的一次请求，比如读取文件。ReqWrap 是请求操作的基类，可以实现不同的子类。

```c++
template <typename T>  
class ReqWrap : public AsyncWrap, public ReqWrapBase { 
 protected:  
  // Libuv 请求结构体，类型由子类决定
  T req_;  
};   
```

看一下实现:

```c++
template <typename T>  
ReqWrap<T>::ReqWrap(Environment* env,  
                    v8::Local<v8::Object> object,  
                    AsyncWrap::ProviderType provider)  
    : AsyncWrap(env, object, provider),  
      ReqWrapBase(env) {
  // 初始化状态  
  Reset();  
}   
  
// 重置字段  
template <typename T>  
void ReqWrap<T>::Reset() {  
  // 由 Libuv 调用的 C++ 层回调
  original_callback_ = nullptr;  
  req_.data = nullptr;  
}  
```

构造函数没有太多逻辑，只是做了一些初始化的事情。接着看发起请求时的逻辑

```c++

// 获取 Libuv 请求结构体
T* req() { return &req_; }  

// 保存 Libuv 数据结构和 ReqWrap 实例的关系，发起请求时调用  
template <typename T>  
void ReqWrap<T>::Dispatched() {  
  req_.data = this;  
} 

// 调用 Libuv 函数  
template <typename T>
template <typename LibuvFunction, typename... Args>
int ReqWrap<T>::Dispatch(LibuvFunction fn, Args... args) {
  // 关联 Libuv 结构体和 C++ 请求对象
  Dispatched();
  CallLibuvFunction<T, LibuvFunction>::Call(
      // 执行 Libuv 函数
      fn,
      env()->event_loop(),
      req(),
      // 由 Libuv 执行的回调，args 通常 handle，参数，回调
      MakeLibuvRequestCallback<T, Args>::For(this, args)...);
}
```
当 Node.js 需求发起一个请求时，会先创建一个 ReqWrap 的子类对象，然后调 Dispatch 发起真正的请求，Dispatch 通过 CallLibuvFunction<T, LibuvFunction>::Call 调用 Libuv 的函数.

```c++
// Detect `int uv_foo(uv_loop_t* loop, uv_req_t* request, ...);`.
template <typename ReqT, typename... Args>
struct CallLibuvFunction<ReqT, int(*)(uv_loop_t*, ReqT*, Args...)> {
  using T = int(*)(uv_loop_t*, ReqT*, Args...);
  template <typename... PassedArgs>
  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {
    return fn(loop, req, args...);
  }
};

// Detect `int uv_foo(uv_req_t* request, ...);`.
template <typename ReqT, typename... Args>
struct CallLibuvFunction<ReqT, int(*)(ReqT*, Args...)> {
  using T = int(*)(ReqT*, Args...);
  template <typename... PassedArgs>
  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {
    return fn(req, args...);
  }
};

// Detect `void uv_foo(uv_req_t* request, ...);`.
template <typename ReqT, typename... Args>
struct CallLibuvFunction<ReqT, void(*)(ReqT*, Args...)> {
  using T = void(*)(ReqT*, Args...);
  template <typename... PassedArgs>
  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {
    fn(req, args...);
    return 0;
  }
};
```

Node.js 针对不了的 Libuv 函数签名格式编写了不同的模版函数，不过我们不用过于纠结细节，只需要知道它最终会调用 Libuv 的某个函数，并传入了一系列参数，其中一个为 MakeLibuvRequestCallback<T, Args>::For(this, args)...。

```c++
// 通过 req 成员找所属对象的地址
template <typename T>
ReqWrap<T>* ReqWrap<T>::from_req(T* req) {
  return ContainerOf(&ReqWrap<T>::req_, req);
}

template <typename ReqT, typename T>
struct MakeLibuvRequestCallback {
  // 匹配第二个参数为非函数
  static T For(ReqWrap<ReqT>* req_wrap, T v) {
    return v;
  }
};

template <typename ReqT, typename... Args>
struct MakeLibuvRequestCallback<ReqT, void(*)(ReqT*, Args...)> {
  using F = void(*)(ReqT* req, Args... args);
  // Libuv 回调
  static void Wrapper(ReqT* req, Args... args) {
    // 通过 Libuv 结构体拿到对应的 C++ 对象
    ReqWrap<ReqT>* req_wrap = ReqWrap<ReqT>::from_req(req);
    // 拿到原始的回调执行
    F original_callback = reinterpret_cast<F>(req_wrap->original_callback_);
    original_callback(req, args...);
  }
  // 匹配第二个参数为函数
  static F For(ReqWrap<ReqT>* req_wrap, F v) {
    // 保存原来的函数
    req_wrap->original_callback_ = reinterpret_cast<typename ReqWrap<ReqT>::callback_t>(v);
    // 返回包裹函数
    return Wrapper;
  }
};
```
MakeLibuvRequestCallback::For 用于适配不同的 Dispatch 调用格式，例如 TCP 连接和 DNS 解析。

```c++
 // TCP 连接
 req_wrap->Dispatch(uv_tcp_connect,
                    &wrap->handle_,
                    reinterpret_cast<const sockaddr*>(&addr),
                    AfterConnect); // 回调
 // DNS 解析
 req_wrap->Dispatch(uv_getaddrinfo,
                    AfterGetAddrInfo, // 回调
                    *hostname,
                    nullptr,
                    &hints);
```


MakeLibuvRequestCallback::For 会遍历传入的参数，如果是非函数参数，则透传给 Libuv，如果是函数参数时会执行第二个 For 函数，第二个 For 函数封装了原始的回调，然后把一个 Wrapper 函数传入 Libuv，等到 Libuv 回调时，再执行真正的回调，通过这种劫持的方式，C++ 层可以做一些额外的事情。执行 Dispatch 后的结构图如下(图7-8)所示。

总的来说，ReqWrap 抽象了请求 Libuv 的过程，具体数据结构和操作由子类实现，看一下某个子类的实现。

```c++
// 请求 Libuv 时，数据结构是 uv_connect_t，表示一次连接请求  
class ConnectWrap : public ReqWrap<uv_connect_t> {  
 public:  
  ConnectWrap(...);  
};  
```

当发起一个 TCP 连接时，使用方式如下

```c++
// req_wrap_obj JS 层传来的 req 对象
ConnectWrap* req_wrap = new ConnectWrap(env, req_wrap_obj, ...);
// 发起请求，回调为 AfterConnect
req_wrap->Dispatch(uv_tcp_connect,
                   &wrap->handle_,
                   reinterpret_cast<const sockaddr*>(&addr),
                   AfterConnect);

```


## JS 和 C、C++ 层通信

接下来我们看一下 JS 和 C、C++ 层的通信，Node.js 很多功能都是由 C、C++ 实现，然后暴露到 JS 层使用的，所以当我们调用 JS 代码时，就会进入 C++ 层，接着 C++ 层会进入 Libuv 的 C 层，等到 Libuv 完成操作后就会回调 C++ 代码，最终 C++ 代码再回调 JS 层。


### JS 调用 C++ ？

JS 本身是没有网络、文件和进程这些功能的，在 Node.js 里，这些功能需要通过底层的 C、C++ 实现，最终通过 JS API 提供给用户使用。那么当我们调用一个 JS API 时，底层发生了什么呢？我们以 TCP 模块为例，下面的代码摘自 Node.js 的 net 模块。

```js
const { TCP }= process.binding('tcp_wrap');    
const tcp = new TCP(...);    
```

在 Node.js 中，C++ 模块（类）一般只会定义对应的 Libuv 结构体和一系列函数，然后创建一个函数模版，并传入一个回调，接着把这些函数挂载到函数模板中，最后通过函数模板返回一个函数 F 给 JS 层使用。我们从 C++ 的层面先分析执行 new TCP() 的逻辑，再分析 bind 的逻辑，这两个逻辑涉及的机制是其它 C++ 模块也会使用到的。首先看看 TCP 在 C++ 层的实现。

```c++
void TCPWrap::Initialize(Local<Object> target,
                         Local<Value> unused,
                         Local<Context> context,
                         void* priv) {
  Environment* env = Environment::GetCurrent(context);
  // 创建一个函数模版
  Local<FunctionTemplate> t = env->NewFunctionTemplate(New);
  // 函数名
  Local<String> tcpString = FIXED_ONE_BYTE_STRING(env->isolate(), "TCP");
  t->SetClassName(tcpString);
  // 可关联的 C++ 对象个数
  t->InstanceTemplate()->SetInternalFieldCount(StreamBase::kInternalFieldCount);
  // 设置原型方法
  env->SetProtoMethod(t, "open", Open);
  env->SetProtoMethod(t, "bind", Bind);
  // ...
  // 根据函数模块导出一个函数到 JS 层
  target->Set(env->context(),
              tcpString,
              t->GetFunction(env->context()).ToLocalChecked()).Check();
```

当 JS 层执行 new TCP 时，C++ 层就会创建一个对象（ JS 层拿到的对象），然后把这个对象和 JS 层传入的参数传给 TCPWrap::New 函数。

```c++
void TCPWrap::New(const FunctionCallbackInfo<Value>& args) {  
  new TCPWrap(env, args.This(), ...);  
}  
```

TCPWrap 继承了 HandleWrap。

```c++
HandleWrap::HandleWrap(Environment* env,  
                       Local<Object> object,  
                       uv_handle_t* handle,  
                       AsyncWrap::ProviderType provider)  
    : AsyncWrap(env, object, provider),  
      state_(kInitialized),  
      handle_(handle) {  
  // 保存 Libuv handle 和 C++ 对象的关系  
  handle_->data = this;  
}  
```

HandleWrap 保存了 Libuv 结构体和 C++ 对象的关系，这样我们从 Libuv 回调时就可以知道 handle 对应的 C++ 对象。HandleWrap 继承了 BaseObject。

```c++
// 把对象存储到 persistent_handle_ 中，需要的时候通过 object() 取出来  
BaseObject::BaseObject(Environment* env, v8::Local<v8::Object> object)  
    : persistent_handle_(env->isolate(), object), env_(env) {  
  // 把 this 存到 object中，BaseObject::kSlot 为 0  
  object->SetAlignedPointerInInternalField(BaseObject::kSlot, static_cast<void*>(this));    
}  
```
前面讲过，SetAlignedPointerInInternalField 函数做的事情就是把一个值（TCPWrap对象）保存到 JS 对象 object 里。如下图7-9所示。

这时候 new TCP 就执行完毕了，下面我们会看到这些关联起来的对象有什么作用，接着看在 JS 层执行tcp.connect(...) 函数的逻辑。

```js
const req = new TCPConnectWrap();
req.oncomplete = afterConnect;
req.address = address;
req.port = port;
req.localAddress = localAddress;
req.localPort = localPort;
self._handle.connect(req, address, port);
```

接着看 C++ 层 connect 函数。

```c++
template <typename T>
void TCPWrap::Connect(...) {
  TCPWrap* wrap;
  // 从 JS 对象拿到关联的 C++ 对象
  /*
        wrap = args.Holder()->GetAlignedPointerFromInternalField(BaseObject::kSlot));
  */
  ASSIGN_OR_RETURN_UNWRAP(&wrap,
                          args.Holder(),
                          args.GetReturnValue().Set(UV_EBADF));
  // 从 C++ 对象 TCPWrap 中获得 Libuv 的 handle 结构体
  uv_tcp_connect(&wrap->handle_, ...);
}
```

我们只需看一下 ASSIGN_OR_RETURN_UNWRAP 宏的逻辑，主要是从 args.Holder() 中获取对应的 C++ 对象（TCPWrap），然后就可以使用 TCPWrap 对象的 handle 去请求 Libuv 了。


## C++ 调用 Libuv

那么 C++ 调用 Libuv 又是如何串起来的呢？来详细看一下 connect 函数的代码。

```c++
void TCPWrap::Connect(const FunctionCallbackInfo<Value>& args,  
    std::function<int(const char* ip_address, T* addr)> uv_ip_addr) {  
  Environment* env = Environment::GetCurrent(args);  
  
  TCPWrap* wrap;  
  ASSIGN_OR_RETURN_UNWRAP(&wrap,  
                          args.Holder(),  
                          args.GetReturnValue().Set(UV_EBADF));  
  
  // 第一个参数是 TCPConnectWrap 对象
  Local<Object> req_wrap_obj = args[0].As<Object>();  
  // 忽略其他参数处理
  // 创建一个对象请求 Libuv
  ConnectWrap* req_wrap =  new ConnectWrap(env,  req_wrap_obj, ...);  
  req_wrap->Dispatch(uv_tcp_connect,  
                     &wrap->handle_,  
                     reinterpret_cast<const sockaddr*>(&addr),  
                     AfterConnect);  
}  
```

ConnectWrap 是 C++ 类，继承了 BaseObject，req_wrap_obj 是 JS 对象，它们会互相关联，和之前分析的一样。

图7-10

另外，ConnectWrap 还继承了 ReqWrap，ReqWrap 是用于管理 Libuv 请求的。接着看一下 Dispatch。


```c++
// 调用 Libuv 函数  
int ReqWrap<T>::Dispatch(LibuvFunction fn, Args... args) {  
  // 保存 Libuv 结构体和 C++ 层对象 ConnectWrap 的关系    
  req_.data = this;    
  CallLibuvFunction<T, LibuvFunction>::Call(  
      fn,  
      env()->event_loop(),  
      req(),  
      MakeLibuvRequestCallback<T, Args>::For(this, args)...);   
}  
```

调用 Libuv 之前的结构如下图所示：7-11



接下来分析调用 Libuv 的具体过程：

```c++
uv_tcp_connect(  
  req(),  
  &wrap->handle_,  
  reinterpret_cast<const sockaddr*>(&addr),  
  AfterConnect
);  
```

再看看uv_tcp_connect做了什么。

```c++
    int uv_tcp_connect(uv_connect_t* req,  
                       uv_tcp_t* handle,  
                       const struct sockaddr* addr,  
                       uv_connect_cb cb) {  
      // ...  
      return uv__tcp_connect(req, handle, addr, addrlen, cb);  
    }  
      
    int uv__tcp_connect(uv_connect_t* req,  
                        uv_tcp_t* handle,  
                        const struct sockaddr* addr,  
                        unsigned int addrlen,  
                        uv_connect_cb cb) {  
      int err;  
      int r;  
      
      // 非阻塞发起连接
      connect(uv__stream_fd(handle), addr, addrlen);
      // 保存回调 AfterConnect
      req->cb = cb;
      // 关联起来  
      req->handle = (uv_stream_t*) handle;  
      // 注册事件，连接结束后触发，然后执行回调
      uv__io_start(handle->loop, &handle->io_watcher, POLLOUT);
      // ...  
    }  
```

Libuv 中保存了请求上下文，比如回调，并把 req 和 handle 做了关联，在执行回调时会使用，如下图所示。7-12

## Libuv 回调 C++

分析完 C++ 调用 Libuv 后，我们看看 Libuv 回调 C++ 的。当连接结束后，比如完成了三次握手，操作系统会通知 Libuv，Libuv 会执行 uv__stream_connect 处理连接结果 。

```c
static void uv__stream_connect(uv_stream_t* stream) {
  int error;
  uv_connect_t* req = stream->connect_req;
  socklen_t errorsize = sizeof(int);
  // 获取连接结果
  getsockopt(uv__stream_fd(stream),
             SOL_SOCKET,
             SO_ERROR,
             &error,
             &errorsize);
    error = UV__ERR(error);
  // 执行回调
  if (req->cb)
    req->cb(req, error);
}
```

uv__stream_connect 从操作系统获取连接结果，然后执行 C++ 层回调，从前面的分析中可以知道回调函数是 AfterConnect。

```c++

void ConnectionWrap<WrapType, UVType>::AfterConnect(uv_connect_t* req,  
                                                    int status) {  
  // 从 Libuv 结构体拿到 C++ 层的请求对象  
  std::unique_ptr<ConnectWrap> req_wrap(static_cast<ConnectWrap*>(req->data));  
  // 从 C++ 层请求对象拿到对应的 handle 结构体（Libuv 里关联起来的），
  // 再通过 handle 拿到对应的C++层 TCPWrap 对象（HandleWrap 关联的）  
  WrapType* wrap = static_cast<WrapType*>(req->handle->data);  
  Environment* env = wrap->env();  
  ...  
  Local<Value> argv[5] = {  
    Integer::New(env->isolate(), status),  
    wrap->object(),  
    req_wrap->object(),  
    Boolean::New(env->isolate(), readable),  
    Boolean::New(env->isolate(), writable)  
  };  
  // 回调 JS 层 oncomplete  
  req_wrap->MakeCallback(env->oncomplete_string(), 
                         arraysize(argv), 
                         argv);  
}    

```

AfterConnect 通过之前的关联关系拿到 TCPWrap 对象，最后再通过 req_wrap 对象（ConnectWrap）的 MakeCallback 执行 JS 回调。

## C++ 回调 JS

接着看 MakeCallback 是如何回调 JS 的。

```c++
inline v8::MaybeLocal<v8::Value> AsyncWrap::MakeCallback(
    const v8::Local<v8::String> symbol,
    int argc,
    v8::Local<v8::Value>* argv) {
  return MakeCallback(symbol.As<v8::Name>(), argc, argv);
}

inline v8::MaybeLocal<v8::Value> AsyncWrap::MakeCallback(
    const v8::Local<v8::Name> symbol,
    int argc,
    v8::Local<v8::Value>* argv) {
    
  v8::Local<v8::Value> cb_v;
  // 通过 ConnectWrap 的 object() 获取关联的 JS 对象并获取 oncomplete 属性的值
  object()->Get(env()->context(), symbol).ToLocal(&cb_v)
    
  return MakeCallback(cb_v.As<v8::Function>(), argc, argv);
}
```

这样就完成了回调 JS 层。整个过程翻译成 JS 大致如下：
```js
// 操作系统
let fd = 0;
function socket() {
    return ++fd;
}
function connect(fd, addr, port, req) {
    return new Promise(resolve => {
        // 模拟
        setTimeout(() => {
            resolve(0);
        }, 1000);
    })
}

//Libuv  
async function uv_tcp_connect(req, handle, addr, port, cb) { 
    handle.fd = socket();
    req.handle = handle;
    req.cb = cb;
    const status = await connect(handle.fd, addr, port);
    req.cb(req, status);
 }    
      
// C++  
class ConnectWrap {
    uv_connect_t = {};
    constructor(object) {
        object[0] = this;
        this.object = object;
    }
    Dispatch(fn, ...args) {
        this.uv_connect_t.data = this;
        fn(this.uv_connect_t, ...args);
    }
    MakeCallback(key, ...args) {
        this.object[key](...args);
    }
}
class TCPWrap {    
  uv_tcp_t = {};    
  constructor() {
    this.uv_tcp_t.data = this;
  }
  static Connect(req, addr, port) {    
    const tcpWrap = this[0];    
    const connectWrap = new ConnectWrap(req);
    connectWrap.Dispatch(
        uv_tcp_connect, 
        tcpWrap.uv_tcp_t,  
        addr,  
        port,
        (req, status) => { 
          const connectWrap = req.data;
          const tcpWrap = req.handle.data;
          connectWrap.MakeCallback('oncomplete', tcpWrap, connectWrap, status);
        }
    );    
 }    
  
}    
  
function FunctionTemplate(cb) {    
   function Tmp() {  
    Object.assign(this, map);  
    cb && cb(this);  
   }  
   const map = {};  
   return {  
    PrototypeTemplate: function() {  
        return {  
            set: function(k, v) {  
                Tmp.prototype[k] = v;  
            }  
        }  
    },  
    InstanceTemplate: function() {  
        return {  
            set: function(k, v) {  
                map[k] = v;  
            }  
        }  
    },  
    GetFunction() {  
        return Tmp;  
    }  
   }   
  
}    
  
const TCPFunctionTemplate = FunctionTemplate((target) => { target[0] = new TCPWrap(); })    
  
TCPFunctionTemplate.PrototypeTemplate().set('connect', TCPWrap.Connect);  
TCPFunctionTemplate.InstanceTemplate().set('name', 'hi');  
const TCP = TCPFunctionTemplate.GetFunction();  

const TCPConnectWrapFunctionTemplate = FunctionTemplate();    
const TCPConnectWrap = TCPConnectWrapFunctionTemplate.GetFunction(); 

// JS  
const tcp = new TCP();  
const req = new TCPConnectWrap();
const address = '127.0.0.1';
const port = 80;
req.oncomplete = () => { console.log('connect 成功'); };
req.address = address;
req.port = port;
tcp.connect(req, address, port);
```

总结
这节课我们围绕 C++ 层是如何把 Libuv 的功能引入 JS 的，详细讲解了 C++ 层核心内容。

Node.js 通过 V8 提供的函数模版和对象模版来拓展 JS 的功能。
C++ 层的核心数据结构大多数是 C++ 类的基类，它们封装了很多通用的逻辑。BaseObject 用于 JS 和 C++ 对象的管理，AsyncWrap 用于异步回调 JS，HandleWrap 和 ReqWrap 是对 Libuv handle 和 request 的封装，这是我们必须理解的核心数据结构，后面的课程中会大量引用。
我们沿着 JS 到 C++ 再到 Libuv，然后从 Libuv 到 C++，再到 JS 的路线进行了详细的分析，在这个过程中，我们需要捋清楚 JS、C++ 和 Libuv 三层之间，数据结构的关联关系，否则就会陷入迷雾中。


