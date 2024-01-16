# 模块加载的实现

Node.js 中，我们只需要使用 require 就可以加载各种类型的模块，但是这个 require 到底是什么呢？它的背后到底做了什么事情？下面来详细看一下它的实现。我们从执行一个 Node.js 应用开始分析，假设我们有一个文件 demo.js，代码如下：

```js
module.exports = 1;
```
我们看一下执行 node demo.js 的过程是怎样的。在 Node.js 启动过程的课程中讲过，Node.js 启动过程中最终会执行以下代码。

```js
require('internal/modules/cjs/loader').Module.runMain(process.argv[1]);
```

require 是 C++ 层传入的内置 JS 模块加载器，runMain 函数在 pre_execution.js 的 initializeCJSLoader 中挂载。

```js
function initializeCJSLoader() {  
  const CJSLoader = require('internal/modules/cjs/loader');  
  CJSLoader.Module.runMain = require('internal/modules/run_main').executeUserEntryPoint;  
}  
```

我们看到 runMain 是 run_main.js 模块导出的函数。

```js
const CJSLoader = require('internal/modules/cjs/loader');
const { Module } = CJSLoader;
function executeUserEntryPoint(main = process.argv[1]) {  
  Module._load(main, null, true);    
}  
  
module.exports = {  
  executeUserEntryPoint  
};  
```

最终执行的是 executeUserEntryPoint，入参是 process.argv[1]，process.argv[1] 就是我们要执行的 JS 文件，最后通过 Module._load 加载了demo.js。下面看一下具体的处理逻辑。

```js
Module._load = function(request, parent, isMain) {  
  const filename = Module._resolveFilename(request, parent, isMain);  
  
  const cachedModule = Module._cache[filename];  
  // 有缓存则直接返回  
  if (cachedModule !== undefined) {  
    return cachedModule.exports;  
  }  
  // 是否是可访问的内置 JS 模块，是则返回  
  const mod = loadNativeModule(filename, request);  
  if (mod && mod.canBeRequiredByUsers) return mod.exports;  
  // 非原生 JS 模块，则新建一个 Module 表示加载的模块  
  const module = new Module(filename, parent);  
  // 缓存  
  Module._cache[filename] = module;  
  let threw = true;
  try {
    // 加载
    module.load(filename);
    threw = false;
  } finally {
    // 加载失败则删除缓存，避免内存泄露
    if (threw) {
      delete Module._cache[filename];
    }
  }
  // 加载中设置了 module.exports 的值，这里返回
  return module.exports;  
};  
```

_load 函数主要是 3 个逻辑：

判断是否有缓存，有则返回；
没有缓存，则判断是否是原生 JS 模块，是则交给原生模块处理；
不是原生模块，则新建一个 Module 表示用户的 JS 模块，然后执行 load 函数加载。
这里我们只需要关注 3 的逻辑，在 Node.js 中，用户定义的模块使用 Module 表示，也就是我们在代码里使用的 module 对象，比如我们经常使用 module.exports 导出模块的功能。

```js
function Module(id = '', parent) {  
  // 模块对应的文件路径  
  this.id = id;  
  this.path = path.dirname(id);  
  // 在模块里使用的 exports 变量  
  this.exports = {};  
  this.parent = parent;  
  // 加入父模块的 children 队列  
  updateChildren(parent, this, false);  
  this.filename = null;  
  // 是否已经加载  
  this.loaded = false;  
  this.children = [];  
}  
```
接着看一下 load 函数的逻辑。

```js
Module.prototype.load = function(filename) {  
  this.filename = filename;  
  // 根据文件名找到拓展名  
  const extension = findLongestRegisteredExtension(filename);  
  // 根据拓展名使用不同的加载方式  
  Module._extensions[extension](this, filename);  
  this.loaded = true;  
};  
```

Node.js 会根据不同的文件拓展名使用不同的函数处理。_extensions 有 3 种，分别是 json、js、node（Addon 模块）。

JSON 模块
加载 JSON 模块是比较简单的，直接读取 JSON 文件的内容，然后解析成对象就行。

```js
Module._extensions['.json'] = function(module, filename) {  
  const content = fs.readFileSync(filename, 'utf8');  
  
  try {  
    module.exports = JSONParse(stripBOM(content));  
  } catch (err) {  
    err.message = filename + ': ' + err.message;  
    throw err;  
  }  
};  
```

用户 JS 模块
用户 JS 模块就是我们自己实现的 JS 代码，而不是 Node.js 内置的 JS 代码。用户 JS 模块的处理函数如下。

```js
Module._extensions['.js'] = function(module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  module._compile(content, filename);
};
```

首先同步从硬盘中读取文件内容到内存中，读完文件的内容后，接着执行 _compile 函数。

```js
Module.prototype._compile = function(content, filename) {  
  // 生成一个函数  
  const compiledWrapper = wrapSafe(filename, content, this);  
  const dirname = path.dirname(filename);  
  // 模块里使用的 require 函数，用于加载其他模块（用户 JS 和内置 JS 模块）
  const require = (path) => {
      // this.require是对 _load 函数的封装 
      return this.require(path);
    };
  let result;  
  // 我们平时使用的 exports 变量
  const exports = this.exports;  
  const thisValue = exports; 
  // 我们平时使用的 module 变量 
  const module = this;  
  // 执行函数  
  result = compiledWrapper.call(thisValue,
                                exports, 
                                require, 
                                module, 
                                filename, 
                                dirname);  
  return result;  
}  
```
_compile 首先通过 wrapSafe 编译需要加载的 JS 代码。

```js
function wrapSafe(filename, content, cjsModuleInstance) {    
    compiled = compileFunction(
      // 要执行的代码
      content,
      // 对应的文件
      filename,
      0,
      0,
      undefined,
      false,
      undefined,
      [],
      // 形参
      [
        'exports',
        'require',
        'module',
        '__filename',
        '__dirname',
      ]
    );  
}    
   
```

compileFunction 是 C++ 层提供的函数，主要是对 V8 CompileFunctionInContext 的封装。

```c++
void ContextifyContext::CompileFunction(
    const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args);
  Isolate* isolate = env->isolate();
  Local<Context> context = env->context();

  // 要执行的代码
  Local<String> code = args[0].As<String>();

  // 对应的文件
  Local<String> filename = args[1].As<String>();
  
  // 忽略其他参数的处理
  
  // 形参
  Local<Array> params_buf;
  if (!args[8]->IsUndefined()) {
    params_buf = args[8].As<Array>();
  }
  // 代码的元信息
  ScriptOrigin origin(filename, ...);

  ScriptCompiler::Source source(code, origin, cached_data);
  
  // 形参
  std::vector<Local<String>> params;
  if (!params_buf.IsEmpty()) {
    for (uint32_t n = 0; n < params_buf->Length(); n++) {
      Local<Value> val;
      if (!params_buf->Get(context, n).ToLocal(&val)) return;
      params.push_back(val.As<String>());
    }
  }

  Local<ScriptOrModule> script;
  // 编译代码执行
  MaybeLocal<Function> maybe_fn = ScriptCompiler::CompileFunctionInContext(
      parsing_context, &source, params.size(), params.data(),
      context_extensions.size(), context_extensions.data(), options,
      v8::ScriptCompiler::NoCacheReason::kNoCacheNoReason, &script);
  // 返回一个函数，函数里面的代码是传入的 code
  Local<Function> fn = maybe_fn.ToLocalChecked();
  // 最终返回这个函数的信息
}
```

CompileFunction 返回类似以下函数。

```js
function fn(exports, require, module, __filename, __dirname) { 
  // code
};   
```

接着传入实参并执行这个函数，可以看到一共有五个参数，exports 和 module 就是我们在代码里经常用来导出模块内容的变量，module 是一个 Module 对象，exports 是 module 的属性，另外还有一个参数是 require，从这可以看到为什么我们在代码里没有定义 require 但是却可以使用，这个 require 函数就是从参数里来的，而不是全局变量。

```js
Module.prototype.require = function(id) {  
   requireDepth++;  
   try {  
     return Module._load(id, this, /* isMain */ false);  
   } finally {  
     requireDepth--;  
   }  
};  
```

require 是对 Module._load 的封装，这就意味着我们在代码里可以通过 require 加载用户 JS 和内置 JS 模块。最终执行以下代码。

```js
(function (exports, require, module, __filename, __dirname) {  
  // 可以 require 其他模块
  module.exports = 1;
});   
```
当执行require加载模块时，又回到了我们前面分析的这个过程，整体流程如下。
tu 9-4

## Addon 模块

接着看 Addon 模块的加载，Addon 模块本质上是动态链接库，所以我们先看看如何创建和使用一个动态链接库，代码可以参考[这里](https://github.com/theanarkh/nodejs-book/tree/main/src/dynamic_library)。首先创建一个 library.c 文件。

```c
int add(int a, int b)
{
  return a + b;
}
```

library.c 定义里一个 add 函数，然后使用以下命令编译成动态链接库。

```bash
gcc -fPIC -shared library.c -o liblibrary.so
```

接着写一个测试函数动态打开并使用该动态链接库。

```c
#include <stdio.h>  
#include <stdlib.h>  
#include <dlfcn.h>

typedef int(*fn)(int, int);

int main(){  
    // 打开一个动态链接库，拿到一个 handler  
    void * handler = dlopen("liblibrary.so",RTLD_LAZY);  
    // 取出动态链接库里的函数 add  
    void * add = dlsym(handler, "add");  
    // 执行  
    printf("%d",((fn)add)(1,1));  
    dlclose(handler);  
    return 0;  
}  

```

执行 gcc main.c -o main && ./main 后我们可以看到输出 2。每次调 dlopen 动态链接库的引用数会加一，引用数大于 0 时再调用 dlopen 不会再执行动态链接库的初始化函数，并且拿到的 handler 地址是一样的。每次 dlclose 会减一，如果引用数为 0 再调用 dlopen 则会重新执行动态链接库的初始化函数，并且 handler 对应的地址可能是不一样的，更多例子参考这里。

了解动态链接库的使用后，我们来看一下 Node.js 中几个和 Addon 相关的数据结构。先看看 binding::DLib 这个类。

```c++
class DLib {  
 public:  
  static const int kDefaultFlags = RTLD_LAZY;  
  DLib(const char* filename, int flags);  
  // 打开 / 关闭一个动态链接库
  bool Open();  
  void Close();  
  // 根据名字获取动态链接库中的函数地址
  void* GetSymbolAddress(const char* name);
  // 模块名
  const std::string filename_;  
  // 打开动态链接库时传入的 flags
  const int flags_;  
  std::string errmsg_;
  // 动态链接库的信息  
  void* handle_;  
  uv_lib_t lib_;  
};  
```

DLib 负责管理一个动态链接库，包括打开、关闭和获取某个函数的地址等。接着看一下 node_module。

```c++
struct node_module {
  int nm_version;
  // 模块属性，比如类型
  unsigned int nm_flags;
  // 打开动态链接库时返回的 handler
  void* nm_dso_handle;
  // 文件
  const char* nm_filename;
  // 钩子函数，不同钩子不同的签名格式
  node::addon_register_func nm_register_func;
  node::addon_context_register_func nm_context_register_func;
  // 模块名
  const char* nm_modname;
  // 根据模块类型自定义的数据结构
  void* nm_priv;
  struct node_module* nm_link;
};
```

node_module 是表示 C++ 模块的数据结构，比如内置 C++ 模块和 Addon 模块。其中 Addon 模块可以通过原生（struct node_module）和 NAPI 方式定义（struct napi_module），原生方式是直接面向 V8 和 Libuv 编程，需要考虑所使用 API 的兼容性问题，如果是源码分发，用户安装时需要有相应的环境，如果是预构建分发，我们通常需要为多个操作系统和多个 Node.js 提供相应的版本，所以我们尽量使用 NAPI 来写 Addon ，并根据操作系统提供预构建版本。

先看一下原生的定义方式，第一种方式如下。

```c++
void Init(v8::Local<v8::Object> exports) {}

NODE_MODULE(hello, Init)
```

NODE_MODULE 展开如下：

```c++
 #define NODE_MODULE(modname, regfunc)  \
     NODE_MODULE_X(modname, regfunc, NULL, 0)
     
 #define NODE_MODULE_X(modname, regfunc, priv, flags)                  \
 static node::node_module _module =                                \
    {                                                                 \
      NODE_MODULE_VERSION,                                            \
      flags,                                                          \
      NULL,              \
      __FILE__,             \                                         \
      (node::addon_register_func) (regfunc), /* Init 函数 */           \
      NULL,               \
      NODE_STRINGIFY(modname),                                        \
      priv,                                                           \
      NULL                   \
    };                                                                \
    static void _register_modname(void) __attribute__((constructor)); \                      \
    static void _register_modname(void)  {                            \
      node_module_register(&_module);                                 \
    }                                                                 \
  }
```
这种方式定义了一个 node_module 和一个 _register_modname（modname 由用户定义） 函数，__attribute((constructor)) 说明加载动态链接库时会执行该函数，也就是说这个函数会在我们 require 时被执行，下面再详细分析 _register_modname 的逻辑。另外需要注意的是，通过 NODE_MODULE 方式定义的 Addon 是只能被加载一次，除非关闭后重新打开。使用场景如下

如果先在主线程里加载该 Addon，则不能再在子线程里加载。
如果先在子线程里加载该 Addon，则不能再在主线程和其他子线程里加载，除非打开该 Addon 的子线程退出。
否则会提示 Module did not self-register 错误，当碰到这个错误时，很多同学可能不知道具体原因，其实从错误提示中，我们也的确看不出是什么原因。这也是看源码的一个好处，我们通过分析源码知道这个错误具体的原因。看一下下面的例子，当我们以以下方式加载一个通过 NODE_MODULE 定义的 addon 时，就会触发这个 Module did not self-register 错误，如果单独加载则正常，为什么呢？下面的内容会详细讲解。


```js
const { Worker, isMainThread } = require('worker_threads');
if (isMainThread) {
    require('addon');
    new Worker(__filename);
} else {
    require('addon');
}
```
如果我们想要定一个在主线程和子线程里都可以加载的 Addon，则需要定义一个 Context-aware Addon，具体可以参考 [Node.js 文档](https://nodejs.org/dist/latest-v19.x/docs/api/addons.html#context-aware-addons)，下面看一下定义方式。

```c++
void Initialize(
  Local<Object> exports,
  Local<Value> module,
  Local<Context> context
) {
  
}

NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)
```

宏展开后如下：

```c++
#define NODE_MODULE_CONTEXT_AWARE(modname, regfunc)                   \
  NODE_MODULE_CONTEXT_AWARE_X(modname, regfunc, NULL, 0)
  
  
#define NODE_MODULE_CONTEXT_AWARE_X(modname, regfunc, priv, flags)    \
  extern "C" {                                                        \
    static node::node_module _module =                                \
    {                                                                 \
      NODE_MODULE_VERSION,                                            \
      flags,                                                          \
      NULL,  /* NOLINT (readability/null_usage) */                    \
      __FILE__,                                                       \
      NULL,  /* NOLINT (readability/null_usage) */                    \
      (node::addon_context_register_func) (regfunc),                  \
      NODE_STRINGIFY(modname),                                        \
      priv,                                                           \
      NULL  /* NOLINT (readability/null_usage) */                     \
    };                                                                \
    NODE_C_CTOR(_register_ ## modname) {                              \
      node_module_register(&_module);                                 \
    }                                                                 \
  }    
```

这种也是定义了一个 node_module 和 _register_modname 函数，区别是设置的钩子函数是 addon_context_register_func，而不是 addon_register_func。继续看下一种定义方式。

```c++
void Hello(const FunctionCallbackInfo<Value>& args) {
  
}

NODE_MODULE_INIT(/*exports, module, context*/) {
  NODE_SET_METHOD(exports, "hello", Hello);
}
```

宏展开后如下。

```c++
#define NODE_MODULE_INIT()                                            \
  extern "C" NODE_MODULE_EXPORT void                                  \
  NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports,              \
                          v8::Local<v8::Value> module,                \
                          v8::Local<v8::Context> context);            \
  NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME,                     \
                            NODE_MODULE_INITIALIZER)                  \
  void NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports,         \
                               v8::Local<v8::Value> module,           \
                               v8::Local<v8::Context> context)

```
再次展开。

```c++
extern "C" __attribute__((visibility("default"))) void
node_register_module_vNODE_MODULE_VERSION(Local<Object> exports,
                        Local<Value> module,
                        Local<Context> context);
  extern "C" {                                                        \
    static node::node_module _module =                                \
    {                                                                 \
      NODE_MODULE_VERSION,                                            \
      flags,                                                          \
      NULL,  /* NOLINT (readability/null_usage) */                    \
      __FILE__,                                                       \
      NULL,                                                           \
       /* node_register_module_vNODE_MODULE_VERSION */                \
      (node::addon_context_register_func) (regfunc),                  \
      NODE_STRINGIFY(modname),                                        \
      priv,                                                           \
      NULL  /* NOLINT (readability/null_usage) */                     \
    };                                                                \
    NODE_C_CTOR(_register_ ## modname) {                              \
      node_module_register(&_module);                                 \
    }                                                                 \
  }  
  
node_register_module_vNODE_MODULE_VERSION(Local<Object> exports,
                        Local<Value> module,
                        Local<Context> context) {
  NODE_SET_METHOD(exports, "hello", Hello);
}
```
这种方式和前面一种类似，只是函数名格式不一样（从 _register_modname 变成 node_register_module_vNODE_MODULE_VERSION）。继续看下一种定义方式。

```c++
extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(Local<Object> exports,
                        Local<Value> module,
                        Local<Context> context) {
}
```

宏展开后如下。

```c++
extern "C" __attribute__((visibility("default"))) void
node_register_module_vNODE_MODULE_VERSION(Local<Object> exports,
                        Local<Value> module,
                        Local<Context> context) {
}
```

这种方式不需要定义 node_module 数据结构，而是通过显式定义一个node_register_module_vxxx 函数并导出来告诉 Node.js 该 Addon 的初始化函数，其中 NODE_MODULE_VERSION 随着 Node.js 的大版本变化，Node.js 加载 Addon 时会执行该函数，下面会具体分析。对于 Context-aware Addon 的定义我们随便选一种方式就可以了。

接着看通过 NAPI Addon 的定义方式，NAPI 的好处是 ABI 兼容的，我们编写的代码可跨 Node.js 的大版本运行。NAPI 方式定义的 Addon 有自己的数据结构 napi_module。

```c++
typedef struct {
  int nm_version;
  unsigned int nm_flags;
  const char* nm_filename;
  napi_addon_register_func nm_register_func;
  const char* nm_modname;
  void* nm_priv;
  void* reserved[4];
} napi_module;
```

先看第一种定义方式。

```c++
napi_value Init(napi_env env, napi_value exports) {}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

这是个宏定义，宏展开后如下。

```c++
#define NAPI_MODULE(modname, regfunc) \    
  NAPI_MODULE_X(modname, regfunc, NULL, 0)    
  
#define NAPI_MODULE_X(modname, regfunc, priv, flags)                  \    
   static napi_module _module = \    
   {                  \    
     NAPI_MODULE_VERSION, \    
     flags,          \    
     __FILE__,        \   
     // nm_register_func \ 
     regfunc,        \    
     #modname,        \    
     priv,            \    
     {0},            \    
   };                \    
   static void _register_modname(void) __attribute__((constructor)); \    
   static void _register_modname(void)      {    \    
     napi_module_register(&_module);  \    
   }      
```

通过 NAPI_MODULE 定义的 Addon，定义了一个 napi_module 结构体和 _register_modname 函数，并且 _register_modname 里调用的是 napi_module_register 而不是 node_module_register，不过 napi_module_register 里最终还是会调用 node_module_register。


```c++
void napi_module_register(napi_module* mod) {
  node::node_module* nm = new node::node_module {
    -1,
    mod->nm_flags | NM_F_DELETEME,
    nullptr,
    mod->nm_filename,
    nullptr,
    // addon_context_register_func
    napi_module_register_cb,
    mod->nm_modname,
    mod,  // 保存 napi_module 结构体
    nullptr,
  };
  node::node_module_register(nm);
}
```
接着看另一种 NAPI Addon 定义方式。

```c++
NAPI_MODULE_INIT() {
}
```

```c++
#define NAPI_MODULE_INIT()                                            \
  EXTERN_C_START                                                      \
  NAPI_MODULE_EXPORT napi_value                                       \
  NAPI_MODULE_INITIALIZER(napi_env env, napi_value exports);          \
  EXTERN_C_END                                                        \
  NAPI_MODULE(NODE_GYP_MODULE_NAME, NAPI_MODULE_INITIALIZER)          \
  napi_value NAPI_MODULE_INITIALIZER(napi_env env, napi_value exports)
```

```c++
extern "C" __attribute__((visibility("default"))) napi_value
napi_register_module_vNAPI_MODULE_VERSION(napi_env env, napi_value exports);

static napi_module _module = \    
   {                  \    
     NAPI_MODULE_VERSION, \    
     flags,          \    
     __FILE__,        \   
     // nm_register_func \ 
     napi_register_module_vNAPI_MODULE_VERSION,        \    
     #modname,        \    
     priv,            \    
     {0},            \    
   };                \
                  \    
static void _register_modname(void) __attribute__((constructor)); \    
static void _register_modname(void)      {    \    
 napi_module_register(&_module);  \    
}   
      
napi_value napi_register_module_vNAPI_MODULE_VERSION(napi_env env, napi_value exports)

```

这种方式和第一种是类似的，区别是函数的名字格式不一样，由用户定义的函数变成 napi_register_module_vNAPI_MODULE_VERSION，相当于 Node.js 帮起了名字。另外 NAPI 定义的 Addon 都是 Context-aware 的。

定义的方式很多，但是总结下来，第一种是导出一个函数，第二种是在打开动态链接库时注册执行 一个函数，另外 NODE_MODULE 定义的是 nm_register_func 钩子，其他定义方式定义的是 addon_context_register_func 钩子。接着看一下 Node.js 里是如何处理的，我们从加载 .node 模块的源码开始看。

```js
Module._extensions['.node'] = function(module, filename) {  
  // ...  
  return process.dlopen(module, path.toNamespacedPath(filename)); 
};  
```

直接调了 process.dlopen，该函数在 node.js 里定义

```c++
const rawMethods = internalBinding('process_methods');  
process.dlopen = rawMethods.dlopen;  
```
找到 process_methods 模块对应的是 node_process_methods.cc。

```c++
env->SetMethod(target, "dlopen", binding::DLOpen);  
```

继续分析刚才看到的 DLOpen 函数。

```c++
void DLOpen(const FunctionCallbackInfo<Value>& args) {  
  
  int32_t flags = DLib::kDefaultFlags;
  // 模块名
  node::Utf8Value filename(env->isolate(), args[1]);  
  // 加载并执行回调
  env->TryLoadAddon(*filename, flags, [&](DLib* dlib) {  
    // ... 
  });  
}  
```

接着看 TryLoadAddon 函数。

```c++
inline void Environment::TryLoadAddon(
    const char* filename,
    int flags,
    const std::function<bool(binding::DLib*)>& was_loaded) {
  // std::list<binding::DLib> loaded_addons_;
  // 创建一个 DLib 对象
  loaded_addons_.emplace_back(filename, flags);
  // loaded_addons_.back() 拿到上面创建的 DLib 对象
  if (!was_loaded(&loaded_addons_.back())) {
    loaded_addons_.pop_back();
  }
}
```

TryLoadAddon 创建了一个 binding::DLib 对象，接着以此对象为入参执行传入的函数，接着看 TryLoadAddon 里执行的函数，里面代码比较多，我们分开讲。

```c++
 env->TryLoadAddon(*filename, flags, [&](DLib* dlib) {  
    const bool is_opened = dlib->Open();
 }); 
   
```

首先通过 dlib->Open() 打开动态链接库。

```c++
bool DLib::Open() {  
  handle_ = dlopen(filename_.c_str(), flags_);  
  if (handle_ != nullptr) return true;  
  errmsg_ = dlerror();  
  return false;  
}  
```

刚才讲过，Addon 主要是两种定义方式，第一种是定义了一个打开链接库时执行 _register_modname 函数，第二种是导出了一个函数。我们看一下 _register_modname 做了什么事情，对于原生方式定义的 Addon，_register_modname 里执行了 node_module_register，对于 NAPI 定义的 Addon，_register_modname 里执行了 napi_module_register。我们只分析最长路径的情况：napi_module_register。

```c++
void napi_module_register(napi_module* mod) {
  node::node_module* nm = new node::node_module {
    -1,
    mod->nm_flags | NM_F_DELETEME,
    nullptr,
    mod->nm_filename,
    nullptr,
    // addon_context_register_func
    napi_module_register_cb,
    mod->nm_modname,
    mod,  // 保存 napi_module 结构体
    nullptr,
  };
  node::node_module_register(nm);
}
```

napi_module_register 中创建了一个 node_module 结构体，最终也是调用了 node_module_register。这里有两个关键的地方，首先 noed_module 结构体的钩子函数是 napi_module_register_cb，而不是用户定义的函数，用户定义的函数由 napi_module 保存。另外在 node_module 中保存了 napi_module 结构体，后续加载的时候会用到，最后继续调用 node_module_register。

```c++
extern "C" void node_module_register(void* m) {  
  thread_local_modpending = reinterpret_cast<struct node_module*>(m); 
}  
```
node_module_register 把 node_module 保存到 thread_local_modpending 中。thread_local_modpending 是一个线程独立的静态变量，所以多线程加载一个 Addon 也是安全的，它保存当前加载的模块。我们继续看 TryLoadAddon 中执行的代码。

```c++
const bool is_opened = dlib->Open();
node_module* mp = thread_local_modpending;  
thread_local_modpending = nullptr;  
```

这时候我们就知道刚才那个变量 thread_local_modpending 的作用了。node_module* mp = thread_local_modpending 后我们拿到了我们刚才定义的 Addon 模块的信息，继续看下面的代码。

```c++
// mp 非空说明 Addon 定义了初始化函数，并且是第一次加载或者关闭后重新加载
// 初始化函数最终会执行 node_module_register
if (mp != nullptr) {
  mp->nm_dso_handle = dlib->handle_;
  // 保存起来后面复用 global_handle_map.set(handle_, mp);
  dlib->SaveInGlobalHandleMap(mp);
}
```
缓存后继续处理

```c++
// 针对非 NAPI 格式定义的 Addon 进行校验，-1 是 NAPI 的值
// 如果 Addon 的 nm_version 和当前 Node.js 版本的不一致
if ((mp->nm_version != -1) && (mp->nm_version != NODE_MODULE_VERSION)) {
  // 如果定义了 node_register_module_vNODE_MODULE_VERSION 函数则执行
  if (auto callback = GetInitializerCallback(dlib)) {
    callback(exports, module, context);
    return true;
  }
  // 否则报错
  char errmsg[1024];
  snprintf(errmsg,
           sizeof(errmsg),
           "The module '%s'"
           "\nwas compiled against a different Node.js version using"
           "\nNODE_MODULE_VERSION %d. This version of Node.js requires"
           "\nNODE_MODULE_VERSION %d. Please try re-compiling or "
           "re-installing\nthe module (for instance, using `npm rebuild` "
           "or `npm install`).",
           *filename,
           mp->nm_version,
           NODE_MODULE_VERSION);

  dlib->Close();
  env->ThrowError(errmsg);
  return false;
}
```

从上面的代码中，可以看到非 NAPI 方式定义的 Addon 是不能跨 Node.js 版版本运行的，需要重新编译，否则就会报错，这个报错相信大家也见过。但是也有一个方法可以解决，也就是为其他版本的 Node.js 定义钩子函数，例如下面的代码。

```c++
void Initialize(
  Local<Object> exports,
  Local<Value> module,
  Local<Context> context
) {
  NODE_SET_METHOD(exports, "hello", Hello);
}
// 为 Node.js 18 定义钩子函数
extern "C" __attribute__((visibility("default"))) void node_register_module_v108(
  Local<Object> exports,
  Local<Value> module,
  Local<Context> context
) {
  NODE_SET_METHOD(exports, "hello", Hello);
}

NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)
```

上面的代码在 Node.js 17 下编译，然后可以直接在 Node.js 17 和 18 版本下运行。通过了校验后，则继续往下处理。

```c++
if (mp->nm_context_register_func != nullptr) {
  mp->nm_context_register_func(exports, module, context, mp->nm_priv);
} else if (mp->nm_register_func != nullptr) {
  mp->nm_register_func(exports, module, mp->nm_priv);
}
```

Addon 定义的方式不同，对应的钩子函数也不同，这里判断定义了哪个钩子函数，然后执行它，从而拿到导出的内容。对于 非 NAPI 的模块，就直接执行用户定义的代码，对于 NAPI 模块则执行 napi_module_register_cb。

```c++
static void napi_module_register_cb(v8::Local<v8::Object> exports,  
                                    v8::Local<v8::Value> module,  
                                    v8::Local<v8::Context> context,  
                                    void* priv) {  
  napi_module_register_by_symbol(exports, module, context,  
      static_cast<napi_module*>(priv)->nm_register_func);  
}  
```

该函数调用 napi_module_register_by_symbol 函数，并传入 napi_module 的 nm_register_func 函数，也就是用户定义的代码。

```c++
void napi_module_register_by_symbol(v8::Local<v8::Object> exports,  
                                    v8::Local<v8::Value> module,  
                                    v8::Local<v8::Context> context,  
                                    napi_addon_register_func init) {  
  
  napi_env env = v8impl::NewEnv(context);  
  
  napi_value _exports;  
  env->CallIntoModuleThrow([&](napi_env env) {  
    // 执行用户的代码
    _exports = init(env, v8impl::JsValueFromV8LocalValue(exports));  
  });  
  // 设置 JS 层拿到的内容
  if (_exports != nullptr &&  
      _exports != v8impl::JsValueFromV8LocalValue(exports)) { 
    napi_value _module = v8impl::JsValueFromV8LocalValue(module);  
    napi_set_named_property(env, _module, "exports", _exports);  
  }  
}  
```

init 就是我们 Addon 最后一行定义的函数。入参是 env 和 exports，可以对比我们 Addon 中定义的函数的入参。最后我们修改 exports 变量。即设置导出的内容。最后在 JS 里，我们就拿到了 Addon 定义的内容。

如果 mp 为空，有两种情况

Addon 没有定义初始化函数，只导出里某种格式的函数。

Addon 已经被加载过了，再次加载时初始化函数也不会执行了。比如主线程打开了 Addon，子线程也打开，则子线程中不会再执行初始化函数，也就是说 mp 是空。

Node.js 会先尝试查找动态链接库中符合某种格式的函数，看一下如何查找是否定义某种格式的函数，首先看第一种函数格式。

```c++
inline InitializerCallback GetInitializerCallback(DLib* dlib) {
  const char* name = "node_register_module_v" STRINGIFY(NODE_MODULE_VERSION);
  // 获取函数地址
  return reinterpret_cast<InitializerCallback>(dlib->GetSymbolAddress(name));
}

if (auto callback = GetInitializerCallback(dlib)) {
    callback(exports, module, context);
    return true;
}
```

第一种查找的格式是 node_register_module_v 开头的，接着看第二种函数函数。

```c++
inline napi_addon_register_func GetNapiInitializerCallback(DLib* dlib) {
  const char* name = "napi_register_module_vNAPI_MODULE_VERSION";
  // 获取函数地址
  return reinterpret_cast<napi_addon_register_func>(dlib->GetSymbolAddress(name));
}

if (auto napi_callback = GetNapiInitializerCallback(dlib)) {
    // 执行 napi_callback 获取导出的内容
    napi_module_register_by_symbol(exports, module, context, napi_callback);
    return true;
} 
```

第二种函数格式是 napi_register_module_v 开头的，如果都找不到，则查找缓存看是否已经加载过。

```c++
 // 尝试从之前缓存中获取，比如主线程已经加载了 Addon，子线程也加载 Addon 的场景
 mp = dlib->GetSavedModuleFromGlobalHandleMap();
// 不存在或者不符合规范则报错
if (mp == nullptr || mp->nm_context_register_func == nullptr) {
  dlib->Close();
  char errmsg[1024];
  snprintf(errmsg,
           sizeof(errmsg),
           "Module did not self-register: '%s'.",
           *filename);
  env->ThrowError(errmsg);
  return false;
}
```

如果缓存中存在则继续执行刚才介绍的 mp 非空时的逻辑，如果缓存中不存在或者没有 nm_context_register_func 钩子函数，则直接报错。通过这里的逻辑就可以知道为什么 NODE_MODULE 定义的 Addon 只能被加载一次，比如主线程加载时会执行 Addon 的初始化函数，从而在缓存里保存了数据结构 node_module，然后子线程加载时，不会再执行初始化函数，所以 Node.js 是会从缓存里拿到 node_module 结构体，但是 Node.js 会判断 node_module 是否存在 nm_context_register_func 钩子，而 NODE_MODULE 定义的钩子函数是 nm_register_func，所以就导致了 not self-register 错误。

最后来看一下 Addon 加载的整体流程。

tu 10-1

## 内置 JS 模块

刚才已经分析了加载用户 JS 模块的过程，也讲到了加载用户 JS 时传入的 require 函数是对 Module._load 的封装。当我们在 JS 里通过 require 加载内置 JS 模块时，比如 net 模块，_load 函数就会通过 Module._load 中的 loadNativeModule 函数加载原生 JS 模块。我们看这个函数的定义。

```js
function loadNativeModule(filename, request) {  
  const mod = NativeModule.map.get(filename);  
  if (mod) {  
    mod.compileForPublicLoader();  
    return mod;  
  }  
}  

class NativeModule {  
  // 原生 JS 模块的 map   
  static map = new Map(moduleIds.map((id) => [id, new NativeModule(id)]));  
  
  constructor(id) {  
    this.filename = `${id}.js`;  
    this.id = id;  
    this.canBeRequiredByUsers = !id.startsWith('internal/');  
    this.exports = {};  
    this.loaded = false;  
    this.loading = false;  
    this.module = undefined;  
    this.exportKeys = undefined;  
  }  
} 
```

NativeModule.map 是在 Node.js 启动过程中进行初始化的一个 Map 对象，key 是模块名，值是一个 NativeModule 对象，loadNativeModule 就是根据加载的模块名从 map 中拿到一个 NativeModule 对象，接着看执行 NativeModule 对象的 compileForPublicLoader 函数。

```js
compileForPublicLoader() {  
    this.compileForInternalLoader();  
    return this.exports;  
}  
  
compileForInternalLoader() {  
    if (this.loaded || this.loading) {  
      return this.exports;  
    }  
    // id 就是我们要加载的模块，比如 net 
    const id = this.id;  
    this.loading = true;  
    try {  
      const fn = compileFunction(id);  
      fn(this.exports, 
         // 加载原生 JS 模块的加载器
         nativeModuleRequire, 
         this, 
         process, 
         // 加载 C++ 模块的加载器
         internalBinding, 
         primordials);  
      this.loaded = true;  
    } finally {  
      this.loading = false;  
    }  
    return this.exports;  
  }  
```

首先看一下 compileFunction 这里的逻辑，compileFunction 和刚才讲用户 JS 模块加载时的 compileFunction 不一样，该函数是 node_native_module_env.cc 模块导出的函数。具体的代码就不贴了，通过层层查找，最后到 node_native_module.cc 的NativeModuleLoader::CompileAsModule

```c++
MaybeLocal<Function> NativeModuleLoader::CompileAsModule(  
    Local<Context> context,  
    const char* id,  
    NativeModuleLoader::Result* result) {  
  
  Isolate* isolate = context->GetIsolate();  
  // 函数的形参  
  std::vector<Local<String>> parameters = {  
      FIXED_ONE_BYTE_STRING(isolate, "exports"),  
      FIXED_ONE_BYTE_STRING(isolate, "require"),  
      FIXED_ONE_BYTE_STRING(isolate, "module"),  
      FIXED_ONE_BYTE_STRING(isolate, "process"),  
      FIXED_ONE_BYTE_STRING(isolate, "internalBinding"),  
      FIXED_ONE_BYTE_STRING(isolate, "primordials")};  
  // 编译出一个函数  
  return LookupAndCompile(context, id, &parameters, result);  
}  
```

继续看 LookupAndCompile。

```c++
MaybeLocal<Function> NativeModuleLoader::LookupAndCompile(  
    Local<Context> context,  
    const char* id,  
    std::vector<Local<String>>* parameters,  
    NativeModuleLoader::Result* result) {  
  
  Isolate* isolate = context->GetIsolate();  
  EscapableHandleScope scope(isolate);  
  
  Local<String> source;  
  // 找到原生 JS 模块内容所在的内存地址  
  if (!LoadBuiltinModuleSource(isolate, id).ToLocal(&source)) {  
    return {};  
  }  
  // 'net' + '.js'
  std::string filename_s = id + std::string(".js");  
  Local<String> filename =  OneByteString(isolate, 
                                              filename_s.c_str(), 
                                              filename_s.size());  
  // 省略一些参数处理  
  // 脚本源码  
  ScriptCompiler::Source script_source(source, origin, cached_data);  
  // 编译出一个函数  
  MaybeLocal<Function> maybe_fun =  
      ScriptCompiler::CompileFunctionInContext(context,  
                                               &script_source,  
                                               parameters->size(),
                                               parameters->data(),
                                               0,  
                                               nullptr,  
                                               options);  
  Local<Function> fun = maybe_fun.ToLocalChecked();  
  return scope.Escape(fun);  
}  
```

LookupAndCompile 函数首先找到加载模块的源码，然后编译出一个函数，和用户 JS 模块加载器的原理一样，区别是加载用户 JS 模块的代码时，代码是同步从硬盘读到内存的，但是内置 JS 模块的代码是 Node.js 启动时就存在内存的，看一下LoadBuiltinModuleSource 如何查找模块源码的。

```c++
MaybeLocal<String> NativeModuleLoader::LoadBuiltinModuleSource(Isolate* isolate, const char* id) {  
  const auto source_it = source_.find(id);  
  return source_it->second.ToStringChecked(isolate);  
}  
```

这里的 id 是 net，通过该 id 从 _source 中找到对应的数据，那么 _source 是什么呢？因为Node.js 为了提高加载速度，通过空间换时间，把原生 JS 模块的源码字符串直接转成 ASCII 码存到内存里。这样加载这些模块的时候，就不需要从硬盘读取了，直接从内存读取就行。看一下 _source 的定义（在编译 Node.js 源码或者执行 js2c.py 生成的 node_javascript.cc 中）。

```c++
source_.emplace("net", UnionBytes{net_raw, 46682});  
source_.emplace("cyb", UnionBytes{cyb_raw, 63});  
source_.emplace("os", UnionBytes{os_raw, 7548});  
```

cyb 是我增加的测试模块。我们可以看一下该模块的内容。

```c++
static const uint8_t cyb_raw[] = {  
    99,111,110,115,116, 32, 99,121, 98, 32, 61, 32,105,110,116,101,114,110, 97,108, 66,105,110,100,105,110,103, 40, 39, 99,  
    121, 98, 95,119,114, 97,112, 39, 41, 59, 32, 10,109,111,100,117,108,101, 46,101,120,112,111,114,116,115, 32, 61, 32, 99,  
    121, 98, 59  
};  
```

转成字符串看一下是什么

```js
Buffer.from([
    99,111,110,115,116, 32, 99,121, 98, 32, 61, 32,105,110,116,101,114,110, 97,108, 66,105,110,100,105,110,103, 40, 39, 99,
    121, 98, 95,119,114, 97,112, 39, 41, 59, 32, 10,109,111,100,117,108,101, 46,101,120,112,111,114,116,115, 32, 61, 32, 99,    
    121, 98, 59
].join(',').split(',')).toString('utf-8')  
```

输出：
```
const cyb = internalBinding('cyb_wrap');   
module.exports = cyb;  
```

所以我们执行 require('net') 时，通过 NativeModule 的 compileForInternalLoader，最终会在_source中找到net 模块对应的源码字符串，然后编译成一个函数，最终执行这个函数。

```js
function nativeModuleRequire(id) {
  const mod = NativeModule.map.get(id);
  return mod.compileForInternalLoader();
}

const fn = compileFunction(id);  
fn(this.exports, 
   // 加载原生 JS 模块的加载器
   nativeModuleRequire, 
   this, 
   process, 
   // 加载 C++ 模块的加载器
   internalBinding, 
   primordials);   
```

fn 入参和用户 JS 模块是不一样的，这里的 this 是 NativeModule 对象，exports 是 NativeModule 对象的属性，另外还有一个参数 internalBinding，这个是用于加载 C++ 模块的，我们一会详细分析，最重要的是这里传入的 require 函数和用户 JS 模块的也不一样。由 fn 的入参可以知道，我们在 net（或其它原生 JS 模块中）只能加载原生 JS 模块和内置的C++ 模块。当 fn 执行完毕后，原生模块加载器就会把 mod.exports 的值返回给调用方。整体流程如下图所示。

tu 10-2

## 内置 C++ 模块

除了通过 require 加载以上的三种模块外，还有一种模块就是 C++ 模块，C++ 模块通常是在内置 JS 模块里加载的，我们也可以通过 process.binding 进行加载。在原生 JS 模块中加载内置的 C++ 模块，这是 Node.js 拓展 JS 功能的关键之处。比如我们 require("net") 的时候，net 模块会加载 C++ 模块 tcp_wrap。

```js
const {  
  TCP,  
  TCPConnectWrap,  
  constants: TCPConstants  
} = internalBinding('tcp_wrap')  
```

Node.js 在初始化的时候会注册 C++ 模块，并且形成一个 C++ 模块链表，当加载 C++ 模块时，Node.js 就通过模块名，从这个链表里面找到对应的节点，然后去执行它里面的钩子函数，执行完之后就可以拿到 C++ 模块导出的内容。

tu 10-3

C++ 模块加载器是在 internal/bootstrap/loaders.js 中定义的，分为三种。

process._linkedBinding: 暴露给用户访问 C++ 模块的接口，用于访问用户自己添加的但是没有加到内置模块的 C++ 模块（flag为NM_F_LINKED）。

```js
const bindingObj= ObjectCreate(null);  
process._linkedBinding = function _linkedBinding(module) {  
  module = String(module);  
  let mod = bindingObj[module];  
  if (typeof mod !== 'object')  
    mod = bindingObj[module] = getLinkedBinding(module);  
  return mod;  
};  
```

_linkedBinding 是在 getLinkedBinding 函数基础上加了缓存功能，getLinkedBinding 是 C++ 层定义的函数。它从另一个 C++ 模块链表中查找对应的模块，这个通常不会用到，就不详细介绍。

internalBinding：不暴露给用户的访问的接口，只能在 Node.js 代码中访问，比如原生 JS 模块。

```js
let internalBinding;  
{  
  const bindingObj = ObjectCreate(null);   
  internalBinding = function internalBinding(module) {  
    let mod = bindingObj[module];  
    if (typeof mod !== 'object') {  
      mod = bindingObj[module] = getInternalBinding(module);  
      moduleLoadList.push(`Internal Binding ${module}`);  
    }  
    return mod;  
  };  
}  
```

internalBinding 是在 getInternalBinding 函数基础上加了缓存功能。getInternalBinding 是 C++ 层定义的函数，它的作用是从 C++ 模块链表中找到对应的模块。 3. process.binding：暴露给用户调用 C++ 模块的接口，但是只能访问部分 C++ 模块。

```js
process.binding = function binding(module) {  
  module = String(module);  
  if (internalBindingWhitelist.has(module)) {  
    return internalBinding(module);  
  }  
  throw new Error(`No such module: ${module}`);  
};  
```

binding 是在 internalBinding 的基础上加了白名单的逻辑，只对外暴露部分模块，因为 internalBinding 是对 getInternalBinding 的封装。所以直接看 getInternalBinding， 对应的是 binding::GetInternalBinding（node_binding.cc）。

```c++
// 根据模块名查找对应的模块  
void GetInternalBinding(const FunctionCallbackInfo<Value>& args) {  
  Environment* env = Environment::GetCurrent(args);  
  // 模块名  
  Local<String> module = args[0].As<String>();  
  node::Utf8Value module_v(env->isolate(), module);  
  Local<Object> exports;  
  // 从 C++ 内部模块找  
  node_module* mod = FindModule(modlist_internal, 
                                     *module_v, 
                                     NM_F_INTERNAL);  
  exports = InitModule(env, mod, module); 
  // 返回 C++ 层导出的功能
  args.GetReturnValue().Set(exports);  
}  
```

modlist_internal 是一条链表，在 Node.js 启动过程的时候，由各个 C++ 模块连成的链表，FindModule 就是从这个链表中找到对应的数据结构。

```c++
inline struct node_module* FindModule(struct node_module* list,
                                      const char* name,
                                      int flag) {
  struct node_module* mp;

  for (mp = list; mp != nullptr; mp = mp->nm_link) {
    if (strcmp(mp->nm_modname, name) == 0) break;
  }
  return mp;
}
```

通过模块名找到对应的 C++ 模块后，执行 InitModule 初始化模块。

```c++
    // 初始化一个模块，即执行它里面的注册函数  
    static Local<Object> InitModule(Environment* env,  
                                    node_module* mod,  
                                    Local<String> module) { 
          // 新建一个对象，需要导出到 JS 的内容设置到该对象中 
      Local<Object> exports = Object::New(env->isolate());  
      Local<Value> unused = Undefined(env->isolate());  
      mod->nm_context_register_func(exports, unused, env->context(), mod->nm_priv);  
      return exports;  
    }  
```

传入一个 exports 变量进去，然后执行 C++ 模块的 nm_context_register_func 指向的函数。这个函数就是在 C++ 模块最后一行定义的 Initialize 函数。Initialize 会通过修改 exports 设置导出的对象，比如 TCP 模块的 Initialize。

```c++
void TCPWrap::Initialize(Local<Object> target,
                         Local<Value> unused,
                         Local<Context> context,
                         void* priv) {
  target->Set(env->context(), tcpString, ...).Check();
  // 设置对象的TCPConnectWrap属性 
  target->Set(env->context(), wrapString, ...).Check();

  // 设置对象的constant属性 
  Local<Object> constants = Object::New(env->isolate());
  NODE_DEFINE_CONSTANT(constants, SOCKET);
  NODE_DEFINE_CONSTANT(constants, SERVER);
  NODE_DEFINE_CONSTANT(constants, UV_TCP_IPV6ONLY);
  target->Set(context, env->constants_string(), constants).Check();
}
```
target 里设置的值就是 JS 层能拿到的值，最后我们就可以从 JS 访问到 Initialize 导出的内容了。

## 自定义模块加载器
了解了 Node.js 的各种模块加载器原理后，我们最后实现两个自己的模块加载器，这样不仅可以处理其他类型的模块，还能深入理解模块加载的实现原理。通过前面的介绍可以知道，我们通过拓展 Module._extensions 来支持我们自己的模块类型。首先看一下如何实现一个 TS 模块加载器。

```js
const { Module } = require('module');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { compileFunction } = process.binding('contextify');

// 加入处理 TS 的函数
Module._extensions['.ts'] = function(module, filename) {
    // 获取模块内容
    const content = fs.readFileSync(filename, 'utf8');
    // 先把 TS 转成 JS
    const { outputText } = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.CommonJS }});
    // 编译代码拿到一个函数
    const result = compileFunction(
        outputText,
        filename,
        0,
        0,
        undefined,
        false,
        undefined,
        [],
        [
          'exports',
          'require',
          'module',
          '__filename',
          '__dirname',
        ]
    );
    // 执行
    result.function.call(this, module.exports, (...args) => module.require(...args), module, filename, path.dirname(filename));
};
```
我们只需要保证上面的代码在我们的 TS 代码之前执行，这样就可以直接执行 TS 代码了。TS 模块加载器的原理是拓展 _extensions 的类型，使得它遇到 .ts 类型的文件时执行我们设置的函数，然后读取到文件内容后，利用 typescript 把 TS 转成 JS，最后执行 JS 代码，有兴趣可以参考[这里](https://github.com/theanarkh/tiny-ts-node)。

我们不仅可以通过 Module._extensions 拓展自定义的模块类型，我们甚至可以通过 Addon 来实现一个自己的 JS 模块加载器，代码可以参考[这里](https://github.com/theanarkh/nodejs-book/tree/main/src/loader)。

```c++
static void Compile(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    String::Utf8Value filename(isolate, args[0].As<String>());
    int fd = open(*filename, 0 , O_RDONLY);
    std::string content;
    char buffer[4096];
    while (1)
    {
      memset(buffer, 0, 4096);
      int ret = read(fd, buffer, 4096);
      if (ret == -1) {
        return args.GetReturnValue().Set(newStringToLcal(isolate, "read file error"));
      }
      if (ret == 0) {
        break;
      }
      content.append(buffer, ret);
    }
    close(fd);
    ScriptCompiler::Source script_source(newStringToLcal(isolate, content.c_str()));
    Local<String> params[] = {
      newStringToLcal(isolate, "require"),
      newStringToLcal(isolate, "exports"),
      newStringToLcal(isolate, "module"),
    };
    MaybeLocal<Function> fun =
    ScriptCompiler::CompileFunctionInContext(context, &script_source, 3, params, 0, nullptr);
    if (fun.IsEmpty()) {
      args.GetReturnValue().Set(Undefined(isolate));
    } else {
      args.GetReturnValue().Set(fun.ToLocalChecked());
    }
}
```

Compile 函数首先从参数中拿到文件路径，然后把文件的内容读到内存中，最后通过 CompileFunctionInContext 编译成一个 JS 函数，所以执行完 Compile 后我们就可以拿到一个函数。下面看看怎么使用。

```js
const path = require('path');
const loader = require('./build/Release/main.node');
const filepath = path.resolve(__dirname, 'demo.js');
loader.compile(filepath)(require, module.exports, module);
```

使用方式也很简单，传入实参然后执行 compile 返回的函数，至于传入哪些参数这个是可以自己根据情况自定义。

总结
通过本节课的内容可以知道，Node.js 中一共有 JSON、用户 JS、原生 JS、C++、Addon 五种模块，虽然我们平时只需要一个 require 就可以了，但是 Node.js 中处理细节还是非常多的，尤其是 Addon 模块。在 Node.js 中，json 模块加载器是通过文件模块和 V8 的 JSON.Parse 实现的，JS 模块是通过 V8 的 CompileFunctionInContext 实现的，C++ 模块是通过 V8 把 C++ 的功能导出到 JS 层实现的，Addon 本质上是加载和使用动态链接库。

理解了这些模块加载器原理，不仅可以帮助我们更了解 Node.js 的内部机制，我们也可以自己实现新的模块加载器，比如课程中的 JS 和 TS 模块加载器，另外在使用 Addon 模块时碰到问题我们也能引刃而解。