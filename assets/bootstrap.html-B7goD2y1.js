import{_ as s,c as a,f as e,o as i}from"./app-LHpjaFTr.js";const l={};function t(p,n){return i(),a("div",null,n[0]||(n[0]=[e(`<h1 id="node-js的启动过程" tabindex="-1"><a class="header-anchor" href="#node-js的启动过程"><span>Node.js的启动过程</span></a></h1><p>图9-1</p><p>整体的逻辑：</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">int main(int argc, char* argv[]) {</span>
<span class="line">  setvbuf(stdout, nullptr, _IONBF, 0);</span>
<span class="line">  setvbuf(stderr, nullptr, _IONBF, 0);</span>
<span class="line">  return node::Start(argc, argv);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>main 函数的开头通过 setvbuf 设置了不缓冲标准输出流和标准错误流的数据，而是直接输出，因为当我们调用 C API 输出数据时，最终需要调用操作系统的 API 进行处理，C 库的 API 为了减少对系统调用的次数，会先对数据进行缓存，等到合适的时机再调用系统调用，比如遇到换行时。类似 TCP 协议通常是积累一定数据才会组包发送一样。setvbuf 和 _IONBF 用于禁止缓冲行为，实时输出。接着看 Start。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">int Start(int argc, char** argv) {</span>
<span class="line">  // 注册 C++ 模块、解析命令行参数、初始化 V8</span>
<span class="line">  InitializationResult result = InitializeOncePerProcess(argc, argv);</span>
<span class="line"></span>
<span class="line">  NodeMainInstance main_instance(&amp;params,</span>
<span class="line">                                 uv_default_loop(),</span>
<span class="line">                                 per_process::v8_platform.Platform(),</span>
<span class="line">                                 result.args,</span>
<span class="line">                                 result.exec_args,</span>
<span class="line">                                 indexes);</span>
<span class="line">  main_instance.Run();</span>
<span class="line"></span>
<span class="line">  return result.exit_code;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Start 里主要两个逻辑，首先看 InitializeOncePerProcess。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">InitializationResult InitializeOncePerProcess(int argc, char** argv) {</span>
<span class="line">  // 注册 C++ 模块</span>
<span class="line">  binding::RegisterBuiltinModules();</span>
<span class="line">  // 解析命令行参数</span>
<span class="line">  ProcessGlobalArgs();</span>
<span class="line">  // 初始化 V8 Platform</span>
<span class="line">  per_process::v8_platform.Initialize(per_process::cli_options-&gt;v8_thread_pool_size);</span>
<span class="line">  // 初始化 V8</span>
<span class="line">  V8::Initialize();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>InitializeOncePerProcess 初始化后，接着创建一个 NodeMainInstance 实例并执行它的 Run 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">NodeMainInstance::NodeMainInstance(</span>
<span class="line">    Isolate::CreateParams* params, // 创建 isolate 的参数</span>
<span class="line">    uv_loop_t* event_loop, // 事件循环</span>
<span class="line">    MultiIsolatePlatform* platform, // V8 Platform</span>
<span class="line">    const std::vector&lt;std::string&gt;&amp; args, // 启动参数</span>
<span class="line">    const std::vector&lt;std::string&gt;&amp; exec_args,</span>
<span class="line">    const std::vector&lt;size_t&gt;* per_isolate_data_indexes)</span>
<span class="line">    : args_(args),</span>
<span class="line">      exec_args_(exec_args),</span>
<span class="line">      // ArrayBuffer（Buffer） 的内存分配器</span>
<span class="line">      array_buffer_allocator_(ArrayBufferAllocator::Create()),</span>
<span class="line">      isolate_(nullptr),</span>
<span class="line">      platform_(platform),</span>
<span class="line">      isolate_data_(nullptr),</span>
<span class="line">      owns_isolate_(true) {</span>
<span class="line">      </span>
<span class="line">  params-&gt;array_buffer_allocator = array_buffer_allocator_.get();</span>
<span class="line">  // 创建 isolate</span>
<span class="line">  isolate_ = Isolate::Allocate();</span>
<span class="line">  platform-&gt;RegisterIsolate(isolate_, event_loop);</span>
<span class="line">  // 初始化 isolate</span>
<span class="line">  Isolate::Initialize(isolate_, *params);</span>
<span class="line">  // 把公共的数据封装到一起</span>
<span class="line">  isolate_data_ = std::make_unique&lt;IsolateData&gt;(isolate_,</span>
<span class="line">                                                event_loop,</span>
<span class="line">                                                platform,</span>
<span class="line">                                                array_buffer_allocator_.get(),</span>
<span class="line">                                                per_isolate_data_indexes);</span>
<span class="line">  // ...</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">int NodeMainInstance::Run() {</span>
<span class="line">  int exit_code = 0;</span>
<span class="line">  // 创建 Environment 对象</span>
<span class="line">  DeleteFnPtr&lt;Environment, FreeEnvironment&gt; env = CreateMainEnvironment(&amp;exit_code);</span>
<span class="line">  // 加载 Environment</span>
<span class="line">  LoadEnvironment(env.get());</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NodeMainInstance 构造函数主要做了一些初始化工作，接着 调用 Run，Run 调用了 CreateMainEnvironment 创建了 一个 Environment 对象。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">NodeMainInstance::CreateMainEnvironment(int* exit_code) {</span>
<span class="line">  // 创建 V8 Context</span>
<span class="line">  Local&lt;Context&gt; context = NewContext(isolate_);</span>
<span class="line">  // 新建一个 Environment 对象，并记录到 context 中</span>
<span class="line">  std::unique_ptr&lt;Environment&gt; env = std::make_unique&lt;Environment&gt;(</span>
<span class="line">      isolate_data_.get(),</span>
<span class="line">      context,</span>
<span class="line">      ...);</span>
<span class="line">  // 初始化 Libuv 相关的结构体                                   </span>
<span class="line">  env-&gt;InitializeLibuv(per_process::v8_is_profiling);</span>
<span class="line">  // 初始化诊断相关的能力</span>
<span class="line">  env-&gt;InitializeDiagnostics();</span>
<span class="line">  // 初始化 Inspector 相关</span>
<span class="line">  env-&gt;InitializeInspector({});</span>
<span class="line">  // 初始化模块加载器(BootstrapInternalLoaders())和执行内部 JS 代码(BootstrapNode())</span>
<span class="line">  env-&gt;RunBootstrapping();</span>
<span class="line">  return env;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>创建完 Environment 后，继续执行 LoadEnvironment。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void LoadEnvironment(Environment* env) {</span>
<span class="line">  StartMainThreadExecution(env);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">MaybeLocal&lt;Value&gt; StartMainThreadExecution(Environment* env) {</span>
<span class="line">  // 忽略执行其他 JS 代码的逻辑</span>
<span class="line">  // run_main_module 中执行用户 JS 代码</span>
<span class="line">  if (!first_argv.empty() &amp;&amp; first_argv != &quot;-&quot;) {</span>
<span class="line">    return StartExecution(env, &quot;internal/main/run_main_module&quot;);</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>StartMainThreadExecution 中执行了用户的 JS 代码，执行用户 JS 通常会生产一些任务到 Libuv 中，最后开启事件循环。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 开启事件循环</span>
<span class="line">do {</span>
<span class="line">  uv_run(env-&gt;event_loop(), UV_RUN_DEFAULT);</span>
<span class="line">  more = uv_loop_alive(env-&gt;event_loop());</span>
<span class="line">} while (more == true &amp;&amp; !env-&gt;is_stopping());</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>了解了 Node.js 启动的大致流程后，我们按照 Node.js 初始化过程中的代码先后顺序对各个核心部分进行讲解。</p><h2 id="注册-c-模块" tabindex="-1"><a class="header-anchor" href="#注册-c-模块"><span>注册 C++ 模块</span></a></h2><p>RegisterBuiltinModules 函数的作用是注册 C++ 模块，C++ 模块用于给 JS 层提供各种底层的功能，是 Node.js 中非常核心的部分。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void RegisterBuiltinModules() {  </span>
<span class="line">#define V(modname) _register_##modname();  </span>
<span class="line">  NODE_BUILTIN_MODULES(V)  </span>
<span class="line">#undef V  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NODE_BUILTIN_MODULES 是一个 C 语言宏，宏展开后如下（省略类似逻辑）</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void RegisterBuiltinModules() {  </span>
<span class="line">#define V(modname) _register_##modname();  </span>
<span class="line">  V(tcp_wrap)   </span>
<span class="line">  V(fs)  </span>
<span class="line">  // ...其它模块  </span>
<span class="line">#undef V  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再一步展开如下</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void RegisterBuiltinModules() {  </span>
<span class="line">  _register_tcp_wrap();  </span>
<span class="line">  _register_fs();  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行了一系列 _register 开头的函数，但是我们在 Node.js 源码里找不到这些函数，因为这些函数是在每个 C++ 模块定义的文件里（src/*.cc文件的最后一行）通过宏定义的。以 tcp_wrap 模块为例，看看它是怎么做的。文件 tcp_wrap.cc 的最后一句代码</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">NODE_MODULE_CONTEXT_AWARE_INTERNAL(tcp_wrap, node::TCPWrap::Initialize) </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>继续展开</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">#define NODE_MODULE_CONTEXT_AWARE_CPP(modname, regfunc, priv, flags\\  </span>
<span class="line">  static node::node_module _module = {              \\  </span>
<span class="line">      NODE_MODULE_VERSION,                        \\  </span>
<span class="line">      flags,                        \\  </span>
<span class="line">      nullptr,                        \\  </span>
<span class="line">      __FILE__,                        \\  </span>
<span class="line">      nullptr,                        \\  </span>
<span class="line">      (node::addon_context_register_func)(regfunc),  \\  </span>
<span class="line">      NODE_STRINGIFY(modname),                        \\  </span>
<span class="line">      priv,                        \\  </span>
<span class="line">      nullptr};                        \\  </span>
<span class="line">  void _register_tcp_wrap() { node_module_register(&amp;_module); }  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先定义了一个 node_module 结构体。node_module 是 Node.js 中表示 C++ 模块的数据结构，包括 一般的 C++ 模块和NAPI 模块等。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">struct node_module {  </span>
<span class="line">  // 版本、标记的元信息</span>
<span class="line">  int nm_version;  </span>
<span class="line">  unsigned int nm_flags;  </span>
<span class="line">  void* nm_dso_handle;  </span>
<span class="line">  const char* nm_filename;  </span>
<span class="line">  // 注册模块的钩子函数</span>
<span class="line">  node::addon_register_func nm_register_func;  </span>
<span class="line">  node::addon_context_register_func nm_context_register_func; </span>
<span class="line">  // 模块名 </span>
<span class="line">  const char* nm_modname;  </span>
<span class="line">  void* nm_priv;  </span>
<span class="line">  // 用于指向下一个节点</span>
<span class="line">  struct node_module* nm_link;  </span>
<span class="line">};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>定义 node_module 之后，接着定义了一个 _register 开头的函数，这里是 _register_tcp_wrap，这些函数就会在 Node.js 启动时，逐个被执行一遍，接着看这些函数都做了什么事情， _register_tcp_wrap 函数里调了 node_module_register ，并传入一个 node_module 数据结构，所以我们看一下 node_module_register 的实现</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void node_module_register(void* m) {  </span>
<span class="line">  struct node_module* mp = reinterpret_cast&lt;struct node_module*&gt;(m);  </span>
<span class="line">  if (mp-&gt;nm_flags &amp; NM_F_INTERNAL) {  </span>
<span class="line">    mp-&gt;nm_link = modlist_internal;  </span>
<span class="line">    modlist_internal = mp;  </span>
<span class="line">  } else if (!node_is_initialized) { </span>
<span class="line">    mp-&gt;nm_flags = NM_F_LINKED;  </span>
<span class="line">    mp-&gt;nm_link = modlist_linked;  </span>
<span class="line">    modlist_linked = mp;  </span>
<span class="line">  } else {  </span>
<span class="line">    thread_local_modpending = mp;  </span>
<span class="line">  }  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>C++ 内置模块的 flag 是 NM_F_INTERNAL，所以会执行第一个 if 的逻辑，modlist_internal 类似一个头指针。if 里的逻辑就是头插法建立一个单链表。所以注册 C++ 模块就是把各个模块连成一个链表，在后面模块加载的课程中会看到这个链表的使用。</p><h2 id="v8-platform-初始化" tabindex="-1"><a class="header-anchor" href="#v8-platform-初始化"><span>V8 Platform 初始化</span></a></h2><p>注册完 C++ 模块后，接着会初始化 V8 Platform，V8 Platform 用于创建一些 worker 线程以及 trace agent。worker 线程可以用于协助处理一些任务，比如 GC 任务，trace agent 则是处理 trace event 数据的。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  // 我们可以通过命令后参数指定 thread_pool_size 大小，从而指定线程池大小</span>
<span class="line">  inline void Initialize(int thread_pool_size) {</span>
<span class="line">    // 创建并记录 trace agent</span>
<span class="line">    tracing_agent_ = std::make_unique&lt;tracing::Agent&gt;();</span>
<span class="line">    node::tracing::TraceEventHelper::SetAgent(tracing_agent_.get());</span>
<span class="line">    // 如果命令行设置了 trace event category 则开启 trace agent</span>
<span class="line">    if (!per_process::cli_options-&gt;trace_event_categories.empty()) {</span>
<span class="line">      StartTracingAgent();</span>
<span class="line">    }</span>
<span class="line">    // 创建 Platform 对象</span>
<span class="line">    platform_ = new NodePlatform(thread_pool_size, controller);</span>
<span class="line">    // 保存到 V8，V8 会使用该 Platform</span>
<span class="line">    v8::V8::InitializePlatform(platform_);</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>trace events 用于收集 Node.js / V8 内核的一些数据，这里我们不关注，接下来看一下 NodePlatform 的构造函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">NodePlatform::NodePlatform(int thread_pool_size,</span>
<span class="line">                           TracingController* tracing_controller) {</span>
<span class="line">   worker_thread_task_runner_ = std::make_shared&lt;WorkerThreadsTaskRunner&gt;(thread_pool_size);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NodePlatform 中创建了 WorkerThreadsTaskRunner 对象。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">WorkerThreadsTaskRunner::WorkerThreadsTaskRunner(int thread_pool_size) {</span>
<span class="line">  Mutex platform_workers_mutex;</span>
<span class="line">  ConditionVariable platform_workers_ready;</span>
<span class="line"></span>
<span class="line">  Mutex::ScopedLock lock(platform_workers_mutex);</span>
<span class="line">  int pending_platform_workers = thread_pool_size;</span>
<span class="line">  // 延迟任务处理线程，即该任务会在一定时间后被执行，pending_worker_tasks_ 为任务队列</span>
<span class="line">  delayed_task_scheduler_ = std::make_unique&lt;DelayedTaskScheduler&gt;(&amp;pending_worker_tasks_);</span>
<span class="line">  threads_.push_back(delayed_task_scheduler_-&gt;Start());</span>
<span class="line">  // 创建线程池</span>
<span class="line">  for (int i = 0; i &lt; thread_pool_size; i++) {</span>
<span class="line">    // pending_worker_tasks_ 为线程池的任务任务</span>
<span class="line">    PlatformWorkerData* worker_data = new PlatformWorkerData{</span>
<span class="line">      &amp;pending_worker_tasks_, ...</span>
<span class="line">    };</span>
<span class="line">    std::unique_ptr&lt;uv_thread_t&gt; t { new uv_thread_t() };</span>
<span class="line">    // 创建子线程</span>
<span class="line">    if (uv_thread_create(t.get(), PlatformWorkerThread,</span>
<span class="line">                         worker_data) != 0) {</span>
<span class="line">      break;</span>
<span class="line">    }</span>
<span class="line">    threads_.push_back(std::move(t));</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  // 等待子线程启动成功</span>
<span class="line">  while (pending_platform_workers &gt; 0) {</span>
<span class="line">    platform_workers_ready.Wait(lock);</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>WorkerThreadsTaskRunner 中创建了很多子线程，我们分开分析。首先看看 DelayedTaskScheduler 线程，DelayedTaskScheduler 用于管理延时任务，也就是说当一个任务插入 DelayedTaskScheduler 时，他不是被立即执行的，而是会延迟一段时间。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class WorkerThreadsTaskRunner::DelayedTaskScheduler {</span>
<span class="line"> public:</span>
<span class="line">  explicit DelayedTaskScheduler(TaskQueue&lt;Task&gt;* tasks)</span>
<span class="line">  // 保存任务队列，延迟任务超时后把任务插入该任务队列</span>
<span class="line">    : pending_worker_tasks_(tasks) {}</span>
<span class="line">  // 启动线程</span>
<span class="line">  std::unique_ptr&lt;uv_thread_t&gt; Start() {</span>
<span class="line">    auto start_thread = [](void* data) {</span>
<span class="line">      static_cast&lt;DelayedTaskScheduler*&gt;(data)-&gt;Run();</span>
<span class="line">    };</span>
<span class="line">    // 创建线程</span>
<span class="line">    std::unique_ptr&lt;uv_thread_t&gt; t { new uv_thread_t() };</span>
<span class="line">    uv_sem_init(&amp;ready_, 0);</span>
<span class="line">    CHECK_EQ(0, uv_thread_create(t.get(), start_thread, this));</span>
<span class="line">    uv_sem_wait(&amp;ready_);</span>
<span class="line">    uv_sem_destroy(&amp;ready_);</span>
<span class="line">    return t;</span>
<span class="line">  }</span>
<span class="line">  // 提交延迟任务</span>
<span class="line">  void PostDelayedTask(std::unique_ptr&lt;Task&gt; task, double delay_in_seconds) {</span>
<span class="line">    tasks_.Push(std::make_unique&lt;ScheduleTask&gt;(this, std::move(task),</span>
<span class="line">                                               delay_in_seconds));</span>
<span class="line">    uv_async_send(&amp;flush_tasks_);</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line"> private:</span>
<span class="line">  // 子线程里执行的函数</span>
<span class="line">  void Run() {</span>
<span class="line">    loop_.data = this;</span>
<span class="line">    // 初始化数据结构</span>
<span class="line">    CHECK_EQ(0, uv_loop_init(&amp;loop_));</span>
<span class="line">    flush_tasks_.data = this;</span>
<span class="line">    // 初始化 async handle，用于其他线程插入任务时唤醒子线程</span>
<span class="line">    CHECK_EQ(0, uv_async_init(&amp;loop_, &amp;flush_tasks_, FlushTasks));</span>
<span class="line">    uv_sem_post(&amp;ready_);</span>
<span class="line">    // 执行单独的事件循环</span>
<span class="line">    uv_run(&amp;loop_, UV_RUN_DEFAULT);</span>
<span class="line">    CheckedUvLoopClose(&amp;loop_);</span>
<span class="line">  }</span>
<span class="line">  // 子线程处理任务函数，逐个执行任务</span>
<span class="line">  static void FlushTasks(uv_async_t* flush_tasks) {</span>
<span class="line">    DelayedTaskScheduler* scheduler =</span>
<span class="line">        ContainerOf(&amp;DelayedTaskScheduler::loop_, flush_tasks-&gt;loop);</span>
<span class="line">    while (std::unique_ptr&lt;Task&gt; task = scheduler-&gt;tasks_.Pop())</span>
<span class="line">      task-&gt;Run();</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>主线程执行 Start 开启子线程，然后子线程执行 Run 进行初始化，接着就进入事件循环，其他线程可以通过 PostDelayedTask 提交一个 ScheduleTask 任务，PostDelayedTask 会唤醒 DelayedTaskScheduler 子线程处理任务，来看一下执行 ScheduleTask 任务时的逻辑。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class ScheduleTask : public Task {</span>
<span class="line">   public:</span>
<span class="line">    ScheduleTask(DelayedTaskScheduler* scheduler,</span>
<span class="line">                 std::unique_ptr&lt;Task&gt; task,</span>
<span class="line">                 double delay_in_seconds)</span>
<span class="line">      : scheduler_(scheduler),</span>
<span class="line">        task_(std::move(task)),</span>
<span class="line">        delay_in_seconds_(delay_in_seconds) {}</span>
<span class="line"></span>
<span class="line">    void Run() override {</span>
<span class="line">      uint64_t delay_millis = llround(delay_in_seconds_ * 1000);</span>
<span class="line">      std::unique_ptr&lt;uv_timer_t&gt; timer(new uv_timer_t());</span>
<span class="line">      CHECK_EQ(0, uv_timer_init(&amp;scheduler_-&gt;loop_, timer.get()));</span>
<span class="line">      timer-&gt;data = task_.release();</span>
<span class="line">      // 启动一个定时器，超时后执行 RunTask</span>
<span class="line">      CHECK_EQ(0, uv_timer_start(timer.get(), RunTask, delay_millis, 0));</span>
<span class="line">      scheduler_-&gt;timers_.insert(timer.release());</span>
<span class="line">    }</span>
<span class="line"></span>
<span class="line">   private:</span>
<span class="line">    DelayedTaskScheduler* scheduler_;</span>
<span class="line">    std::unique_ptr&lt;Task&gt; task_;</span>
<span class="line">    double delay_in_seconds_;</span>
<span class="line">  };</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到执行 ScheduleTask 任务时会先往 DelayedTaskScheduler 子线程的事件循环中插入一个定时器，等到定时器超时时执行 RunTask。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  static void RunTask(uv_timer_t* timer) {</span>
<span class="line">    DelayedTaskScheduler* scheduler =</span>
<span class="line">        ContainerOf(&amp;DelayedTaskScheduler::loop_, timer-&gt;loop);</span>
<span class="line">    scheduler-&gt;pending_worker_tasks_-&gt;Push(scheduler-&gt;TakeTimerTask(timer));</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RunTask 会把任务插入真正的任务队列。这个队列由 Platform 的线程池处理。下面看看 Platform 的线程池，工作函数是 PlatformWorkerThread。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">static void PlatformWorkerThread(void* data) {</span>
<span class="line">  std::unique_ptr&lt;PlatformWorkerData&gt;</span>
<span class="line">      worker_data(static_cast&lt;PlatformWorkerData*&gt;(data));</span>
<span class="line"></span>
<span class="line">  TaskQueue&lt;Task&gt;* pending_worker_tasks = worker_data-&gt;task_queue;</span>
<span class="line">  // 通知主线程，子线程启动成功 </span>
<span class="line">  {</span>
<span class="line">    Mutex::ScopedLock lock(*worker_data-&gt;platform_workers_mutex);</span>
<span class="line">    (*worker_data-&gt;pending_platform_workers)--;</span>
<span class="line">    worker_data-&gt;platform_workers_ready-&gt;Signal(lock);</span>
<span class="line">  }</span>
<span class="line">  // 不断处理任务队列里的任务</span>
<span class="line">  while (std::unique_ptr&lt;Task&gt; task = pending_worker_tasks-&gt;BlockingPop()) {</span>
<span class="line">    task-&gt;Run();</span>
<span class="line">    pending_worker_tasks-&gt;NotifyOfCompletion();</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>子线程的逻辑很简单，就是遍历任务队列然后执行每个任务。接着看两个产生任务的函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 直接提交到线程池的任务队列</span>
<span class="line">void NodePlatform::CallOnWorkerThread(std::unique_ptr&lt;Task&gt; task) {</span>
<span class="line">  worker_thread_task_runner_-&gt;PostTask(std::move(task));</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">// 提交到延迟任务处理线程，超时后再提交到线程池的任务队列</span>
<span class="line">void NodePlatform::CallDelayedOnWorkerThread(std::unique_ptr&lt;Task&gt; task,</span>
<span class="line">                                             double delay_in_seconds) {</span>
<span class="line">  worker_thread_task_runner_-&gt;PostDelayedTask(std::move(task),</span>
<span class="line">                                              delay_in_seconds);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void WorkerThreadsTaskRunner::PostTask(std::unique_ptr&lt;Task&gt; task) {</span>
<span class="line">  pending_worker_tasks_.Push(std::move(task));</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void WorkerThreadsTaskRunner::PostDelayedTask(std::unique_ptr&lt;Task&gt; task,</span>
<span class="line">                                              double delay_in_seconds) {</span>
<span class="line">  delayed_task_scheduler_-&gt;PostDelayedTask(std::move(task), delay_in_seconds);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>V8 GC 时会执行上面的函数提交任务，比如回收 ArrayBuffer 内存时。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void ArrayBufferSweeper::RequestSweep(SweepingType type) {</span>
<span class="line">   V8::GetCurrentPlatform()-&gt;CallOnWorkerThread(std::move(task));</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>又或者新生代 GC 时。</p><p>tu 9-2</p><p>Node.js 中，除了借助子线程处理任务外，还会借助主线程处理任务。具体在 Node.js 初始化时执行的 platform-&gt;RegisterIsolate(isolate_, event_loop)。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void NodePlatform::RegisterIsolate(Isolate* isolate, uv_loop_t* loop) {</span>
<span class="line">  Mutex::ScopedLock lock(per_isolate_mutex_);</span>
<span class="line">  auto delegate = std::make_shared&lt;PerIsolatePlatformData&gt;(isolate, loop);</span>
<span class="line">  IsolatePlatformDelegate* ptr = delegate.get();</span>
<span class="line">  auto insertion = per_isolate_.emplace(</span>
<span class="line">    isolate,</span>
<span class="line">    std::make_pair(ptr, std::move(delegate)));</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RegisterIsolate 用于在 Platform 的 map 数据结构插入一个键对值。这里的核心数据结构是 PerIsolatePlatformData。PerIsolatePlatformData 负责管理由主线程处理的任务。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">PerIsolatePlatformData::PerIsolatePlatformData(</span>
<span class="line">    Isolate* isolate, uv_loop_t* loop)</span>
<span class="line">  : isolate_(isolate), loop_(loop) {</span>
<span class="line">  flush_tasks_ = new uv_async_t();</span>
<span class="line">  CHECK_EQ(0, uv_async_init(loop, flush_tasks_, FlushTasks));</span>
<span class="line">  flush_tasks_-&gt;data = static_cast&lt;void*&gt;(this);</span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(flush_tasks_));</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>PerIsolatePlatformData 中初始化了一个 async handle，用于其他子线程提交任务时通知主线程处理。接着看一下如何提交任务。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">platform-&gt;GetForegroundTaskRunner(isolate)-&gt;PostTask(std::move(task));</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>GetForegroundTaskRunner 代码如下</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">std::shared_ptr&lt;v8::TaskRunner&gt; NodePlatform::GetForegroundTaskRunner(Isolate* isolate) {</span>
<span class="line">  return ForIsolate(isolate)-&gt;GetForegroundTaskRunner();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">std::shared_ptr&lt;v8::TaskRunner&gt; PerIsolatePlatformData::GetForegroundTaskRunner() {</span>
<span class="line">  return shared_from_this();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看 PerIsolatePlatformData 的 PostTask 和 PostDelayedTask。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void PerIsolatePlatformData::PostTask(std::unique_ptr&lt;Task&gt; task) {</span>
<span class="line">  foreground_tasks_.Push(std::move(task));</span>
<span class="line">  uv_async_send(flush_tasks_);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void PerIsolatePlatformData::PostDelayedTask(</span>
<span class="line">    std::unique_ptr&lt;Task&gt; task, double delay_in_seconds) {</span>
<span class="line">  std::unique_ptr&lt;DelayedTask&gt; delayed(new DelayedTask());</span>
<span class="line">  delayed-&gt;task = std::move(task);</span>
<span class="line">  delayed-&gt;platform_data = shared_from_this();</span>
<span class="line">  delayed-&gt;timeout = delay_in_seconds;</span>
<span class="line">  foreground_delayed_tasks_.Push(std::move(delayed));</span>
<span class="line">  uv_async_send(flush_tasks_);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这两个函数的逻辑比较简单。往相应的任务队列插入一个新的任务，然后通知主线程处理。接着看任务处理函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void PerIsolatePlatformData::FlushTasks(uv_async_t* handle) {</span>
<span class="line">  auto platform_data = static_cast&lt;PerIsolatePlatformData*&gt;(handle-&gt;data);</span>
<span class="line">  platform_data-&gt;FlushForegroundTasksInternal();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">bool PerIsolatePlatformData::FlushForegroundTasksInternal() {</span>
<span class="line">  bool did_work = false;</span>
<span class="line">  // 处理延时任务</span>
<span class="line">  while (std::unique_ptr&lt;DelayedTask&gt; delayed =</span>
<span class="line">      foreground_delayed_tasks_.Pop()) {</span>
<span class="line">    did_work = true;</span>
<span class="line">    uint64_t delay_millis = llround(delayed-&gt;timeout * 1000);</span>
<span class="line"></span>
<span class="line">    delayed-&gt;timer.data = static_cast&lt;void*&gt;(delayed.get());</span>
<span class="line">    uv_timer_init(loop_, &amp;delayed-&gt;timer);</span>
<span class="line">    // 启动定时器，超时后通过 RunForegroundTask 执行真正的任务</span>
<span class="line">    uv_timer_start(&amp;delayed-&gt;timer, RunForegroundTask, delay_millis, 0);</span>
<span class="line">    uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(&amp;delayed-&gt;timer));</span>
<span class="line">    uv_handle_count_++;</span>
<span class="line">  }</span>
<span class="line">  // 处理普通任务</span>
<span class="line">  std::queue&lt;std::unique_ptr&lt;Task&gt;&gt; tasks = foreground_tasks_.PopAll();</span>
<span class="line">  while (!tasks.empty()) {</span>
<span class="line">    std::unique_ptr&lt;Task&gt; task = std::move(tasks.front());</span>
<span class="line">    tasks.pop();</span>
<span class="line">    did_work = true;</span>
<span class="line">    RunForegroundTask(std::move(task));</span>
<span class="line">  }</span>
<span class="line">  return did_work;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>FlushTasks 的逻辑就是遍历两个任务队列，如果是普通任务队列则直接执行任务函数，如果是延迟队列则先启动一个定时器，等到定时器超时时再执行真正的任务函数。下面是一种使用的情况。</p><p>tu 9-3</p><p>创建 Environment 对象</p><p>初始化完 V8 Platform 后，接着创建 Environment 对象。Node.js 中 Environment 类（env.h）是一个很重要的类，主要用于包括一些公共的数据结构和逻辑，每一个线程对应一个 Environment 对象。Environment 类非常庞大，看一下初始化的代码</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">Environment::Environment(IsolateData* isolate_data,  </span>
<span class="line">                         Local&lt;Context&gt; context,  </span>
<span class="line">                         const std::vector&lt;std::string&gt;&amp; args,  </span>
<span class="line">                         const std::vector&lt;std::string&gt;&amp; exec_args,  </span>
<span class="line">                         Flags flags,  </span>
<span class="line">                         uint64_t thread_id)  </span>
<span class="line">    : isolate_(context-&gt;GetIsolate()),  </span>
<span class="line">      isolate_data_(isolate_data),</span>
<span class="line">      // ... </span>
<span class="line">      context_(context-&gt;GetIsolate(), context) { </span>
<span class="line">  // 保存命令行参数</span>
<span class="line">  options_.reset(new EnvironmentOptions(*isolate_data-&gt;options()-&gt;per_env));   </span>
<span class="line">  // inspector agent，用于调试诊断</span>
<span class="line">  inspector_agent_ = std::make_unique&lt;inspector::Agent&gt;(this);</span>
<span class="line">  // 关联 context 和 env  </span>
<span class="line">  AssignToContext(context, ContextInfo(&quot;&quot;));  </span>
<span class="line">  // 创建其它对象  </span>
<span class="line">  CreateProperties();  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们只看一下 AssignToContext 和 CreateProperties。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline void Environment::AssignToContext(v8::Local&lt;v8::Context&gt; context,  </span>
<span class="line">                                         const ContextInfo&amp; info) {  </span>
<span class="line">  // 在 context 中保存 env 对象                                           </span>
<span class="line">  context-&gt;SetAlignedPointerInEmbedderData(ContextEmbedderIndex::kEnvironment, this);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>AssignToContext 用于保存 context 和 env 的关系，这个逻辑非常重要，因为后续执行代码时，我们会进入 V8 的领域，这时候，我们只知道 Isolate 和 context。如果不保存 context 和 env 的关系，我们就不知道当前所属的 env。我们看一下如何获取对应的 env。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline Environment* Environment::GetCurrent(v8::Isolate* isolate) {  </span>
<span class="line">  v8::HandleScope handle_scope(isolate);  </span>
<span class="line">  return GetCurrent(isolate-&gt;GetCurrentContext());  </span>
<span class="line">}  </span>
<span class="line">  </span>
<span class="line">inline Environment* Environment::GetCurrent(v8::Local&lt;v8::Context&gt; context) {  </span>
<span class="line">  return static_cast&lt;Environment*&gt;(  </span>
<span class="line">      context-&gt;GetAlignedPointerFromEmbedderData(ContextEmbedderIndex::kEnvironment));  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看一下 CreateProperties 中创建 process 对象的逻辑。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Environment::CreateProperties() {</span>
<span class="line">  Local&lt;Object&gt; process_object = node::CreateProcessObject(this).FromMaybe(Local&lt;Object&gt;());</span>
<span class="line">  // 保存到 Environment 对象中</span>
<span class="line">  set_process_object(process_object);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">// node::CreateProcessObject</span>
<span class="line">MaybeLocal&lt;Object&gt; CreateProcessObject(Environment* env) {</span>
<span class="line">  Isolate* isolate = env-&gt;isolate();</span>
<span class="line">  EscapableHandleScope scope(isolate);</span>
<span class="line">  Local&lt;Context&gt; context = env-&gt;context();</span>
<span class="line">  // 创建一个函数模版</span>
<span class="line">  Local&lt;FunctionTemplate&gt; process_template = FunctionTemplate::New(isolate);</span>
<span class="line">  process_template-&gt;SetClassName(env-&gt;process_string());</span>
<span class="line">  Local&lt;Function&gt; process_ctor;</span>
<span class="line">  Local&lt;Object&gt; process;</span>
<span class="line">  // 基于函数模版创建一个函数，并通过这个函数创建一个对象</span>
<span class="line">  if (!process_template-&gt;GetFunction(context).ToLocal(&amp;process_ctor) ||</span>
<span class="line">      !process_ctor-&gt;NewInstance(context).ToLocal(&amp;process)) {</span>
<span class="line">    return MaybeLocal&lt;Object&gt;();</span>
<span class="line">  }</span>
<span class="line">  // 给 process 对象设置属性，就是我们在 JS 层可以获取的那些字段</span>
<span class="line">  // process.version</span>
<span class="line">  READONLY_PROPERTY(process,</span>
<span class="line">                    &quot;version&quot;,</span>
<span class="line">                    FIXED_ONE_BYTE_STRING(env-&gt;isolate(), NODE_VERSION));</span>
<span class="line"></span>
<span class="line">  // process.versions</span>
<span class="line">  Local&lt;Object&gt; versions = Object::New(env-&gt;isolate());</span>
<span class="line">  READONLY_PROPERTY(process, &quot;versions&quot;, versions);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>CreateProperties 创建了 process 对象并设置了一些属性，process 对象就是我们在 JS 层用使用的 process 对象，除了在 C++ 层设置属性外，在后续的启动过程，JS 层也会设置很多属性。</p><h2 id="初始化-libuv-任务" tabindex="-1"><a class="header-anchor" href="#初始化-libuv-任务"><span>初始化 Libuv 任务</span></a></h2><p>创建完 Environment 对象后，接着执行 InitializeLibuv 初始化 Libuv 相关的数据结构以及往 Libuv 中提交任务。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Environment::InitializeLibuv(bool start_profiler_idle_notifier) {  </span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(timer_handle()));  </span>
<span class="line">  uv_check_init(event_loop(), immediate_check_handle());  </span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(immediate_check_handle()));</span>
<span class="line">  uv_idle_init(event_loop(), immediate_idle_handle());  </span>
<span class="line">  uv_check_start(immediate_check_handle(), CheckImmediate);  </span>
<span class="line">  uv_prepare_init(event_loop(), &amp;idle_prepare_handle_);  </span>
<span class="line">  uv_check_init(event_loop(), &amp;idle_check_handle_);  </span>
<span class="line">  uv_async_init(  </span>
<span class="line">      event_loop(),  </span>
<span class="line">      &amp;task_queues_async_,  </span>
<span class="line">      [](uv_async_t* async) {  </span>
<span class="line">        // ...</span>
<span class="line">      });  </span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(&amp;idle_prepare_handle_));  </span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(&amp;idle_check_handle_));  </span>
<span class="line">  uv_unref(reinterpret_cast&lt;uv_handle_t*&gt;(&amp;task_queues_async_));  </span>
<span class="line">  // …</span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这些函数都是 Libuv 提供的，分别是往 Libuv 不同阶段插入任务节点，uv_unref 是修改状态为 inactived，避免影响事件循环的退出。</p><p>timer_handle 是实现 Node.js 中定时器的数据结构，对应 Libuv 的 time 阶段。 immediate_check_handle 是实现 Node.js 中 setImmediate 的数据结构，对应 Libuv 的check 阶段。 immediate_idle_handle 也是实现 Node.js 中 setImmediate 的数据结构，对应 Libuv 的 idle 阶段。 task_queues_async_ 用于子线程和主线程通信。 这里主要讲一下 4，其他的后面的课程再详细讲解。task_queues_async_ 用于其他子线程往启动线程提交一些任务，比如以下情况。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename Fn&gt;</span>
<span class="line">void Environment::SetImmediateThreadsafe(Fn&amp;&amp; cb) {</span>
<span class="line">  auto callback = std::make_unique&lt;NativeImmediateCallbackImpl&lt;Fn&gt;&gt;(</span>
<span class="line">      std::move(cb), false);</span>
<span class="line">  {</span>
<span class="line">    Mutex::ScopedLock lock(native_immediates_threadsafe_mutex_);</span>
<span class="line">    native_immediates_threadsafe_.Push(std::move(callback));</span>
<span class="line">  }</span>
<span class="line">  uv_async_send(&amp;task_queues_async_);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">template &lt;typename Fn&gt;</span>
<span class="line">void Environment::RequestInterrupt(Fn&amp;&amp; cb) {</span>
<span class="line">  auto callback = std::make_unique&lt;NativeImmediateCallbackImpl&lt;Fn&gt;&gt;(</span>
<span class="line">      std::move(cb), false);</span>
<span class="line">  {</span>
<span class="line">    Mutex::ScopedLock lock(native_immediates_threadsafe_mutex_);</span>
<span class="line">    native_immediates_interrupts_.Push(std::move(callback));</span>
<span class="line">  }</span>
<span class="line">  uv_async_send(&amp;task_queues_async_);</span>
<span class="line">  RequestInterruptFromV8();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到两个不同的函数会往两个不同的任务队列里插入一个任务，然后调用 uv_async_send 通知启动线程有任务需要处理。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  uv_async_init(</span>
<span class="line">      event_loop(),</span>
<span class="line">      &amp;task_queues_async_,</span>
<span class="line">      [](uv_async_t* async) {</span>
<span class="line">        Environment* env = ContainerOf(&amp;Environment::task_queues_async_, async);</span>
<span class="line">        // 处理队列里的任务</span>
<span class="line">        env-&gt;RunAndClearNativeImmediates();</span>
<span class="line">  });</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这个逻辑很简单，主要是利用了 Libuv 提供的线程间通信机制，不过值得注意的是 Environment::RequestInterrupt 函数。该函数里调用了 RequestInterruptFromV8 和 uv_async_send 两个函数通知启动线程，这是为什么呢？因为 uv_async_send 只是通知启动线程有任务处理，且如果启动线程正阻塞在事件驱动模块，则唤醒启动线程，但是如果启动线程正在繁忙地执行 JS，甚至陷入了 JS 死循环里了，那么插入的任务就无法被处理了，这正是 RequestInterruptFromV8 解决的问题，RequestInterruptFromV8 是对 isolate()-&gt;RequestInterrupt 的封装，它是线程安全的，用于往 V8 插入一个任务，这个任务哪怕在 JS 死循环时也会被执行。通过 V8 的 Libuv 两种机制的配合，就可以保证这个任务一定会被执行，利用这个能力，我们可以做很多有趣的事情，同时也可以解决 Node.js 单线程带来的一些限制。</p><p>初始化 Loader 初始化 Libuv 的数据结构后，接着执行 RunBootstrapping 初始化模块加载器和执行内部的 JS 代码，对应的函数分别是 BootstrapInternalLoaders 和 BootstrapNode 函数。BootstrapInternalLoaders 首先定义一个变量，该变量是一个字符串数组，用于定义函数的形参列表，一会我们会看到它的作用。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">std::vector&lt;Local&lt;String&gt;&gt; loaders_params = {  </span>
<span class="line">      process_string(),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate_, &quot;getLinkedBinding&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate_, &quot;getInternalBinding&quot;),  </span>
<span class="line">      primordials_string()</span>
<span class="line">};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后再定义一个变量，是一个对象数组，用作执行函数时的实参。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">    std::vector&lt;Local&lt;Value&gt;&gt; loaders_args = {  </span>
<span class="line">         // 刚才创建的 process 对象</span>
<span class="line">         process_object(),  </span>
<span class="line">         NewFunctionTemplate(binding::GetLinkedBinding)  </span>
<span class="line">             -&gt;GetFunction(context())  </span>
<span class="line">             .ToLocalChecked(),  </span>
<span class="line">         NewFunctionTemplate(binding::GetInternalBinding)  </span>
<span class="line">             -&gt;GetFunction(context())  </span>
<span class="line">             .ToLocalChecked(),  </span>
<span class="line">         primordials()};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着 Node.js 编译执行 internal/bootstrap/loaders.js。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  ExecuteBootstrapper(this, &quot;internal/bootstrap/loaders&quot;, &amp;loaders_params, &amp;loaders_args);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这个过程链路非常长，最后到 V8 层，就不贴出具体的代码，具体的逻辑转成 JS 如下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">    <span class="token keyword">function</span> <span class="token function">demo</span><span class="token punctuation">(</span><span class="token parameter">process<span class="token punctuation">,</span> </span>
<span class="line">                  getLinkedBinding<span class="token punctuation">,</span> </span>
<span class="line">                  getInternalBinding<span class="token punctuation">,</span> </span>
<span class="line">                  primordials</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token comment">// internal/bootstrap/loaders.js 的代码  </span></span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">const</span> process <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">function</span> <span class="token function">getLinkedBinding</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span><span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">function</span> <span class="token function">getInternalBinding</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">const</span> primordials <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">const</span> <span class="token keyword">export</span> <span class="token operator">=</span> <span class="token function">demo</span><span class="token punctuation">(</span>process<span class="token punctuation">,</span> </span>
<span class="line">                        getLinkedBinding<span class="token punctuation">,</span> </span>
<span class="line">                        getInternalBinding<span class="token punctuation">,</span> </span>
<span class="line">                        primordials<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>V8 会把 internal/bootstrap/loaders.js 的代码用一个函数包裹起来，形参就是 loaders_params 变量对应的四个字符串。然后执行这个函数，并且传入 loaders_args 里的那四个对象。在看 internal/bootstrap/loaders.js 代码之前，我们先看一下 getLinkedBinding, getInternalBinding 这两个函数，Node.js 在 C++ 层对外暴露了AddLinkedBinding 方法注册模块，Node.js 针对这种类型的模块，维护了一个单独的链表。getLinkedBinding 就是根据模块名从这个链表中找到对应的模块，但是我们一般用不到这个，所以就不深入分析。前面我们看到对于 C++ 内置模块，Node.js 同样维护了一个链表，getInternalBinding 就是根据模块名从这个链表中找到对应的模块。现在我们可以具体看一下 internal/bootstrap/loaders.js 的代码了。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">let</span> internalBinding<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> bindingObj <span class="token operator">=</span> <span class="token function">ObjectCreate</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token function-variable function">internalBinding</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span><span class="token parameter">module</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">let</span> mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">typeof</span> mod <span class="token operator">!==</span> <span class="token string">&#39;object&#39;</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token comment">// C++ 层传进来的 C++ 模块加载器</span></span>
<span class="line">      mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token function">getInternalBinding</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">      moduleLoadList<span class="token punctuation">.</span><span class="token function">push</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">Internal Binding </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>module<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">return</span> mod<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Node.js 在 JS 中对 getInternalBinding 进行了一个封装，主要是加了缓存处理，在 JS 里就可以通过 internalBinding 加载 C++ 模块。接着看下面的代码。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> internalBindingWhitelist <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SafeSet</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token string">&#39;tcp_wrap&#39;</span><span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token comment">// 一系列C++内置模块名  </span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  </span>
<span class="line"><span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> bindingObj <span class="token operator">=</span> <span class="token function">ObjectCreate</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  process<span class="token punctuation">.</span><span class="token function-variable function">binding</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token function">binding</span><span class="token punctuation">(</span><span class="token parameter">module</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    module <span class="token operator">=</span> <span class="token function">String</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span>internalBindingWhitelist<span class="token punctuation">.</span><span class="token function">has</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token keyword">return</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">Error</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">No such module: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>module<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>给 process 挂载里一个 binding 函数用于加载 C++ 模块，但是它只能加载白名单里的 C++ 模块。除了 C++ 模块外，我们知道 Node.js 中还有原生的 JS 模块，对于加载原生JS 模块的处理。Node.js 通过 nativeModuleRequire 加载，后面的模块加载器课程时我们再详细讲解。最后返回这两个模块加载器给C++层。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">return</span><span class="token punctuation">{</span>  </span>
<span class="line">  internalBinding<span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token literal-property property">require</span><span class="token operator">:</span> nativeModuleRequire  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>C++ 层保存其中两个函数，分别用于加载内置 C++ 模块和原生 JS 模块的函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">set_internal_binding_loader(internal_binding_loader.As&lt;Function&gt;());</span>
<span class="line">set_native_module_require(require.As&lt;Function&gt;());   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>至此，internal/bootstrap/loaders.js 分析完了。</p><p>执行内部 JS 代码</p><p>初始化完模块加载器后，接着通过 BootstrapNode 执行内部的 JS 代码，代码如下</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 获取全局变量并设置 global 属性，就是我们在 JS 层使用的 global 对象</span>
<span class="line">Local&lt;Object&gt; global = context()-&gt;Global();  </span>
<span class="line">global-&gt;Set(context(), FIXED_ONE_BYTE_STRING(isolate_, &quot;global&quot;), global).Check();  </span>
<span class="line">/*</span>
<span class="line">  执行 internal/bootstrap/node.js 时的参数</span>
<span class="line">  process, require, internalBinding, primordials</span>
<span class="line">*/</span>
<span class="line">std::vector&lt;Local&lt;String&gt;&gt; node_params = {</span>
<span class="line">    process_string(),</span>
<span class="line">    require_string(),</span>
<span class="line">    internal_binding_string(),</span>
<span class="line">    primordials_string()};</span>
<span class="line">std::vector&lt;Local&lt;Value&gt;&gt; node_args = {</span>
<span class="line">    process_object(),</span>
<span class="line">    // 原生模块加载器</span>
<span class="line">    native_module_require(),</span>
<span class="line">    // C++ 模块加载器</span>
<span class="line">    internal_binding_loader(),</span>
<span class="line">    primordials()};</span>
<span class="line"></span>
<span class="line">ExecuteBootstrapper(this, &quot;internal/bootstrap/node&quot;, &amp;node_params, &amp;node_args);</span>
<span class="line">ExecuteBootstrapper(this, &quot;internal/bootstrap/switches/is_main_thread&quot;, &amp;node_params, &amp;node_args);  </span>
<span class="line">ExecuteBootstrapper(this, &quot;internal/bootstrap/switches/does_own_process_state&quot;, &amp;node_params, &amp;node_args); </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先在全局对象上设置一个 global 属性，值是一个全局对象，这就是我们在 Node.js 中使用的 global 对象。接着传入刚才保存的模块加载器，执行三个 JS 文件的代码，这三个文件的代码主要是挂载属性和做一些初始化工作。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">process<span class="token punctuation">.</span>cpuUsage<span class="token operator">=</span> wrapped<span class="token punctuation">.</span>cpuUsage<span class="token punctuation">;</span>  </span>
<span class="line">process<span class="token punctuation">.</span>resourceUsage <span class="token operator">=</span> wrapped<span class="token punctuation">.</span>resourceUsage<span class="token punctuation">;</span>  </span>
<span class="line">process<span class="token punctuation">.</span>memoryUsage <span class="token operator">=</span> wrapped<span class="token punctuation">.</span>memoryUsage<span class="token punctuation">;</span>  </span>
<span class="line">process<span class="token punctuation">.</span>kill <span class="token operator">=</span> wrapped<span class="token punctuation">.</span>kill<span class="token punctuation">;</span>  </span>
<span class="line">process<span class="token punctuation">.</span>exit <span class="token operator">=</span> wrapped<span class="token punctuation">.</span>exit<span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>设置全局变量</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">defineOperation</span><span class="token punctuation">(</span>global<span class="token punctuation">,</span> <span class="token string">&#39;clearInterval&#39;</span><span class="token punctuation">,</span> timers<span class="token punctuation">.</span>clearInterval<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token function">defineOperation</span><span class="token punctuation">(</span>global<span class="token punctuation">,</span> <span class="token string">&#39;clearTimeout&#39;</span><span class="token punctuation">,</span> timers<span class="token punctuation">.</span>clearTimeout<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token function">defineOperation</span><span class="token punctuation">(</span>global<span class="token punctuation">,</span> <span class="token string">&#39;setInterval&#39;</span><span class="token punctuation">,</span> timers<span class="token punctuation">.</span>setInterval<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token function">defineOperation</span><span class="token punctuation">(</span>global<span class="token punctuation">,</span> <span class="token string">&#39;setTimeout&#39;</span><span class="token punctuation">,</span> timers<span class="token punctuation">.</span>setTimeout<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token function">ObjectDefineProperty</span><span class="token punctuation">(</span>global<span class="token punctuation">,</span> <span class="token string">&#39;process&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token literal-property property">value</span><span class="token operator">:</span> process<span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token literal-property property">enumerable</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token literal-property property">writable</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token literal-property property">configurable</span><span class="token operator">:</span> <span class="token boolean">true</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里的细节比较多，就不具体展开，后续用到的时候再单独介绍。</p><p>执行用户 JS 代码 经过前面一系列的操作，完成了 C++ 层的初始化，也完成了 JS 层的初始化，最终通过 StartMainThreadExecution 执行用户 JS 代码（internal/main/run_main_module.js）。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span></span>
<span class="line">  prepareMainThreadExecution</span>
<span class="line"><span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/bootstrap/pre_execution&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token function">prepareMainThreadExecution</span><span class="token punctuation">(</span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>Module<span class="token punctuation">.</span><span class="token function">runMain</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span>argv<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>但是在执行用户 JS 之前还需要处理一下事情，比如 IPC 通道，具体逻辑在 prepareMainThreadExecution。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">prepareMainThreadExecution</span><span class="token punctuation">(</span><span class="token parameter">expandArgv1 <span class="token operator">=</span> <span class="token boolean">false</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token comment">// 只列出部分</span></span>
<span class="line">  <span class="token comment">// 给 process 挂载属性</span></span>
<span class="line">  <span class="token function">patchProcessObject</span><span class="token punctuation">(</span>expandArgv1<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// IPC 处理</span></span>
<span class="line">  <span class="token function">setupChildProcessIpcChannel</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// Cluster 模块的处理</span></span>
<span class="line">  <span class="token function">initializeClusterIPC</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 挂载 runMain，为执行用户 JS 做准备</span></span>
<span class="line">  <span class="token function">initializeCJSLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 加载预加载模块</span></span>
<span class="line">  <span class="token function">loadPreloadModules</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>1 给process对象挂载属性</p><p>执行 patchProcessObject 函数（在 node_process_methods.cc 中导出）给 process 对象挂载一些列属性，不一一列举。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// process.argv  </span>
<span class="line">process-&gt;Set(context,</span>
<span class="line">             FIXED_ONE_BYTE_STRING(isolate, &quot;argv&quot;),  </span>
<span class="line">             ToV8Value(context, env-&gt;argv()).ToLocalChecked()).Check();  </span>
<span class="line">  </span>
<span class="line">READONLY_PROPERTY(process, </span>
<span class="line">                  &quot;pid&quot;,  </span>
<span class="line">                  Integer::New(isolate, uv_os_getpid())); </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>因为 Node.js 增加了对线程的支持，有些属性需要特殊处理，比如在线程里使用 process.exit 的时候，退出的是单个线程，而不是整个进程。</p><p>2 处理 进程间通信</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">setupChildProcessIpcChannel</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_CHANNEL_FD</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">const</span> fd <span class="token operator">=</span> <span class="token function">parseInt</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_CHANNEL_FD</span><span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">delete</span> process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_CHANNEL_FD</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">const</span> serializationMode <span class="token operator">=</span> </span>
<span class="line">process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_CHANNEL_SERIALIZATION_MODE</span> <span class="token operator">||</span> <span class="token string">&#39;json&#39;</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">delete</span> process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_CHANNEL_SERIALIZATION_MODE</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;child_process&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">_forkChild</span><span class="token punctuation">(</span>fd<span class="token punctuation">,</span> serializationMode<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>环境变量 NODE_CHANNEL_FD 是在创建子进程的时候设置的，如果有说明当前启动的进程是子进程，则需要处理进程间通信。</p><p>3 处理cluster模块的 进程间通信</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">initializeclusterIPC</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>process<span class="token punctuation">.</span>argv<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span> <span class="token operator">&amp;&amp;</span> process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_UNIQUE_ID</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">const</span> cluster <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;cluster&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    cluster<span class="token punctuation">.</span><span class="token function">_setupWorker</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> </span>
<span class="line">    <span class="token keyword">delete</span> process<span class="token punctuation">.</span>env<span class="token punctuation">.</span><span class="token constant">NODE_UNIQUE_ID</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>4 挂载 runMain</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">initializeCJSLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> CJSLoader <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  CJSLoader<span class="token punctuation">.</span>Module<span class="token punctuation">.</span>runMain <span class="token operator">=</span></span>
<span class="line">    <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/run_main&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>executeUserEntryPoint<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>runMain 用于执行用户 JS 代码。</p><p>5 加载预加载模块</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">loadPreloadModules</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token comment">// 获取需要预加载的模块</span></span>
<span class="line">  <span class="token keyword">const</span> preloadModules <span class="token operator">=</span> <span class="token function">getOptionValue</span><span class="token punctuation">(</span><span class="token string">&#39;--require&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>preloadModules <span class="token operator">&amp;&amp;</span> preloadModules<span class="token punctuation">.</span>length <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">const</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token literal-property property">Module</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">        _preloadModules</span>
<span class="line">      <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 加载</span></span>
<span class="line">    <span class="token function">_preloadModules</span><span class="token punctuation">(</span>preloadModules<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>预加载模块会在用户 JS 代码之前被加载，所以我们可以在预加载模块里做一些 hack 的事情。</p><p>5 执行用户 JS 代码</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>Module<span class="token punctuation">.</span><span class="token function">runMain</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span>argv<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这里的 require 就是 初始化 Loader 时保存到 C++ 层的原生 JS 模块加载器 nativeModuleRequire。internal/modules/cjs/loader.js 是负责加载用户 JS 的模块，runMain 做的事情是加载用户的 JS，然后执行，模块加载器课程中再详细讲解。</p><p>进入Libuv事件循环 执行完所有内置的初始化后，Node.js 执行了用户的 JS 代码，用户的 JS 代码通常会往事件循环中注册任务，比如创建一个服务器，最后 Node.js 进入 Libuv 的事件循环中，开始一轮又一轮的事件循环处理。如果没有需要处理的任务，Libuv 会退出，从而 Node.js 退出。</p><p>总结</p><p>本节课从宏观到微观的角度详细介绍了 Node.js 启动过程中所涉及的核心逻辑，包括注册 C++ 模块、Platform、Environment、Loader 的初始化、执行用户的 JS 代码和启动事件循环等。</p><p>C++ 模块用于暴露底层的能力到 JS 层。 Platform 用于管理多个子线程辅助 Node.js 的工作，比如 GC。 Environment 用于管理 Node.js 中的公共数据结构和逻辑。 Loader 用于初始化模块加载器，为后续执行代码做准备。 执行用户的 JS 注册任务到事件循环。 最后一个步骤是启动事件循环，这样 Node.js 就启动起来了。 通过了解每一个步骤的实现以及意义，我们对 Node.js 的底层原理的理解又进了一步，同时也为我们实现简单的 JS 运行时打下了坚实的基础。</p>`,138)]))}const d=s(l,[["render",t],["__file","bootstrap.html.vue"]]),r=JSON.parse('{"path":"/nodejs/deep_into_nodejs/bootstrap.html","title":"Node.js的启动过程","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"注册 C++ 模块","slug":"注册-c-模块","link":"#注册-c-模块","children":[]},{"level":2,"title":"V8 Platform 初始化","slug":"v8-platform-初始化","link":"#v8-platform-初始化","children":[]},{"level":2,"title":"初始化 Libuv 任务","slug":"初始化-libuv-任务","link":"#初始化-libuv-任务","children":[]}],"git":{"updatedTime":1705375577000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"nodejs/deep_into_nodejs/bootstrap.md"}');export{d as comp,r as data};