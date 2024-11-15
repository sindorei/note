import{_ as s,c as a,f as e,o as p}from"./app-LHpjaFTr.js";const t={};function l(i,n){return p(),a("div",null,n[0]||(n[0]=[e(`<h1 id="node-js中js和c-对象的内存管理机制" tabindex="-1"><a class="header-anchor" href="#node-js中js和c-对象的内存管理机制"><span>Node.js中js和c++对象的内存管理机制</span></a></h1><p>虽然 JS 自带 GC ，但开发者依然需要关注它的内存问题。 V8 会回收不再使用的对象，但如果开发者不再使用一个对象却保留了引用，该对象的内存就无法被释放，从而导致内存泄露。</p><p>Node.js 内部同样如此，Node.js 的维护者必须小心处理代码的逻辑以避免内存泄露。而且，相比前端，避免内存泄露在 Node.js 中更重要。前端页面通常不会长时间运行，刷新页面之后一切如初，但是 Node.js 通常作为长时间运行的进程，一旦发生内存泄露就会导致进程 OOM 退出。此外，如果释放了还需要使用的内存则会导致应用 Crash。这些情况都直接影响了服务的稳定性</p><p>在 Node.js 中，如果是单纯的 JS 对象，当我们不再使用该对象时，保证没有变量引用到该对象就可以保证它能被 GC。但如果是关联了 C++ 对象的 JS 对象，情况就复杂了。当我们不再使用该对象时，必须要保证 JS 和 C++ 对象共存亡和不要释放还需要使用的内存。Node.js 中解决这个问题主要是利用了 V8 提供的持久句柄和弱引用回调的机制。持久句柄保持对 JS 对象的引用使得不会被 GC，弱引用回调可以设置当只有该持久句柄引用了某 JS 对象时，这个 JS 对象可以被 GC 并执行持久句柄设置的回调函数，通过这个机制我们就可以解决这种复杂的场景。</p><p>本节课将会讲解不同场景下，Node.js 中 JS 和 C++ 对象的内存管理机制，这部分内容是非常核心的，其使用遍布 Node.js 整个项目中，理解它的实现将会帮助我们更深刻地理解 Node.js，同时也可以应用到我们的项目中。</p><h2 id="node-js-的内存管理机制" tabindex="-1"><a class="header-anchor" href="#node-js-的内存管理机制"><span>Node.js 的内存管理机制</span></a></h2><p>基于 HandleWrap 的内存管理机制</p><p>下面以 UDP 模块为例介绍基于 HandleWrap 的模块的内存管理机制，首先看一下 C++ 层的 UDP 模块给 JS 层暴露的功能。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void UDPWrap::Initialize(Local&lt;Object&gt; target,</span>
<span class="line">                         Local&lt;Value&gt; unused,</span>
<span class="line">                         Local&lt;Context&gt; context,</span>
<span class="line">                         void* priv) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(context);</span>
<span class="line">  // 创建一个函数模版</span>
<span class="line">  Local&lt;FunctionTemplate&gt; t = env-&gt;NewFunctionTemplate(New);</span>
<span class="line">  t-&gt;InstanceTemplate()-&gt;SetInternalFieldCount(1);</span>
<span class="line">  Local&lt;String&gt; udpString = FIXED_ONE_BYTE_STRING(env-&gt;isolate(), &quot;UDP&quot;);</span>
<span class="line">  t-&gt;SetClassName(udpString);</span>
<span class="line">  // 设置一些原型方法</span>
<span class="line">  env-&gt;SetProtoMethod(t, &quot;open&quot;, Open);</span>
<span class="line">  // 继承 HandleWrap 的方法，JS 层可以调用，比如 close</span>
<span class="line">  t-&gt;Inherit(HandleWrap::GetConstructorTemplate(env));</span>
<span class="line">  // 设置一系列函数</span>
<span class="line">  // 暴露到 JS 层</span>
<span class="line">  target-&gt;Set(env-&gt;context(),</span>
<span class="line">              udpString,</span>
<span class="line">              t-&gt;GetFunction(env-&gt;context()).ToLocalChecked()).Check();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看一下在 JS 层是如何使用的。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> <span class="token constant">UDP</span> <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span><span class="token string">&#39;udp_wrap&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>internalBinding 用于加载 C++ 模块，可以看到 C++ 模块暴露了一个对象 UDP，当我们创建一个 UDP Socket 时，就会相应的创建一个 C++ 层的 UDP 对象，以下为示例代码。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">createSocket</span><span class="token punctuation">(</span><span class="token parameter">type<span class="token punctuation">,</span> listener</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Socket</span><span class="token punctuation">(</span>type<span class="token punctuation">,</span> listener<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">Socket</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>handle <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">UDP</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接下来看一下当执行 new UDP 时 C++ 的逻辑，根据 C++ 模块的定义，这时候会执行 UDPWrap::New。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void UDPWrap::New(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(args);</span>
<span class="line">  // args.This() 为 JS 层 this.handle 引用的对象</span>
<span class="line">  new UDPWrap(env, args.This());</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">UDPWrap::UDPWrap(Environment* env, Local&lt;Object&gt; object)</span>
<span class="line">    : HandleWrap(env, object, ...) {</span>
<span class="line">  // ...</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>UDPWrap 继承 HandleWrap，HandleWrap 继承 AsyncWrap，AsyncWrap 继承 BaseObject。我们直接看 BaseObject。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">BaseObject::BaseObject(Environment* env, v8::Local&lt;v8::Object&gt; object)</span>
<span class="line">    : persistent_handle_(env-&gt;isolate(), object), env_(env) {</span>
<span class="line">  // 把 this存到 object中</span>
<span class="line">  object-&gt;SetAlignedPointerInInternalField(0, static_cast&lt;void*&gt;(this));</span>
<span class="line">  // env 退出释放当前 this 对象的内存</span>
<span class="line">  env-&gt;AddCleanupHook(DeleteMe, static_cast&lt;void*&gt;(this));</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>因为 C++ 层通过持久句柄 persistent_handle_ 引用了 JS 的对象 object，所以就算 JS 层没有变量引用 object 它也不会被 GC。那么它什么时候会被 GC 呢？那就是当调用 Socket 的 close 时。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token class-name">Socket</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span><span class="token function-variable function">close</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">callback</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token comment">// 下面是示例代码</span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>handle<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>handle <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里有两个操作，首先调用了 C++ 的 close 函数，然后把 handle 置为 null，即不再引用。因为 UDP 继承了 HandleWrap，所以这里的 close 其实就是 HandleWrap 的 close。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void HandleWrap::Close(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  HandleWrap* wrap;</span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap, args.Holder());</span>
<span class="line">  wrap-&gt;Close(args[0]);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void HandleWrap::Close(Local&lt;Value&gt; close_callback) {</span>
<span class="line">  uv_close(handle_, OnClose);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>HandleWrap 是对 Libuv handle 的封装，所以需要先关闭 handle，接着在 close 阶段执行回调。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void HandleWrap::OnClose(uv_handle_t* handle) {</span>
<span class="line">  // BaseObjectPtr 管理 HandleWrap 对象</span>
<span class="line">  BaseObjectPtr&lt;HandleWrap&gt; wrap { static_cast&lt;HandleWrap*&gt;(handle-&gt;data) };</span>
<span class="line">  wrap-&gt;Detach();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>BaseObjectPtr 是一个智能指针（using BaseObjectPtr = BaseObjectPtrImpl&lt;T, false&gt;），里面维护了 HandleWrap 对象。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T, bool kIsWeak&gt;</span>
<span class="line">BaseObjectPtrImpl&lt;T, kIsWeak&gt;::BaseObjectPtrImpl(T* target)</span>
<span class="line">  : BaseObjectPtrImpl() {</span>
<span class="line">  data_.target = target;</span>
<span class="line">  get()-&gt;increase_refcount();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void BaseObject::increase_refcount() {</span>
<span class="line">  // 引用数加一</span>
<span class="line">  unsigned int prev_refcount = pointer_data()-&gt;strong_ptr_count++;</span>
<span class="line">  // 如果之前引用数为 0，则清除弱引用回调，防止被 GC</span>
<span class="line">  if (prev_refcount == 0 &amp;&amp; !persistent_handle_.IsEmpty())</span>
<span class="line">    persistent_handle_.ClearWeak();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void BaseObject::Detach() {</span>
<span class="line">  pointer_data()-&gt;is_detached = true;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Detach 只是设置了一个标记，在执行完 OnClose 后 BaseObjectPtr 会被析构。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T, bool kIsWeak&gt;</span>
<span class="line">BaseObjectPtrImpl&lt;T, kIsWeak&gt;::~BaseObjectPtrImpl() {</span>
<span class="line">    // get() 返回 BaseObject*</span>
<span class="line">    get()-&gt;decrease_refcount();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void BaseObject::decrease_refcount() {</span>
<span class="line">  PointerData* metadata = pointer_data();</span>
<span class="line">  // 引用数减一</span>
<span class="line">  unsigned int new_refcount = --metadata-&gt;strong_ptr_count;</span>
<span class="line">  if (new_refcount == 0) {</span>
<span class="line">    // 为 true</span>
<span class="line">    if (metadata-&gt;is_detached) {</span>
<span class="line">      // OnGCCollect 最终执行 delete this;</span>
<span class="line">      OnGCCollect();</span>
<span class="line">    } else if (metadata-&gt;wants_weak_jsobj &amp;&amp; !persistent_handle_.IsEmpty()) {</span>
<span class="line">      MakeWeak();</span>
<span class="line">    }</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>BaseObjectPtr 析构后就会释放 this 指针指向的内存，从而 BaseObject 对象的字段 persistent_handle_ 对象（Global 类型）也被析构。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">~Global() { this-&gt;Reset(); }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>Reset 使得 persistent_handle_不再引用 JS 对象，最终 JS 对象失去了所有的引用，从而 JS 对象也被 GC。可以通过一个例子看一下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> dgram <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;dgram&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> socket <span class="token operator">=</span> dgram<span class="token punctuation">.</span><span class="token function">createSocket</span><span class="token punctuation">(</span><span class="token string">&#39;udp4&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">socket<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>基于 ReqWrap 的内存管理机制</p><p>接下来看一下基于 ReqWrap 的请求对象的内存管理机制，以 TCP 的 TCPConnectWrap 为例，首先看一下 C++ 层 TCPConnectWrap 的定义。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 创建一个函数模版</span>
<span class="line">Local&lt;FunctionTemplate&gt; cwt = BaseObject::MakeLazilyInitializedJSTemplate(env);</span>
<span class="line">cwt-&gt;Inherit(AsyncWrap::GetConstructorTemplate(env));</span>
<span class="line">SetConstructorFunction(context, target, &quot;TCPConnectWrap&quot;, cwt);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>以上 C++ 代码给 JS 暴露了一个 TCPConnectWrap 函数，类似 C++ 层暴露的 TCP 函数 一样，但是在 JS 层执行 new TCPConnectWrap 时不会关联到 C++ 层的某一个对象，接下来看看如何使用。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> req <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCPConnectWrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>oncomplete <span class="token operator">=</span> afterConnect<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>address <span class="token operator">=</span> address<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>port <span class="token operator">=</span> port<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>localAddress <span class="token operator">=</span> localAddress<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>localPort <span class="token operator">=</span> localPort<span class="token punctuation">;</span></span>
<span class="line"><span class="token comment">// _handle 为 new TCP 返回的对象</span></span>
<span class="line">self<span class="token punctuation">.</span>_handle<span class="token punctuation">.</span><span class="token function">connect</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> address<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token comment">// 执行完后 JS 层将失去对 TCPConnectWrap 的引用</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当发起一个 TCP 连接时，就会创建一个 TCPConnectWrap 表示一次连接请求，接着看 C++ 层 connect 的逻辑。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">ConnectWrap* req_wrap = new ConnectWrap(env, req_wrap_obj, ...);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>C++ 层首先创建了一个 ConnectWrap 对象，ConnectWrap 继承 ReqWrap，ReqWrap 继承 AsyncWrap，AsyncWrap 继承 BaseObject。所以 new ConnectWrap 就是把 JS 层传进来的 TCPConnectWrap 和 C++ 层的 ConnectWrap 关联起来，另外 ReqWrap 构造函数中有一个非常关键的操作。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T&gt;</span>
<span class="line">ReqWrap&lt;T&gt;::ReqWrap(Environment* env,</span>
<span class="line">                    v8::Local&lt;v8::Object&gt; object,</span>
<span class="line">                    ...)</span>
<span class="line">    : AsyncWrap(env, object, provider),</span>
<span class="line">      ReqWrapBase(env) {</span>
<span class="line">  MakeWeak();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>MakeWeak 用于给持久引用设置弱引用回调。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void BaseObject::MakeWeak() {</span>
<span class="line">  persistent_handle_.SetWeak(</span>
<span class="line">      this,</span>
<span class="line">      [](const WeakCallbackInfo&lt;BaseObject&gt;&amp; data) {</span>
<span class="line">        //</span>
<span class="line">      },</span>
<span class="line">      WeakCallbackType::kParameter);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>回调的逻辑我们在后面再具体分析。创建完 ConnectWrap 后，接着执行了 req_wrap-&gt;Dispatch。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">err = req_wrap-&gt;Dispatch(uv_tcp_connect,</span>
<span class="line">                         &amp;wrap-&gt;handle_,</span>
<span class="line">                         reinterpret_cast&lt;const sockaddr*&gt;(&amp;addr),</span>
<span class="line">                         AfterConnect);</span>
<span class="line">  // err &lt; 0</span>
<span class="line">  if (err) {</span>
<span class="line">      delete req_wrap;</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果 Dispatch 调用 Libuv 的 uv_tcp_connect 失败则直接删除 req_wrap， 即释放 ConnectWrap 对象的内存。ConnectWrap 析构的时候，父类 BaseObject 的 persistent_handle_ 也会析构，从而 JS 层的对象 TCPConnectWrap 将失去唯一的引用，最后被 GC。接下来再看看 Libuv 操作成功的逻辑。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">int ReqWrap&lt;T&gt;::Dispatch(LibuvFunction fn, Args... args) {</span>
<span class="line">  int err = CallLibuvFunction&lt;T, LibuvFunction&gt;::Call(</span>
<span class="line">      fn,</span>
<span class="line">      env()-&gt;event_loop(),</span>
<span class="line">      req(),</span>
<span class="line">      MakeLibuvRequestCallback&lt;T, Args&gt;::For(this, args)...);</span>
<span class="line">  // 操作成功</span>
<span class="line">  if (err &gt;= 0) {</span>
<span class="line">    ClearWeak();</span>
<span class="line">    env()-&gt;IncreaseWaitingRequestCounter();</span>
<span class="line">  }</span>
<span class="line">  return err;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里有两个关键的操作，第一个 ClearWeak，ClearWeak 是删除 ReqWrap 构造函数中设置的弱引用回调，使得 JS 层 TCPConnectWrap 对象被 ConnectWrap 的持久句柄 persistent_handle_ 引用，所以不会被 GC，否则因为连接是一个异步操作，在等待连接结果的过程中 JS 对象被 GC 会导致进程 Crash。另一个关键操作是 For 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  static void Wrapper(ReqT* req, Args... args) {</span>
<span class="line">    // BaseObjectPtr 构造函数导致 C++ 对象的引用数加一</span>
<span class="line">    BaseObjectPtr&lt;ReqWrap&lt;ReqT&gt;&gt; req_wrap{ReqWrap&lt;ReqT&gt;::from_req(req)};</span>
<span class="line">    req_wrap-&gt;Detach();</span>
<span class="line">    req_wrap-&gt;env()-&gt;DecreaseWaitingRequestCounter();</span>
<span class="line">    F original_callback = reinterpret_cast&lt;F&gt;(req_wrap-&gt;original_callback_);</span>
<span class="line">    original_callback(req, args...);</span>
<span class="line">  }</span>
<span class="line">  </span>
<span class="line">  static F For(ReqWrap&lt;ReqT&gt;* req_wrap, F v) {</span>
<span class="line">    // 保存原始回调函数</span>
<span class="line">    req_wrap-&gt;original_callback_ = reinterpret_cast&lt;typename ReqWrap&lt;ReqT&gt;::callback_t&gt;(v);</span>
<span class="line">    return Wrapper;</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>For 函数保存了原始回调，然后返回一个 Wrapper 函数，当 Libuv 回调时就会执行 Wrapper，Wrapper 中通过拿到的 C++ 对象 ReqWrap（ConnectWrap 是 ReqWrap 的子类） 定义了一个智能指针 BaseObjectPtr（ConnectWrap 引用数加一），然后调用 Detach，前面讲过 Detach 会设置一个 detach 标记，调完 Detach 后就执行真正的回调函数 original_callback，这里是 AfterConnect。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void ConnectionWrap&lt;WrapType, UVType&gt;::AfterConnect(uv_connect_t* req,</span>
<span class="line">                                                    int status) {</span>
<span class="line">  BaseObjectPtr&lt;ConnectWrap&gt; req_wrap{static_cast&lt;ConnectWrap*&gt;(req-&gt;data)};</span>
<span class="line">  // 执行 JS 回调</span>
<span class="line"> }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>AfterConnect 中也定义了一个 BaseObjectPtr，所以这时候 C++ 对象 ConnectWrap 引用数又加 1 变成 2，接着执行了 JS 层回调函数，执行完之后，Wrapper 和 AfterConnect 函数中的 BaseObjectPtr 会析构，从而 ConnectWrap 对象被析构，最终 BaseObject 的持久句柄会被析构，JS 对象失去最后一个引用而被 GC（如果该对象返回给 JS 层使用，则在 JS 层失去引用后再被 GC）。下面看一个例子。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> net <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;net&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">2000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 随便连接一个端口</span></span>
<span class="line">    net<span class="token punctuation">.</span><span class="token function">connect</span><span class="token punctuation">(</span><span class="token number">8888</span><span class="token punctuation">,</span> <span class="token string">&#39;127.0.0.1&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">&#39;error&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下图为 AfterConnect 中 BaseObjectPtr 对象析构时的调用栈。</p><p>图8-1</p><p>这时候 BaseObject 的引用数为 2，减去 1 为 1。下图为 Wrapper 函数中 BaseObjectPtr 对象析构时的调用栈。</p><p>图8-2</p><p>Wrapper 中的 BaseObjectPtr 析构后，BaseObject 的引用数为 0，所以会释放 BaseObject 的内存，从而持久句柄 persistent_handle_ 被析构，最后 JS 对象 TCPConnectWrap 被 GC。这种方式对用户是无感知的，完全由 Node.js 控制内存的使用和释放。</p><p>关联底层资源的 JS 对象的内存管理机制</p><p>正常来说，JS 对象失去引用后会直接被 V8 GC 回收，我们不需要额外关注，但是如果这个 JS 对象关联了底层的资源，比如 C++ 对象，那情况就会变得不一样了。这里以 trace_events 模块为例，我们可以通过 trace_events 的 createTracing 创建一个收集 trace event 数据的对象。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">createTracing</span><span class="token punctuation">(</span><span class="token parameter">options</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Tracing</span><span class="token punctuation">(</span>options<span class="token punctuation">.</span>categories<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">class</span> <span class="token class-name">Tracing</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token parameter">categories</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">[</span>kHandle<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">CategorySet</span><span class="token punctuation">(</span>categories<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>createTracing 中创建了一个 Tracing 对象，Tracing 对象中又创建了一个 CategorySet 对象，CategorySet 是 C++ 层导出的函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  Local&lt;FunctionTemplate&gt; category_set = NewFunctionTemplate(isolate, NodeCategorySet::New);</span>
<span class="line">  category_set-&gt;InstanceTemplate()-&gt;SetInternalFieldCount(NodeCategorySet::kInternalFieldCount);</span>
<span class="line">  category_set-&gt;Inherit(BaseObject::GetConstructorTemplate(env));</span>
<span class="line">  SetConstructorFunction(context, target, &quot;CategorySet&quot;, category_set);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>JS 执行 new CategorySet 时会执行 C++ 的 NodeCategorySet::New。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void NodeCategorySet::New(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(args);</span>
<span class="line">  // 忽略其他代码</span>
<span class="line">  new NodeCategorySet(env, args.This(), std::move(categories));</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最终创建了一个 NodeCategorySet 对象，NodeCategorySet 继承 BaseObject。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  NodeCategorySet(Environment* env,</span>
<span class="line">                  Local&lt;Object&gt; wrap,</span>
<span class="line">                  std::set&lt;std::string&gt;&amp;&amp; categories) :</span>
<span class="line">        BaseObject(env, wrap), categories_(std::move(categories)) {</span>
<span class="line">    MakeWeak();</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NodeCategorySet 默认调用了 MakeWeak，所以如果 JS 层没有变量引用 new CategorySet 返回的对象，则它会被 GC。下面看一个例子。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> trace_events <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;trace_events&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">trace_events<span class="token punctuation">.</span><span class="token function">createTracing</span><span class="token punctuation">(</span><span class="token punctuation">{</span><span class="token literal-property property">categories</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&#39;node.perf&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;node.async_hooks&#39;</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>因为 trace_events.createTracing 返回的对象没有被任何变量引用，导致 Tracing 对象中的 CategorySet 也没有被引用，从而被 GC，下面是调用栈。</p><p>图8-3</p><p>如果我们把 createTracing 返回的对象赋值给 global.demo，则不会被 GC。下面再来看一个例子。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> trace_events <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;trace_events&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> events <span class="token operator">=</span> trace_events<span class="token punctuation">.</span><span class="token function">createTracing</span><span class="token punctuation">(</span><span class="token punctuation">{</span><span class="token literal-property property">categories</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&#39;node.perf&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;node.async_hooks&#39;</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">events<span class="token punctuation">.</span><span class="token function">enable</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行 enable 后也不会被 GC，为什么呢？看看 enable 的实现。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">  <span class="token keyword">const</span> enabledTracingObjects <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SafeSet</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">  <span class="token function">enable</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 忽略其他代码</span></span>
<span class="line">    enabledTracingObjects<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>enable 会把 this 加入到了 enabledTracingObjects 变量，而 enabledTracingObjects 是一直存在的，所以 Tracing 不会被 GC。从 trace_events 的内存管理机制中可以看到，对于关联了 C++ 对象的 JS 对象，需要设置弱引用回调，这样当 JS 对象失去引用而被 GC 时，它关联的 C++ 对象才可以被释放，否则就会造成内存泄露。</p><p>基于引用数的对象的内存管理机制 刚才 trace_events 的例子中，关联了 C++ 对象的 JS 对象是直接暴露给用户的，所以只需要设置弱引用回调，然后在 JS 对象被 GC 时释放关联的 C++ 对象即可。但是如果这个 JS 对象是由 Node.js 内核管理，然后通过其他 API 来操作这个对象的话，情况又变得不一样了。接下来再以 diagnostics_channel 的代码为例看看另一种使用方式。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> channels <span class="token operator">=</span> <span class="token function">ObjectCreate</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">channel</span><span class="token punctuation">(</span><span class="token parameter">name</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> channel <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Channel</span><span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">WeakReference</span><span class="token punctuation">(</span>channel<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">return</span> channel<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们可以通过 diagnostics_channel 的 channel 函数创建一个 Channel 对象，然后以此作为订阅发布机制。当 Node.js 创建一个 Channel 对象时，它会以该 Channel 对象为参数创建一个 WeakReference 对象，然后把 WeakReference 对象保存到 channels 中，结构图如下。</p><p>图8-4</p><p>WeakReference 是 C++ 提供的对象。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">  Local&lt;FunctionTemplate&gt; weak_ref = NewFunctionTemplate(isolate, WeakReference::New);</span>
<span class="line">  weak_ref-&gt;InstanceTemplate()-&gt;SetInternalFieldCount(WeakReference::kInternalFieldCount);</span>
<span class="line">  weak_ref-&gt;Inherit(BaseObject::GetConstructorTemplate(env));</span>
<span class="line">  SetProtoMethod(isolate, weak_ref, &quot;get&quot;, WeakReference::Get);</span>
<span class="line">  SetProtoMethod(isolate, weak_ref, &quot;incRef&quot;, WeakReference::IncRef);</span>
<span class="line">  SetProtoMethod(isolate, weak_ref, &quot;decRef&quot;, WeakReference::DecRef);</span>
<span class="line">  SetConstructorFunction(context, target, &quot;WeakReference&quot;, weak_ref);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当在 JS 层执行 new WeakReference 时，就会执行 C++ 的 WeakReference::New。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void WeakReference::New(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(args);</span>
<span class="line">  // args.This() 为 JS 执行 new WeakReference 返回的对象，</span>
<span class="line">  // args[0] 为 JS 层传入的第一个参数</span>
<span class="line">  new WeakReference(env, args.This(), args[0].As&lt;Object&gt;());</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看 WeakReference 构造函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">WeakReference::WeakReference(Environment* env,</span>
<span class="line">                             Local&lt;Object&gt; object,</span>
<span class="line">                             Local&lt;Object&gt; target)</span>
<span class="line">    : WeakReference(env, object, target, 0) {}</span>
<span class="line">    </span>
<span class="line">WeakReference::WeakReference(Environment* env,</span>
<span class="line">                             Local&lt;Object&gt; object,</span>
<span class="line">                             Local&lt;Object&gt; target,</span>
<span class="line">                             uint64_t reference_count)</span>
<span class="line">    : SnapshotableObject(env, object, type_int), // </span>
<span class="line">    reference_count_(reference_count) {</span>
<span class="line">  // 如果 JS 层没有变量引用 new WeakReference 返回的对象，则释放 C++ 的 WeakReference 对象的内存</span>
<span class="line">  MakeWeak();</span>
<span class="line">  if (!target.IsEmpty()) {</span>
<span class="line">    // target_ 是持久句柄，保存对传入的 JS 对象（Channel）的引用</span>
<span class="line">    target_.Reset(env-&gt;isolate(), target);</span>
<span class="line">    if (reference_count_ == 0) {</span>
<span class="line">      // 如果只有 target_ 引用传入的 JS 对象，则该 JS 对象可以被 GC</span>
<span class="line">      target_.SetWeak();</span>
<span class="line">    }</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>WeakReference 通过 reference_count_ 字段记录了 target （JS 层传入的 Channel 对象）有多少个引用。SnapshotableObject 继承 BaseObject，用于关联 JS 的 WeakReference 和 C++ 的 WeakReference 对象。接着通过 WeakReference 的 target_ 引用 JS 层传入的对象，因为 reference_count_ 是 0，所以执行 SetWeak，表示如果只有持久句柄 target_ 引用传入的 JS 对象，则该 JS 对象可以被 GC。回到 JS 层。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">channel</span><span class="token punctuation">(</span><span class="token parameter">name</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> channel <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Channel</span><span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">WeakReference</span><span class="token punctuation">(</span>channel<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">return</span> channel<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到通过 channel 获取的 Channel 对象直接返回给用户，WeakReference 会被 channels 引用，但是存在一个问题是，如果用户没有变量引用该返回的 Channel 对象，则会导致 Channel 被 GC，例如<a href="https://github.com/nodejs/node/issues/42170" target="_blank" rel="noopener noreferrer">如下情况</a>。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> channel <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;diagnostics_channel&#39;</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">const</span> strongRef <span class="token operator">=</span> <span class="token function">channel</span><span class="token punctuation">(</span><span class="token string">&#39;strong&#39;</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">strongRef<span class="token punctuation">.</span><span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token parameter">message</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>message<span class="token punctuation">)</span> <span class="token comment">// outputs because the subscriber is still available</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token function">channel</span><span class="token punctuation">(</span><span class="token string">&#39;weak&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token parameter">message</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>message<span class="token punctuation">)</span> <span class="token comment">// no output because the subscriber was garbage collected</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token function">channel</span><span class="token punctuation">(</span><span class="token string">&#39;weak&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">publish</span><span class="token punctuation">(</span><span class="token string">&#39;weak output&#39;</span><span class="token punctuation">)</span></span>
<span class="line">  strongRef<span class="token punctuation">.</span><span class="token function">publish</span><span class="token punctuation">(</span><span class="token string">&#39;strong output&#39;</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>channel(&#39;weak&#39;) 创建了一个 Channel 对象，但是 JS 里没有地方引用返回的 Channel 对象，从而 Channel 对象被 GC，当 setTimeout 中执行 channel(&#39;weak&#39;).publish 时会重新创建一个新的 Channel，导致 pubilsh 不符合预期。这个是 Node.js 中的一个 bug，后面被修复了，修复代码如下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token parameter">name<span class="token punctuation">,</span> subscription</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> chan <span class="token operator">=</span> <span class="token function">channel</span><span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">incRef</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  chan<span class="token punctuation">.</span><span class="token function">subscribe</span><span class="token punctuation">(</span>subscription<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>修复后，需要通过 subscribe 进行订阅，subscribe 会调用 channel 函数创建一个 Channel 对象，然后执行 incRef。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void WeakReference::IncRef(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  WeakReference* weak_ref = Unwrap&lt;WeakReference&gt;(args.Holder());</span>
<span class="line">  weak_ref-&gt;reference_count_++;</span>
<span class="line">  if (weak_ref-&gt;target_.IsEmpty()) return;</span>
<span class="line">  if (weak_ref-&gt;reference_count_ == 1) weak_ref-&gt;target_.ClearWeak();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>IncRef 的逻辑很简单，就是 Channel 对象的引用数加一，并且清除弱引用设置，这样保证即使 JS 层没有变量引用该 Channel 对象，也不会被 GC。同理，当显式调用 unsubscribe 时才会导致 Channel 对象被 GC。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token parameter">name<span class="token punctuation">,</span> subscription</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> chan <span class="token operator">=</span> <span class="token function">channel</span><span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>chan<span class="token punctuation">.</span><span class="token function">unsubscribe</span><span class="token punctuation">(</span>subscription<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">  channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">decRef</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>看一下 C++ 层的 decRef。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void WeakReference::DecRef(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  WeakReference* weak_ref = Unwrap&lt;WeakReference&gt;(args.Holder());</span>
<span class="line">  weak_ref-&gt;reference_count_--;</span>
<span class="line">  if (weak_ref-&gt;target_.IsEmpty()) return;</span>
<span class="line">  if (weak_ref-&gt;reference_count_ == 0) weak_ref-&gt;target_.SetWeak();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>decRef 中判断了如果 reference_count_ 为 0，则设置 Channel 的弱引用回调，所以最终被 GC，除非用户再次调用 subscribe。这种就是基于引用计数来对对象进行内存管理的方式。</p><p>不知道大家有没有发现另一个问题，就是 WeakReference 对象什么时候被 GC？纵观 diagnostics_channel 的代码我们只看到给 channels 对象新增属性的代码，没有删除属性的代码，通过代码测试一下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> subscribe<span class="token punctuation">,</span> unsubscribe <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;diagnostics_channel&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">noop</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span><span class="token function">memoryUsage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>heapUsed<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">let</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">1000000</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token function">String</span><span class="token punctuation">(</span>i<span class="token punctuation">)</span><span class="token punctuation">,</span> noop<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token function">String</span><span class="token punctuation">(</span>i<span class="token punctuation">)</span><span class="token punctuation">,</span> noop<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span><span class="token function">memoryUsage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>heapUsed<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在 Node.js V18.9.0 中输出如下。</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">4949688</span>
<span class="line">46934032</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>可以发现尽管调用了 unsubscribe，内存还是新增了非常多，这里的确存在了一个内存泄露的问题，<a href="https://github.com/nodejs/node/pull/45633" target="_blank" rel="noopener noreferrer">相关PR</a>，修复方式如下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token parameter">name<span class="token punctuation">,</span> subscription</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> chan <span class="token operator">=</span> <span class="token function">channel</span><span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>chan<span class="token punctuation">.</span><span class="token function">unsubscribe</span><span class="token punctuation">(</span>subscription<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">  channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">decRef</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 引用数为 0 时删除该 key</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">getRef</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">delete</span> channels<span class="token punctuation">[</span>name<span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="如何使用-node-js-的内存管理机制" tabindex="-1"><a class="header-anchor" href="#如何使用-node-js-的内存管理机制"><span>如何使用 Node.js 的内存管理机制</span></a></h2><p>那么对于我们来说，这种机制有什么用处呢？Node.js 除了提供 BaseObject 管理内部对象的内存，也通过 ObjectWrap 导出了这个功能。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class ObjectWrap {</span>
<span class="line"> public:</span>
<span class="line">  ObjectWrap() {</span>
<span class="line">    refs_ = 0;</span>
<span class="line">  }</span>
<span class="line">  </span>
<span class="line">  template &lt;class T&gt;</span>
<span class="line">  static inline T* Unwrap(v8::Local&lt;v8::Object&gt; handle) {</span>
<span class="line">    void* ptr = handle-&gt;GetAlignedPointerFromInternalField(0);</span>
<span class="line">    ObjectWrap* wrap = static_cast&lt;ObjectWrap*&gt;(ptr);</span>
<span class="line">    return static_cast&lt;T*&gt;(wrap);</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  inline v8::Local&lt;v8::Object&gt; handle() {</span>
<span class="line">    return handle(v8::Isolate::GetCurrent());</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  inline v8::Local&lt;v8::Object&gt; handle(v8::Isolate* isolate) {</span>
<span class="line">    return v8::Local&lt;v8::Object&gt;::New(isolate, persistent());</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  inline v8::Persistent&lt;v8::Object&gt;&amp; persistent() {</span>
<span class="line">    return handle_;</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line"> protected:</span>
<span class="line">  inline void Wrap(v8::Local&lt;v8::Object&gt; handle) {</span>
<span class="line">    // 关联 JS 和 C++ 对象</span>
<span class="line">    handle-&gt;SetAlignedPointerInInternalField(0, this);</span>
<span class="line">    persistent().Reset(v8::Isolate::GetCurrent(), handle);</span>
<span class="line">    // 默认设置了弱引用，如果 JS 对象没有被其他变量引用则会被 GC</span>
<span class="line">    MakeWeak();</span>
<span class="line">  }</span>
<span class="line">  // 设置弱引用回调</span>
<span class="line">  inline void MakeWeak() {</span>
<span class="line">    persistent().SetWeak(this, WeakCallback, v8::WeakCallbackType::kParameter);</span>
<span class="line">  }</span>
<span class="line">  // 引用数加 1，清除弱引用回调</span>
<span class="line">  virtual void Ref() {</span>
<span class="line">    persistent().ClearWeak();</span>
<span class="line">    refs_++;</span>
<span class="line">  }</span>
<span class="line">  // 和 Ref 相反</span>
<span class="line">  virtual void Unref() {</span>
<span class="line">    if (--refs_ == 0)</span>
<span class="line">      MakeWeak();</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  int refs_;  // ro</span>
<span class="line"></span>
<span class="line"> private:</span>
<span class="line">  // 弱引用回调</span>
<span class="line">  static void WeakCallback(</span>
<span class="line">      const v8::WeakCallbackInfo&lt;ObjectWrap&gt;&amp; data) {</span>
<span class="line">    ObjectWrap* wrap = data.GetParameter();</span>
<span class="line">    // 解除引用 JS 对象</span>
<span class="line">    wrap-&gt;handle_.Reset();</span>
<span class="line">    // 释放内存</span>
<span class="line">    delete wrap;</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  // 通过持久引用保存 JS 对象，避免被 GC</span>
<span class="line">  v8::Persistent&lt;v8::Object&gt; handle_;</span>
<span class="line">};</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>ObjectWrap 为开发者提供了 JS 和 C++ 对象的生命周期管理，开发者可以继承该类，但是需要注意的是 ObjectWrap 默认设置了弱引用，如果管理的 JS 对象没有被其他变量引用则会被 GC，如果想改变这个行为，则可以主动调 Ref，有兴趣的同学可以参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/ObjectWrapper" target="_blank" rel="noopener noreferrer">这个例子</a>。</p><p>除此之外，我们还可以利用这种机制追踪 JS 对象是否被 GC。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> createHook<span class="token punctuation">,</span> AsyncResource <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;async_hooks&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> weakMap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">WeakMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token comment">// 存储被监控对象和 GC 回调的映射</span></span>
<span class="line"><span class="token keyword">const</span> gcCallbackContext <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">let</span> hooks<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">trackGC</span><span class="token punctuation">(</span><span class="token parameter">obj<span class="token punctuation">,</span> gcCallback</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>hooks<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    hooks <span class="token operator">=</span> <span class="token function">createHook</span><span class="token punctuation">(</span><span class="token punctuation">{</span></span>
<span class="line">      <span class="token function">destroy</span><span class="token punctuation">(</span><span class="token parameter">id</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span>gcCallbackContext<span class="token punctuation">[</span>id<span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">          gcCallbackContext<span class="token punctuation">[</span>id<span class="token punctuation">]</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">          <span class="token keyword">delete</span> gcCallbackContext<span class="token punctuation">[</span>id<span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">      <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">enable</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  <span class="token keyword">const</span> gcTracker <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">AsyncResource</span><span class="token punctuation">(</span><span class="token string">&#39;none&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 通过 asyncId 记录被追踪对象和 GC 回调的映射</span></span>
<span class="line">  gcCallbackContext<span class="token punctuation">[</span>gcTracker<span class="token punctuation">.</span><span class="token function">asyncId</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">]</span> <span class="token operator">=</span> gcCallback<span class="token punctuation">;</span></span>
<span class="line">  weakMap<span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span>obj<span class="token punctuation">,</span> gcTracker<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>WeakMap 的存储的是键值对，键只能是对象且 WeakMap 对该对象是弱引用，也就是说如果没有其他变量引用该对象则该对象会被 GC，并且值也会被 GC。当我们想追踪一个 JS 对象是否被 GC 时，就可以把该对象作为键保存在 WeakMap 中，再利用一个特殊的值，这个值的特殊之处在于当键被 GC 时，值也会被 GC，再通过给值设置弱引用回调得到通知，那就是说当回调被执行时，说明值被 GC 了，也就说明键被 GC 了。这个值的类型是 AsyncResource，AsyncResource 帮我们处理好了底层的事件，我们只需要通过 async_hooks 的 destroy 钩子就可以知道哪个 AsyncResource 被 GC了，从而知道哪个键被 GC了，最后执行一个回调。来看一下是如何知道 AsyncResource 对象被 GC 的。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">class</span> <span class="token class-name">AsyncResource</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token parameter">type<span class="token punctuation">,</span> opts <span class="token operator">=</span> kEmptyObject</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// ...</span></span>
<span class="line">    <span class="token function">registerDestroyHook</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token operator">...</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当创建一个 AsyncResource 对象时，默认会执行 registerDestroyHook。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class DestroyParam {</span>
<span class="line"> public:</span>
<span class="line">  double asyncId;</span>
<span class="line">  Environment* env;</span>
<span class="line">  Global&lt;Object&gt; target;</span>
<span class="line">  Global&lt;Object&gt; propBag;</span>
<span class="line">};</span>
<span class="line"></span>
<span class="line">static void RegisterDestroyHook(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  Isolate* isolate = args.GetIsolate();</span>
<span class="line">  DestroyParam* p = new DestroyParam();</span>
<span class="line">  p-&gt;asyncId = args[1].As&lt;Number&gt;()-&gt;Value();</span>
<span class="line">  p-&gt;env = Environment::GetCurrent(args);</span>
<span class="line">  // args[0] 为 JS 层的 AsyncResource 对象</span>
<span class="line">  p-&gt;target.Reset(isolate, args[0].As&lt;Object&gt;());</span>
<span class="line">  // 设置弱引用回调，p 为回调时传入的参数</span>
<span class="line">  p-&gt;target.SetWeak(p, AsyncWrap::WeakCallback, WeakCallbackType::kParameter);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RegisterDestroyHook 中创建了一个 DestroyParam 对象保存上下文，然后调用 SetWeak 设置了 JS 对象的弱引用回调，当 AsyncResource 没有被其他变量引用时就会被 GC，从而执行 AsyncWrap::WeakCallback。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void AsyncWrap::WeakCallback(const WeakCallbackInfo&lt;DestroyParam&gt;&amp; info) {</span>
<span class="line">  HandleScope scope(info.GetIsolate());</span>
<span class="line">  // 智能指针，执行完 WeakCallback 后释放堆对象 DestroyParam 内存</span>
<span class="line">  std::unique_ptr&lt;DestroyParam&gt; p{info.GetParameter()};</span>
<span class="line">  Local&lt;Object&gt; prop_bag = PersistentToLocal::Default(info.GetIsolate(),</span>
<span class="line">                                                      p-&gt;propBag);</span>
<span class="line">  Local&lt;Value&gt; val;</span>
<span class="line">  // 触发 async_hooks 的 destroy 钩子函数</span>
<span class="line">  if (val.IsEmpty() || val-&gt;IsFalse()) {</span>
<span class="line">    AsyncWrap::EmitDestroy(p-&gt;env, p-&gt;asyncId);</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>WeakCallback 中触发了 async_hooks 的 destroy 钩子，从而通过 destroy 钩子的 asyncId 就可以知道哪个 AsyncResource 对象被 GC 了，从而根据 WeakMap 的映射关系知道哪个被追踪的 JS 对象被 GC 了。我们看一个例子。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">memory</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">return</span> <span class="token operator">~</span><span class="token operator">~</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span><span class="token function">memoryUsage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>heapUsed <span class="token operator">/</span> <span class="token number">1024</span> <span class="token operator">/</span> <span class="token number">1024</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">before new Array: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span><span class="token function">memory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token interpolation-punctuation punctuation">}</span></span><span class="token string"> MB</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">let</span> key <span class="token operator">=</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token literal-property property">a</span><span class="token operator">:</span> <span class="token keyword">new</span> <span class="token class-name">Array</span><span class="token punctuation">(</span><span class="token number">1024</span> <span class="token operator">*</span> <span class="token number">1024</span> <span class="token operator">*</span> <span class="token number">10</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">let</span> key2 <span class="token operator">=</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token literal-property property">a</span><span class="token operator">:</span> <span class="token keyword">new</span> <span class="token class-name">Array</span><span class="token punctuation">(</span><span class="token number">1024</span> <span class="token operator">*</span> <span class="token number">1024</span> <span class="token operator">*</span> <span class="token number">10</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">after new Array: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span><span class="token function">memory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token interpolation-punctuation punctuation">}</span></span><span class="token string"> MB</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token function">trackGC</span><span class="token punctuation">(</span>key<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&quot;key gc&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token function">trackGC</span><span class="token punctuation">(</span>key2<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&quot;key2 gc&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">global<span class="token punctuation">.</span><span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">after gc 1: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span><span class="token function">memory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token interpolation-punctuation punctuation">}</span></span><span class="token string"> MB</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">key <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">key2 <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">global<span class="token punctuation">.</span><span class="token function">gc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">after gc 2: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span><span class="token function">memory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token interpolation-punctuation punctuation">}</span></span><span class="token string"> MB</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">before new Array: 2 MB</span>
<span class="line">after new Array: 162 MB</span>
<span class="line">after gc 1: 161 MB</span>
<span class="line">after gc 2: 1 MB</span>
<span class="line">key gc</span>
<span class="line">key2 gc</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从输出中可以看到 key 和 key2 变量被 GC 了，内存也得到了释放。</p><p>总结</p><p>内存管理是应用非常核心的部分，哪怕语言自带 GC，也不意味着我们就不需要关心内存的管理问题。本节课以 HandleWrap、ReqWrap、trace_events、diagnostics_channel 为例介绍了 Node.js 内核中多种内存管理的机制。</p><p>HandleWrap 是对 Libuv handle 的封装，所以当不再使用时，需要显式调用 close 关闭 handle，才能释放内存。 ReqWrap 是对请求的封装，是一次性的操作，发起操作到结束操作整个过程的内存管理都是由 Node.js 负责的。 trace_events 是关联了底层资源的 JS 对象，通过弱引用机制进行 JS 对象和底层资源的内存管理。 diagnostics_channel 是基于引用计数进行内存管理，底层也是使用了弱引用机。 除此之外，还介绍了 Node.js 提供的内存管理机制，包括通过 ObjectWrap 管理 JS 和 C++ 对象的生命周期和通过 AsyncResource 追踪 JS 对象是否被 GC，我们可以把他们应用到项目中。理解这些原理不仅可以加深我们对 V8 和 Node.js 的理解，同时我们在使用 V8 和 Node.js 时，也就知道如何去管理自己的内存，避免出现内存泄露或应用 Crash的问题。</p>`,125)]))}const o=s(t,[["render",l],["__file","memory.html.vue"]]),u=JSON.parse('{"path":"/nodejs/deep_into_nodejs/memory.html","title":"Node.js中js和c++对象的内存管理机制","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"Node.js 的内存管理机制","slug":"node-js-的内存管理机制","link":"#node-js-的内存管理机制","children":[]},{"level":2,"title":"如何使用 Node.js 的内存管理机制","slug":"如何使用-node-js-的内存管理机制","link":"#如何使用-node-js-的内存管理机制","children":[]}],"git":{"updatedTime":1705375577000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"nodejs/deep_into_nodejs/memory.md"}');export{o as comp,u as data};
