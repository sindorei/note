import{_ as s,c as a,f as e,o as l}from"./app-LHpjaFTr.js";const i={};function p(t,n){return l(),a("div",null,n[0]||(n[0]=[e(`<h1 id="模块加载的实现" tabindex="-1"><a class="header-anchor" href="#模块加载的实现"><span>模块加载的实现</span></a></h1><p>Node.js 中，我们只需要使用 require 就可以加载各种类型的模块，但是这个 require 到底是什么呢？它的背后到底做了什么事情？下面来详细看一下它的实现。我们从执行一个 Node.js 应用开始分析，假设我们有一个文件 demo.js，代码如下：</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>我们看一下执行 node demo.js 的过程是怎样的。在 Node.js 启动过程的课程中讲过，Node.js 启动过程中最终会执行以下代码。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>Module<span class="token punctuation">.</span><span class="token function">runMain</span><span class="token punctuation">(</span>process<span class="token punctuation">.</span>argv<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>require 是 C++ 层传入的内置 JS 模块加载器，runMain 函数在 pre_execution.js 的 initializeCJSLoader 中挂载。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">initializeCJSLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> CJSLoader <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  CJSLoader<span class="token punctuation">.</span>Module<span class="token punctuation">.</span>runMain <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/run_main&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span>executeUserEntryPoint<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们看到 runMain 是 run_main.js 模块导出的函数。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> CJSLoader <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;internal/modules/cjs/loader&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Module <span class="token punctuation">}</span> <span class="token operator">=</span> CJSLoader<span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">executeUserEntryPoint</span><span class="token punctuation">(</span><span class="token parameter">main <span class="token operator">=</span> process<span class="token punctuation">.</span>argv<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  Module<span class="token punctuation">.</span><span class="token function">_load</span><span class="token punctuation">(</span>main<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line">  </span>
<span class="line">module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span>  </span>
<span class="line">  executeUserEntryPoint  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最终执行的是 executeUserEntryPoint，入参是 process.argv[1]，process.argv[1] 就是我们要执行的 JS 文件，最后通过 Module._load 加载了demo.js。下面看一下具体的处理逻辑。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">Module<span class="token punctuation">.</span><span class="token function-variable function">_load</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">request<span class="token punctuation">,</span> parent<span class="token punctuation">,</span> isMain</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> filename <span class="token operator">=</span> Module<span class="token punctuation">.</span><span class="token function">_resolveFilename</span><span class="token punctuation">(</span>request<span class="token punctuation">,</span> parent<span class="token punctuation">,</span> isMain<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  </span>
<span class="line">  <span class="token keyword">const</span> cachedModule <span class="token operator">=</span> Module<span class="token punctuation">.</span>_cache<span class="token punctuation">[</span>filename<span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 有缓存则直接返回  </span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>cachedModule <span class="token operator">!==</span> <span class="token keyword">undefined</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">return</span> cachedModule<span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line">  <span class="token comment">// 是否是可访问的内置 JS 模块，是则返回  </span></span>
<span class="line">  <span class="token keyword">const</span> mod <span class="token operator">=</span> <span class="token function">loadNativeModule</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> request<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>mod <span class="token operator">&amp;&amp;</span> mod<span class="token punctuation">.</span>canBeRequiredByUsers<span class="token punctuation">)</span> <span class="token keyword">return</span> mod<span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 非原生 JS 模块，则新建一个 Module 表示加载的模块  </span></span>
<span class="line">  <span class="token keyword">const</span> module <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Module</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> parent<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 缓存  </span></span>
<span class="line">  Module<span class="token punctuation">.</span>_cache<span class="token punctuation">[</span>filename<span class="token punctuation">]</span> <span class="token operator">=</span> module<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">let</span> threw <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">try</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 加载</span></span>
<span class="line">    module<span class="token punctuation">.</span><span class="token function">load</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    threw <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 加载失败则删除缓存，避免内存泄露</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span>threw<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token keyword">delete</span> Module<span class="token punctuation">.</span>_cache<span class="token punctuation">[</span>filename<span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  <span class="token comment">// 加载中设置了 module.exports 的值，这里返回</span></span>
<span class="line">  <span class="token keyword">return</span> module<span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>_load 函数主要是 3 个逻辑：</p><p>判断是否有缓存，有则返回； 没有缓存，则判断是否是原生 JS 模块，是则交给原生模块处理； 不是原生模块，则新建一个 Module 表示用户的 JS 模块，然后执行 load 函数加载。 这里我们只需要关注 3 的逻辑，在 Node.js 中，用户定义的模块使用 Module 表示，也就是我们在代码里使用的 module 对象，比如我们经常使用 module.exports 导出模块的功能。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">Module</span><span class="token punctuation">(</span>id <span class="token operator">=</span> <span class="token string">&#39;&#39;</span><span class="token punctuation">,</span> parent<span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token comment">// 模块对应的文件路径  </span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>id <span class="token operator">=</span> id<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>path <span class="token operator">=</span> path<span class="token punctuation">.</span><span class="token function">dirname</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 在模块里使用的 exports 变量  </span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>parent <span class="token operator">=</span> parent<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 加入父模块的 children 队列  </span></span>
<span class="line">  <span class="token function">updateChildren</span><span class="token punctuation">(</span>parent<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>filename <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 是否已经加载  </span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>loaded <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>children <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看一下 load 函数的逻辑。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token class-name">Module</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span><span class="token function-variable function">load</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>filename <span class="token operator">=</span> filename<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 根据文件名找到拓展名  </span></span>
<span class="line">  <span class="token keyword">const</span> extension <span class="token operator">=</span> <span class="token function">findLongestRegisteredExtension</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 根据拓展名使用不同的加载方式  </span></span>
<span class="line">  Module<span class="token punctuation">.</span>_extensions<span class="token punctuation">[</span>extension<span class="token punctuation">]</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> filename<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span>loaded <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Node.js 会根据不同的文件拓展名使用不同的函数处理。_extensions 有 3 种，分别是 json、js、node（Addon 模块）。</p><p>JSON 模块 加载 JSON 模块是比较简单的，直接读取 JSON 文件的内容，然后解析成对象就行。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">Module<span class="token punctuation">.</span>_extensions<span class="token punctuation">[</span><span class="token string">&#39;.json&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">module<span class="token punctuation">,</span> filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> content <span class="token operator">=</span> fs<span class="token punctuation">.</span><span class="token function">readFileSync</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> <span class="token string">&#39;utf8&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  </span>
<span class="line">  <span class="token keyword">try</span> <span class="token punctuation">{</span>  </span>
<span class="line">    module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token function">JSONParse</span><span class="token punctuation">(</span><span class="token function">stripBOM</span><span class="token punctuation">(</span>content<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span>err<span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    err<span class="token punctuation">.</span>message <span class="token operator">=</span> filename <span class="token operator">+</span> <span class="token string">&#39;: &#39;</span> <span class="token operator">+</span> err<span class="token punctuation">.</span>message<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">throw</span> err<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>用户 JS 模块 用户 JS 模块就是我们自己实现的 JS 代码，而不是 Node.js 内置的 JS 代码。用户 JS 模块的处理函数如下。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">Module<span class="token punctuation">.</span>_extensions<span class="token punctuation">[</span><span class="token string">&#39;.js&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">module<span class="token punctuation">,</span> filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> content <span class="token operator">=</span> fs<span class="token punctuation">.</span><span class="token function">readFileSync</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> <span class="token string">&#39;utf8&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  module<span class="token punctuation">.</span><span class="token function">_compile</span><span class="token punctuation">(</span>content<span class="token punctuation">,</span> filename<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先同步从硬盘中读取文件内容到内存中，读完文件的内容后，接着执行 _compile 函数。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token class-name">Module</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span><span class="token function-variable function">_compile</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">content<span class="token punctuation">,</span> filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token comment">// 生成一个函数  </span></span>
<span class="line">  <span class="token keyword">const</span> compiledWrapper <span class="token operator">=</span> <span class="token function">wrapSafe</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> content<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">const</span> dirname <span class="token operator">=</span> path<span class="token punctuation">.</span><span class="token function">dirname</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 模块里使用的 require 函数，用于加载其他模块（用户 JS 和内置 JS 模块）</span></span>
<span class="line">  <span class="token keyword">const</span> <span class="token function-variable function">require</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">path</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">      <span class="token comment">// this.require是对 _load 函数的封装 </span></span>
<span class="line">      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">require</span><span class="token punctuation">(</span>path<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">let</span> result<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 我们平时使用的 exports 变量</span></span>
<span class="line">  <span class="token keyword">const</span> exports <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">const</span> thisValue <span class="token operator">=</span> exports<span class="token punctuation">;</span> </span>
<span class="line">  <span class="token comment">// 我们平时使用的 module 变量 </span></span>
<span class="line">  <span class="token keyword">const</span> module <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token comment">// 执行函数  </span></span>
<span class="line">  result <span class="token operator">=</span> <span class="token function">compiledWrapper</span><span class="token punctuation">.</span><span class="token function">call</span><span class="token punctuation">(</span>thisValue<span class="token punctuation">,</span></span>
<span class="line">                                exports<span class="token punctuation">,</span> </span>
<span class="line">                                require<span class="token punctuation">,</span> </span>
<span class="line">                                module<span class="token punctuation">,</span> </span>
<span class="line">                                filename<span class="token punctuation">,</span> </span>
<span class="line">                                dirname<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">return</span> result<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>_compile 首先通过 wrapSafe 编译需要加载的 JS 代码。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">wrapSafe</span><span class="token punctuation">(</span><span class="token parameter">filename<span class="token punctuation">,</span> content<span class="token punctuation">,</span> cjsModuleInstance</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>    </span>
<span class="line">    compiled <span class="token operator">=</span> <span class="token function">compileFunction</span><span class="token punctuation">(</span></span>
<span class="line">      <span class="token comment">// 要执行的代码</span></span>
<span class="line">      content<span class="token punctuation">,</span></span>
<span class="line">      <span class="token comment">// 对应的文件</span></span>
<span class="line">      filename<span class="token punctuation">,</span></span>
<span class="line">      <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token keyword">undefined</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token boolean">false</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token keyword">undefined</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token comment">// 形参</span></span>
<span class="line">      <span class="token punctuation">[</span></span>
<span class="line">        <span class="token string">&#39;exports&#39;</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">&#39;require&#39;</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">&#39;module&#39;</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">&#39;__filename&#39;</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">&#39;__dirname&#39;</span><span class="token punctuation">,</span></span>
<span class="line">      <span class="token punctuation">]</span></span>
<span class="line">    <span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>    </span>
<span class="line">   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>compileFunction 是 C++ 层提供的函数，主要是对 V8 CompileFunctionInContext 的封装。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void ContextifyContext::CompileFunction(</span>
<span class="line">    const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(args);</span>
<span class="line">  Isolate* isolate = env-&gt;isolate();</span>
<span class="line">  Local&lt;Context&gt; context = env-&gt;context();</span>
<span class="line"></span>
<span class="line">  // 要执行的代码</span>
<span class="line">  Local&lt;String&gt; code = args[0].As&lt;String&gt;();</span>
<span class="line"></span>
<span class="line">  // 对应的文件</span>
<span class="line">  Local&lt;String&gt; filename = args[1].As&lt;String&gt;();</span>
<span class="line">  </span>
<span class="line">  // 忽略其他参数的处理</span>
<span class="line">  </span>
<span class="line">  // 形参</span>
<span class="line">  Local&lt;Array&gt; params_buf;</span>
<span class="line">  if (!args[8]-&gt;IsUndefined()) {</span>
<span class="line">    params_buf = args[8].As&lt;Array&gt;();</span>
<span class="line">  }</span>
<span class="line">  // 代码的元信息</span>
<span class="line">  ScriptOrigin origin(filename, ...);</span>
<span class="line"></span>
<span class="line">  ScriptCompiler::Source source(code, origin, cached_data);</span>
<span class="line">  </span>
<span class="line">  // 形参</span>
<span class="line">  std::vector&lt;Local&lt;String&gt;&gt; params;</span>
<span class="line">  if (!params_buf.IsEmpty()) {</span>
<span class="line">    for (uint32_t n = 0; n &lt; params_buf-&gt;Length(); n++) {</span>
<span class="line">      Local&lt;Value&gt; val;</span>
<span class="line">      if (!params_buf-&gt;Get(context, n).ToLocal(&amp;val)) return;</span>
<span class="line">      params.push_back(val.As&lt;String&gt;());</span>
<span class="line">    }</span>
<span class="line">  }</span>
<span class="line"></span>
<span class="line">  Local&lt;ScriptOrModule&gt; script;</span>
<span class="line">  // 编译代码执行</span>
<span class="line">  MaybeLocal&lt;Function&gt; maybe_fn = ScriptCompiler::CompileFunctionInContext(</span>
<span class="line">      parsing_context, &amp;source, params.size(), params.data(),</span>
<span class="line">      context_extensions.size(), context_extensions.data(), options,</span>
<span class="line">      v8::ScriptCompiler::NoCacheReason::kNoCacheNoReason, &amp;script);</span>
<span class="line">  // 返回一个函数，函数里面的代码是传入的 code</span>
<span class="line">  Local&lt;Function&gt; fn = maybe_fn.ToLocalChecked();</span>
<span class="line">  // 最终返回这个函数的信息</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>CompileFunction 返回类似以下函数。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">fn</span><span class="token punctuation">(</span><span class="token parameter">exports<span class="token punctuation">,</span> require<span class="token punctuation">,</span> module<span class="token punctuation">,</span> __filename<span class="token punctuation">,</span> __dirname</span><span class="token punctuation">)</span> <span class="token punctuation">{</span> </span>
<span class="line">  <span class="token comment">// code</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着传入实参并执行这个函数，可以看到一共有五个参数，exports 和 module 就是我们在代码里经常用来导出模块内容的变量，module 是一个 Module 对象，exports 是 module 的属性，另外还有一个参数是 require，从这可以看到为什么我们在代码里没有定义 require 但是却可以使用，这个 require 函数就是从参数里来的，而不是全局变量。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token class-name">Module</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span><span class="token function-variable function">require</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">id</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">   requireDepth<span class="token operator">++</span><span class="token punctuation">;</span>  </span>
<span class="line">   <span class="token keyword">try</span> <span class="token punctuation">{</span>  </span>
<span class="line">     <span class="token keyword">return</span> Module<span class="token punctuation">.</span><span class="token function">_load</span><span class="token punctuation">(</span>id<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token comment">/* isMain */</span> <span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">   <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>  </span>
<span class="line">     requireDepth<span class="token operator">--</span><span class="token punctuation">;</span>  </span>
<span class="line">   <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>require 是对 Module._load 的封装，这就意味着我们在代码里可以通过 require 加载用户 JS 和内置 JS 模块。最终执行以下代码。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token punctuation">(</span><span class="token keyword">function</span> <span class="token punctuation">(</span><span class="token parameter">exports<span class="token punctuation">,</span> require<span class="token punctuation">,</span> module<span class="token punctuation">,</span> __filename<span class="token punctuation">,</span> __dirname</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token comment">// 可以 require 其他模块</span></span>
<span class="line">  module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当执行require加载模块时，又回到了我们前面分析的这个过程，整体流程如下。 tu 9-4</p><h2 id="addon-模块" tabindex="-1"><a class="header-anchor" href="#addon-模块"><span>Addon 模块</span></a></h2><p>接着看 Addon 模块的加载，Addon 模块本质上是动态链接库，所以我们先看看如何创建和使用一个动态链接库，代码可以参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/dynamic_library" target="_blank" rel="noopener noreferrer">这里</a>。首先创建一个 library.c 文件。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token keyword">int</span> <span class="token function">add</span><span class="token punctuation">(</span><span class="token keyword">int</span> a<span class="token punctuation">,</span> <span class="token keyword">int</span> b<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">return</span> a <span class="token operator">+</span> b<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>library.c 定义里一个 add 函数，然后使用以下命令编译成动态链接库。</p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh" data-title="sh"><pre><code><span class="line">gcc <span class="token parameter variable">-fPIC</span> <span class="token parameter variable">-shared</span> library.c <span class="token parameter variable">-o</span> liblibrary.so</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>接着写一个测试函数动态打开并使用该动态链接库。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h&gt;</span>  </span></span>
<span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h&gt;</span>  </span></span>
<span class="line"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;dlfcn.h&gt;</span></span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">typedef</span> <span class="token keyword">int</span><span class="token punctuation">(</span><span class="token operator">*</span>fn<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">,</span> <span class="token keyword">int</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token comment">// 打开一个动态链接库，拿到一个 handler  </span></span>
<span class="line">    <span class="token keyword">void</span> <span class="token operator">*</span> handler <span class="token operator">=</span> <span class="token function">dlopen</span><span class="token punctuation">(</span><span class="token string">&quot;liblibrary.so&quot;</span><span class="token punctuation">,</span>RTLD_LAZY<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token comment">// 取出动态链接库里的函数 add  </span></span>
<span class="line">    <span class="token keyword">void</span> <span class="token operator">*</span> add <span class="token operator">=</span> <span class="token function">dlsym</span><span class="token punctuation">(</span>handler<span class="token punctuation">,</span> <span class="token string">&quot;add&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token comment">// 执行  </span></span>
<span class="line">    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;%d&quot;</span><span class="token punctuation">,</span><span class="token punctuation">(</span><span class="token punctuation">(</span>fn<span class="token punctuation">)</span>add<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token function">dlclose</span><span class="token punctuation">(</span>handler<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行 gcc main.c -o main &amp;&amp; ./main 后我们可以看到输出 2。每次调 dlopen 动态链接库的引用数会加一，引用数大于 0 时再调用 dlopen 不会再执行动态链接库的初始化函数，并且拿到的 handler 地址是一样的。每次 dlclose 会减一，如果引用数为 0 再调用 dlopen 则会重新执行动态链接库的初始化函数，并且 handler 对应的地址可能是不一样的，更多例子参考这里。</p><p>了解动态链接库的使用后，我们来看一下 Node.js 中几个和 Addon 相关的数据结构。先看看 binding::DLib 这个类。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class DLib {  </span>
<span class="line"> public:  </span>
<span class="line">  static const int kDefaultFlags = RTLD_LAZY;  </span>
<span class="line">  DLib(const char* filename, int flags);  </span>
<span class="line">  // 打开 / 关闭一个动态链接库</span>
<span class="line">  bool Open();  </span>
<span class="line">  void Close();  </span>
<span class="line">  // 根据名字获取动态链接库中的函数地址</span>
<span class="line">  void* GetSymbolAddress(const char* name);</span>
<span class="line">  // 模块名</span>
<span class="line">  const std::string filename_;  </span>
<span class="line">  // 打开动态链接库时传入的 flags</span>
<span class="line">  const int flags_;  </span>
<span class="line">  std::string errmsg_;</span>
<span class="line">  // 动态链接库的信息  </span>
<span class="line">  void* handle_;  </span>
<span class="line">  uv_lib_t lib_;  </span>
<span class="line">};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>DLib 负责管理一个动态链接库，包括打开、关闭和获取某个函数的地址等。接着看一下 node_module。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">struct node_module {</span>
<span class="line">  int nm_version;</span>
<span class="line">  // 模块属性，比如类型</span>
<span class="line">  unsigned int nm_flags;</span>
<span class="line">  // 打开动态链接库时返回的 handler</span>
<span class="line">  void* nm_dso_handle;</span>
<span class="line">  // 文件</span>
<span class="line">  const char* nm_filename;</span>
<span class="line">  // 钩子函数，不同钩子不同的签名格式</span>
<span class="line">  node::addon_register_func nm_register_func;</span>
<span class="line">  node::addon_context_register_func nm_context_register_func;</span>
<span class="line">  // 模块名</span>
<span class="line">  const char* nm_modname;</span>
<span class="line">  // 根据模块类型自定义的数据结构</span>
<span class="line">  void* nm_priv;</span>
<span class="line">  struct node_module* nm_link;</span>
<span class="line">};</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>node_module 是表示 C++ 模块的数据结构，比如内置 C++ 模块和 Addon 模块。其中 Addon 模块可以通过原生（struct node_module）和 NAPI 方式定义（struct napi_module），原生方式是直接面向 V8 和 Libuv 编程，需要考虑所使用 API 的兼容性问题，如果是源码分发，用户安装时需要有相应的环境，如果是预构建分发，我们通常需要为多个操作系统和多个 Node.js 提供相应的版本，所以我们尽量使用 NAPI 来写 Addon ，并根据操作系统提供预构建版本。</p><p>先看一下原生的定义方式，第一种方式如下。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Init(v8::Local&lt;v8::Object&gt; exports) {}</span>
<span class="line"></span>
<span class="line">NODE_MODULE(hello, Init)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NODE_MODULE 展开如下：</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"> #define NODE_MODULE(modname, regfunc)  \\</span>
<span class="line">     NODE_MODULE_X(modname, regfunc, NULL, 0)</span>
<span class="line">     </span>
<span class="line"> #define NODE_MODULE_X(modname, regfunc, priv, flags)                  \\</span>
<span class="line"> static node::node_module _module =                                \\</span>
<span class="line">    {                                                                 \\</span>
<span class="line">      NODE_MODULE_VERSION,                                            \\</span>
<span class="line">      flags,                                                          \\</span>
<span class="line">      NULL,              \\</span>
<span class="line">      __FILE__,             \\                                         \\</span>
<span class="line">      (node::addon_register_func) (regfunc), /* Init 函数 */           \\</span>
<span class="line">      NULL,               \\</span>
<span class="line">      NODE_STRINGIFY(modname),                                        \\</span>
<span class="line">      priv,                                                           \\</span>
<span class="line">      NULL                   \\</span>
<span class="line">    };                                                                \\</span>
<span class="line">    static void _register_modname(void) __attribute__((constructor)); \\                      \\</span>
<span class="line">    static void _register_modname(void)  {                            \\</span>
<span class="line">      node_module_register(&amp;_module);                                 \\</span>
<span class="line">    }                                                                 \\</span>
<span class="line">  }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这种方式定义了一个 node_module 和一个 _register_modname（modname 由用户定义） 函数，__attribute((constructor)) 说明加载动态链接库时会执行该函数，也就是说这个函数会在我们 require 时被执行，下面再详细分析 _register_modname 的逻辑。另外需要注意的是，通过 NODE_MODULE 方式定义的 Addon 是只能被加载一次，除非关闭后重新打开。使用场景如下</p><p>如果先在主线程里加载该 Addon，则不能再在子线程里加载。 如果先在子线程里加载该 Addon，则不能再在主线程和其他子线程里加载，除非打开该 Addon 的子线程退出。 否则会提示 Module did not self-register 错误，当碰到这个错误时，很多同学可能不知道具体原因，其实从错误提示中，我们也的确看不出是什么原因。这也是看源码的一个好处，我们通过分析源码知道这个错误具体的原因。看一下下面的例子，当我们以以下方式加载一个通过 NODE_MODULE 定义的 addon 时，就会触发这个 Module did not self-register 错误，如果单独加载则正常，为什么呢？下面的内容会详细讲解。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Worker<span class="token punctuation">,</span> isMainThread <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;worker_threads&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">if</span> <span class="token punctuation">(</span>isMainThread<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;addon&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">new</span> <span class="token class-name">Worker</span><span class="token punctuation">(</span>__filename<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;addon&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果我们想要定一个在主线程和子线程里都可以加载的 Addon，则需要定义一个 Context-aware Addon，具体可以参考 <a href="https://nodejs.org/dist/latest-v19.x/docs/api/addons.html#context-aware-addons" target="_blank" rel="noopener noreferrer">Node.js 文档</a>，下面看一下定义方式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Initialize(</span>
<span class="line">  Local&lt;Object&gt; exports,</span>
<span class="line">  Local&lt;Value&gt; module,</span>
<span class="line">  Local&lt;Context&gt; context</span>
<span class="line">) {</span>
<span class="line">  </span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>宏展开后如下：</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">#define NODE_MODULE_CONTEXT_AWARE(modname, regfunc)                   \\</span>
<span class="line">  NODE_MODULE_CONTEXT_AWARE_X(modname, regfunc, NULL, 0)</span>
<span class="line">  </span>
<span class="line">  </span>
<span class="line">#define NODE_MODULE_CONTEXT_AWARE_X(modname, regfunc, priv, flags)    \\</span>
<span class="line">  extern &quot;C&quot; {                                                        \\</span>
<span class="line">    static node::node_module _module =                                \\</span>
<span class="line">    {                                                                 \\</span>
<span class="line">      NODE_MODULE_VERSION,                                            \\</span>
<span class="line">      flags,                                                          \\</span>
<span class="line">      NULL,  /* NOLINT (readability/null_usage) */                    \\</span>
<span class="line">      __FILE__,                                                       \\</span>
<span class="line">      NULL,  /* NOLINT (readability/null_usage) */                    \\</span>
<span class="line">      (node::addon_context_register_func) (regfunc),                  \\</span>
<span class="line">      NODE_STRINGIFY(modname),                                        \\</span>
<span class="line">      priv,                                                           \\</span>
<span class="line">      NULL  /* NOLINT (readability/null_usage) */                     \\</span>
<span class="line">    };                                                                \\</span>
<span class="line">    NODE_C_CTOR(_register_ ## modname) {                              \\</span>
<span class="line">      node_module_register(&amp;_module);                                 \\</span>
<span class="line">    }                                                                 \\</span>
<span class="line">  }    </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这种也是定义了一个 node_module 和 _register_modname 函数，区别是设置的钩子函数是 addon_context_register_func，而不是 addon_register_func。继续看下一种定义方式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Hello(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  </span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">NODE_MODULE_INIT(/*exports, module, context*/) {</span>
<span class="line">  NODE_SET_METHOD(exports, &quot;hello&quot;, Hello);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>宏展开后如下。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">#define NODE_MODULE_INIT()                                            \\</span>
<span class="line">  extern &quot;C&quot; NODE_MODULE_EXPORT void                                  \\</span>
<span class="line">  NODE_MODULE_INITIALIZER(v8::Local&lt;v8::Object&gt; exports,              \\</span>
<span class="line">                          v8::Local&lt;v8::Value&gt; module,                \\</span>
<span class="line">                          v8::Local&lt;v8::Context&gt; context);            \\</span>
<span class="line">  NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME,                     \\</span>
<span class="line">                            NODE_MODULE_INITIALIZER)                  \\</span>
<span class="line">  void NODE_MODULE_INITIALIZER(v8::Local&lt;v8::Object&gt; exports,         \\</span>
<span class="line">                               v8::Local&lt;v8::Value&gt; module,           \\</span>
<span class="line">                               v8::Local&lt;v8::Context&gt; context)</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再次展开。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">extern &quot;C&quot; __attribute__((visibility(&quot;default&quot;))) void</span>
<span class="line">node_register_module_vNODE_MODULE_VERSION(Local&lt;Object&gt; exports,</span>
<span class="line">                        Local&lt;Value&gt; module,</span>
<span class="line">                        Local&lt;Context&gt; context);</span>
<span class="line">  extern &quot;C&quot; {                                                        \\</span>
<span class="line">    static node::node_module _module =                                \\</span>
<span class="line">    {                                                                 \\</span>
<span class="line">      NODE_MODULE_VERSION,                                            \\</span>
<span class="line">      flags,                                                          \\</span>
<span class="line">      NULL,  /* NOLINT (readability/null_usage) */                    \\</span>
<span class="line">      __FILE__,                                                       \\</span>
<span class="line">      NULL,                                                           \\</span>
<span class="line">       /* node_register_module_vNODE_MODULE_VERSION */                \\</span>
<span class="line">      (node::addon_context_register_func) (regfunc),                  \\</span>
<span class="line">      NODE_STRINGIFY(modname),                                        \\</span>
<span class="line">      priv,                                                           \\</span>
<span class="line">      NULL  /* NOLINT (readability/null_usage) */                     \\</span>
<span class="line">    };                                                                \\</span>
<span class="line">    NODE_C_CTOR(_register_ ## modname) {                              \\</span>
<span class="line">      node_module_register(&amp;_module);                                 \\</span>
<span class="line">    }                                                                 \\</span>
<span class="line">  }  </span>
<span class="line">  </span>
<span class="line">node_register_module_vNODE_MODULE_VERSION(Local&lt;Object&gt; exports,</span>
<span class="line">                        Local&lt;Value&gt; module,</span>
<span class="line">                        Local&lt;Context&gt; context) {</span>
<span class="line">  NODE_SET_METHOD(exports, &quot;hello&quot;, Hello);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这种方式和前面一种类似，只是函数名格式不一样（从 _register_modname 变成 node_register_module_vNODE_MODULE_VERSION）。继续看下一种定义方式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">extern &quot;C&quot; NODE_MODULE_EXPORT void</span>
<span class="line">NODE_MODULE_INITIALIZER(Local&lt;Object&gt; exports,</span>
<span class="line">                        Local&lt;Value&gt; module,</span>
<span class="line">                        Local&lt;Context&gt; context) {</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>宏展开后如下。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">extern &quot;C&quot; __attribute__((visibility(&quot;default&quot;))) void</span>
<span class="line">node_register_module_vNODE_MODULE_VERSION(Local&lt;Object&gt; exports,</span>
<span class="line">                        Local&lt;Value&gt; module,</span>
<span class="line">                        Local&lt;Context&gt; context) {</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这种方式不需要定义 node_module 数据结构，而是通过显式定义一个node_register_module_vxxx 函数并导出来告诉 Node.js 该 Addon 的初始化函数，其中 NODE_MODULE_VERSION 随着 Node.js 的大版本变化，Node.js 加载 Addon 时会执行该函数，下面会具体分析。对于 Context-aware Addon 的定义我们随便选一种方式就可以了。</p><p>接着看通过 NAPI Addon 的定义方式，NAPI 的好处是 ABI 兼容的，我们编写的代码可跨 Node.js 的大版本运行。NAPI 方式定义的 Addon 有自己的数据结构 napi_module。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">typedef struct {</span>
<span class="line">  int nm_version;</span>
<span class="line">  unsigned int nm_flags;</span>
<span class="line">  const char* nm_filename;</span>
<span class="line">  napi_addon_register_func nm_register_func;</span>
<span class="line">  const char* nm_modname;</span>
<span class="line">  void* nm_priv;</span>
<span class="line">  void* reserved[4];</span>
<span class="line">} napi_module;</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>先看第一种定义方式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">napi_value Init(napi_env env, napi_value exports) {}</span>
<span class="line">NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>这是个宏定义，宏展开后如下。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">#define NAPI_MODULE(modname, regfunc) \\    </span>
<span class="line">  NAPI_MODULE_X(modname, regfunc, NULL, 0)    </span>
<span class="line">  </span>
<span class="line">#define NAPI_MODULE_X(modname, regfunc, priv, flags)                  \\    </span>
<span class="line">   static napi_module _module = \\    </span>
<span class="line">   {                  \\    </span>
<span class="line">     NAPI_MODULE_VERSION, \\    </span>
<span class="line">     flags,          \\    </span>
<span class="line">     __FILE__,        \\   </span>
<span class="line">     // nm_register_func \\ </span>
<span class="line">     regfunc,        \\    </span>
<span class="line">     #modname,        \\    </span>
<span class="line">     priv,            \\    </span>
<span class="line">     {0},            \\    </span>
<span class="line">   };                \\    </span>
<span class="line">   static void _register_modname(void) __attribute__((constructor)); \\    </span>
<span class="line">   static void _register_modname(void)      {    \\    </span>
<span class="line">     napi_module_register(&amp;_module);  \\    </span>
<span class="line">   }      </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>通过 NAPI_MODULE 定义的 Addon，定义了一个 napi_module 结构体和 _register_modname 函数，并且 _register_modname 里调用的是 napi_module_register 而不是 node_module_register，不过 napi_module_register 里最终还是会调用 node_module_register。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void napi_module_register(napi_module* mod) {</span>
<span class="line">  node::node_module* nm = new node::node_module {</span>
<span class="line">    -1,</span>
<span class="line">    mod-&gt;nm_flags | NM_F_DELETEME,</span>
<span class="line">    nullptr,</span>
<span class="line">    mod-&gt;nm_filename,</span>
<span class="line">    nullptr,</span>
<span class="line">    // addon_context_register_func</span>
<span class="line">    napi_module_register_cb,</span>
<span class="line">    mod-&gt;nm_modname,</span>
<span class="line">    mod,  // 保存 napi_module 结构体</span>
<span class="line">    nullptr,</span>
<span class="line">  };</span>
<span class="line">  node::node_module_register(nm);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看另一种 NAPI Addon 定义方式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">NAPI_MODULE_INIT() {</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">#define NAPI_MODULE_INIT()                                            \\</span>
<span class="line">  EXTERN_C_START                                                      \\</span>
<span class="line">  NAPI_MODULE_EXPORT napi_value                                       \\</span>
<span class="line">  NAPI_MODULE_INITIALIZER(napi_env env, napi_value exports);          \\</span>
<span class="line">  EXTERN_C_END                                                        \\</span>
<span class="line">  NAPI_MODULE(NODE_GYP_MODULE_NAME, NAPI_MODULE_INITIALIZER)          \\</span>
<span class="line">  napi_value NAPI_MODULE_INITIALIZER(napi_env env, napi_value exports)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">extern &quot;C&quot; __attribute__((visibility(&quot;default&quot;))) napi_value</span>
<span class="line">napi_register_module_vNAPI_MODULE_VERSION(napi_env env, napi_value exports);</span>
<span class="line"></span>
<span class="line">static napi_module _module = \\    </span>
<span class="line">   {                  \\    </span>
<span class="line">     NAPI_MODULE_VERSION, \\    </span>
<span class="line">     flags,          \\    </span>
<span class="line">     __FILE__,        \\   </span>
<span class="line">     // nm_register_func \\ </span>
<span class="line">     napi_register_module_vNAPI_MODULE_VERSION,        \\    </span>
<span class="line">     #modname,        \\    </span>
<span class="line">     priv,            \\    </span>
<span class="line">     {0},            \\    </span>
<span class="line">   };                \\</span>
<span class="line">                  \\    </span>
<span class="line">static void _register_modname(void) __attribute__((constructor)); \\    </span>
<span class="line">static void _register_modname(void)      {    \\    </span>
<span class="line"> napi_module_register(&amp;_module);  \\    </span>
<span class="line">}   </span>
<span class="line">      </span>
<span class="line">napi_value napi_register_module_vNAPI_MODULE_VERSION(napi_env env, napi_value exports)</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这种方式和第一种是类似的，区别是函数的名字格式不一样，由用户定义的函数变成 napi_register_module_vNAPI_MODULE_VERSION，相当于 Node.js 帮起了名字。另外 NAPI 定义的 Addon 都是 Context-aware 的。</p><p>定义的方式很多，但是总结下来，第一种是导出一个函数，第二种是在打开动态链接库时注册执行 一个函数，另外 NODE_MODULE 定义的是 nm_register_func 钩子，其他定义方式定义的是 addon_context_register_func 钩子。接着看一下 Node.js 里是如何处理的，我们从加载 .node 模块的源码开始看。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">Module<span class="token punctuation">.</span>_extensions<span class="token punctuation">[</span><span class="token string">&#39;.node&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">module<span class="token punctuation">,</span> filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token comment">// ...  </span></span>
<span class="line">  <span class="token keyword">return</span> process<span class="token punctuation">.</span><span class="token function">dlopen</span><span class="token punctuation">(</span>module<span class="token punctuation">,</span> path<span class="token punctuation">.</span><span class="token function">toNamespacedPath</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>直接调了 process.dlopen，该函数在 node.js 里定义</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">const rawMethods = internalBinding(&#39;process_methods&#39;);  </span>
<span class="line">process.dlopen = rawMethods.dlopen;  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>找到 process_methods 模块对应的是 node_process_methods.cc。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">env-&gt;SetMethod(target, &quot;dlopen&quot;, binding::DLOpen);  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>继续分析刚才看到的 DLOpen 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void DLOpen(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  </span>
<span class="line">  int32_t flags = DLib::kDefaultFlags;</span>
<span class="line">  // 模块名</span>
<span class="line">  node::Utf8Value filename(env-&gt;isolate(), args[1]);  </span>
<span class="line">  // 加载并执行回调</span>
<span class="line">  env-&gt;TryLoadAddon(*filename, flags, [&amp;](DLib* dlib) {  </span>
<span class="line">    // ... </span>
<span class="line">  });  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看 TryLoadAddon 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline void Environment::TryLoadAddon(</span>
<span class="line">    const char* filename,</span>
<span class="line">    int flags,</span>
<span class="line">    const std::function&lt;bool(binding::DLib*)&gt;&amp; was_loaded) {</span>
<span class="line">  // std::list&lt;binding::DLib&gt; loaded_addons_;</span>
<span class="line">  // 创建一个 DLib 对象</span>
<span class="line">  loaded_addons_.emplace_back(filename, flags);</span>
<span class="line">  // loaded_addons_.back() 拿到上面创建的 DLib 对象</span>
<span class="line">  if (!was_loaded(&amp;loaded_addons_.back())) {</span>
<span class="line">    loaded_addons_.pop_back();</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>TryLoadAddon 创建了一个 binding::DLib 对象，接着以此对象为入参执行传入的函数，接着看 TryLoadAddon 里执行的函数，里面代码比较多，我们分开讲。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"> env-&gt;TryLoadAddon(*filename, flags, [&amp;](DLib* dlib) {  </span>
<span class="line">    const bool is_opened = dlib-&gt;Open();</span>
<span class="line"> }); </span>
<span class="line">   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先通过 dlib-&gt;Open() 打开动态链接库。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">bool DLib::Open() {  </span>
<span class="line">  handle_ = dlopen(filename_.c_str(), flags_);  </span>
<span class="line">  if (handle_ != nullptr) return true;  </span>
<span class="line">  errmsg_ = dlerror();  </span>
<span class="line">  return false;  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>刚才讲过，Addon 主要是两种定义方式，第一种是定义了一个打开链接库时执行 _register_modname 函数，第二种是导出了一个函数。我们看一下 _register_modname 做了什么事情，对于原生方式定义的 Addon，_register_modname 里执行了 node_module_register，对于 NAPI 定义的 Addon，_register_modname 里执行了 napi_module_register。我们只分析最长路径的情况：napi_module_register。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void napi_module_register(napi_module* mod) {</span>
<span class="line">  node::node_module* nm = new node::node_module {</span>
<span class="line">    -1,</span>
<span class="line">    mod-&gt;nm_flags | NM_F_DELETEME,</span>
<span class="line">    nullptr,</span>
<span class="line">    mod-&gt;nm_filename,</span>
<span class="line">    nullptr,</span>
<span class="line">    // addon_context_register_func</span>
<span class="line">    napi_module_register_cb,</span>
<span class="line">    mod-&gt;nm_modname,</span>
<span class="line">    mod,  // 保存 napi_module 结构体</span>
<span class="line">    nullptr,</span>
<span class="line">  };</span>
<span class="line">  node::node_module_register(nm);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>napi_module_register 中创建了一个 node_module 结构体，最终也是调用了 node_module_register。这里有两个关键的地方，首先 noed_module 结构体的钩子函数是 napi_module_register_cb，而不是用户定义的函数，用户定义的函数由 napi_module 保存。另外在 node_module 中保存了 napi_module 结构体，后续加载的时候会用到，最后继续调用 node_module_register。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">extern &quot;C&quot; void node_module_register(void* m) {  </span>
<span class="line">  thread_local_modpending = reinterpret_cast&lt;struct node_module*&gt;(m); </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>node_module_register 把 node_module 保存到 thread_local_modpending 中。thread_local_modpending 是一个线程独立的静态变量，所以多线程加载一个 Addon 也是安全的，它保存当前加载的模块。我们继续看 TryLoadAddon 中执行的代码。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">const bool is_opened = dlib-&gt;Open();</span>
<span class="line">node_module* mp = thread_local_modpending;  </span>
<span class="line">thread_local_modpending = nullptr;  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这时候我们就知道刚才那个变量 thread_local_modpending 的作用了。node_module* mp = thread_local_modpending 后我们拿到了我们刚才定义的 Addon 模块的信息，继续看下面的代码。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// mp 非空说明 Addon 定义了初始化函数，并且是第一次加载或者关闭后重新加载</span>
<span class="line">// 初始化函数最终会执行 node_module_register</span>
<span class="line">if (mp != nullptr) {</span>
<span class="line">  mp-&gt;nm_dso_handle = dlib-&gt;handle_;</span>
<span class="line">  // 保存起来后面复用 global_handle_map.set(handle_, mp);</span>
<span class="line">  dlib-&gt;SaveInGlobalHandleMap(mp);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>缓存后继续处理</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 针对非 NAPI 格式定义的 Addon 进行校验，-1 是 NAPI 的值</span>
<span class="line">// 如果 Addon 的 nm_version 和当前 Node.js 版本的不一致</span>
<span class="line">if ((mp-&gt;nm_version != -1) &amp;&amp; (mp-&gt;nm_version != NODE_MODULE_VERSION)) {</span>
<span class="line">  // 如果定义了 node_register_module_vNODE_MODULE_VERSION 函数则执行</span>
<span class="line">  if (auto callback = GetInitializerCallback(dlib)) {</span>
<span class="line">    callback(exports, module, context);</span>
<span class="line">    return true;</span>
<span class="line">  }</span>
<span class="line">  // 否则报错</span>
<span class="line">  char errmsg[1024];</span>
<span class="line">  snprintf(errmsg,</span>
<span class="line">           sizeof(errmsg),</span>
<span class="line">           &quot;The module &#39;%s&#39;&quot;</span>
<span class="line">           &quot;\\nwas compiled against a different Node.js version using&quot;</span>
<span class="line">           &quot;\\nNODE_MODULE_VERSION %d. This version of Node.js requires&quot;</span>
<span class="line">           &quot;\\nNODE_MODULE_VERSION %d. Please try re-compiling or &quot;</span>
<span class="line">           &quot;re-installing\\nthe module (for instance, using \`npm rebuild\` &quot;</span>
<span class="line">           &quot;or \`npm install\`).&quot;,</span>
<span class="line">           *filename,</span>
<span class="line">           mp-&gt;nm_version,</span>
<span class="line">           NODE_MODULE_VERSION);</span>
<span class="line"></span>
<span class="line">  dlib-&gt;Close();</span>
<span class="line">  env-&gt;ThrowError(errmsg);</span>
<span class="line">  return false;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从上面的代码中，可以看到非 NAPI 方式定义的 Addon 是不能跨 Node.js 版版本运行的，需要重新编译，否则就会报错，这个报错相信大家也见过。但是也有一个方法可以解决，也就是为其他版本的 Node.js 定义钩子函数，例如下面的代码。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void Initialize(</span>
<span class="line">  Local&lt;Object&gt; exports,</span>
<span class="line">  Local&lt;Value&gt; module,</span>
<span class="line">  Local&lt;Context&gt; context</span>
<span class="line">) {</span>
<span class="line">  NODE_SET_METHOD(exports, &quot;hello&quot;, Hello);</span>
<span class="line">}</span>
<span class="line">// 为 Node.js 18 定义钩子函数</span>
<span class="line">extern &quot;C&quot; __attribute__((visibility(&quot;default&quot;))) void node_register_module_v108(</span>
<span class="line">  Local&lt;Object&gt; exports,</span>
<span class="line">  Local&lt;Value&gt; module,</span>
<span class="line">  Local&lt;Context&gt; context</span>
<span class="line">) {</span>
<span class="line">  NODE_SET_METHOD(exports, &quot;hello&quot;, Hello);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码在 Node.js 17 下编译，然后可以直接在 Node.js 17 和 18 版本下运行。通过了校验后，则继续往下处理。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">if (mp-&gt;nm_context_register_func != nullptr) {</span>
<span class="line">  mp-&gt;nm_context_register_func(exports, module, context, mp-&gt;nm_priv);</span>
<span class="line">} else if (mp-&gt;nm_register_func != nullptr) {</span>
<span class="line">  mp-&gt;nm_register_func(exports, module, mp-&gt;nm_priv);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Addon 定义的方式不同，对应的钩子函数也不同，这里判断定义了哪个钩子函数，然后执行它，从而拿到导出的内容。对于 非 NAPI 的模块，就直接执行用户定义的代码，对于 NAPI 模块则执行 napi_module_register_cb。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">static void napi_module_register_cb(v8::Local&lt;v8::Object&gt; exports,  </span>
<span class="line">                                    v8::Local&lt;v8::Value&gt; module,  </span>
<span class="line">                                    v8::Local&lt;v8::Context&gt; context,  </span>
<span class="line">                                    void* priv) {  </span>
<span class="line">  napi_module_register_by_symbol(exports, module, context,  </span>
<span class="line">      static_cast&lt;napi_module*&gt;(priv)-&gt;nm_register_func);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>该函数调用 napi_module_register_by_symbol 函数，并传入 napi_module 的 nm_register_func 函数，也就是用户定义的代码。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void napi_module_register_by_symbol(v8::Local&lt;v8::Object&gt; exports,  </span>
<span class="line">                                    v8::Local&lt;v8::Value&gt; module,  </span>
<span class="line">                                    v8::Local&lt;v8::Context&gt; context,  </span>
<span class="line">                                    napi_addon_register_func init) {  </span>
<span class="line">  </span>
<span class="line">  napi_env env = v8impl::NewEnv(context);  </span>
<span class="line">  </span>
<span class="line">  napi_value _exports;  </span>
<span class="line">  env-&gt;CallIntoModuleThrow([&amp;](napi_env env) {  </span>
<span class="line">    // 执行用户的代码</span>
<span class="line">    _exports = init(env, v8impl::JsValueFromV8LocalValue(exports));  </span>
<span class="line">  });  </span>
<span class="line">  // 设置 JS 层拿到的内容</span>
<span class="line">  if (_exports != nullptr &amp;&amp;  </span>
<span class="line">      _exports != v8impl::JsValueFromV8LocalValue(exports)) { </span>
<span class="line">    napi_value _module = v8impl::JsValueFromV8LocalValue(module);  </span>
<span class="line">    napi_set_named_property(env, _module, &quot;exports&quot;, _exports);  </span>
<span class="line">  }  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>init 就是我们 Addon 最后一行定义的函数。入参是 env 和 exports，可以对比我们 Addon 中定义的函数的入参。最后我们修改 exports 变量。即设置导出的内容。最后在 JS 里，我们就拿到了 Addon 定义的内容。</p><p>如果 mp 为空，有两种情况</p><p>Addon 没有定义初始化函数，只导出里某种格式的函数。</p><p>Addon 已经被加载过了，再次加载时初始化函数也不会执行了。比如主线程打开了 Addon，子线程也打开，则子线程中不会再执行初始化函数，也就是说 mp 是空。</p><p>Node.js 会先尝试查找动态链接库中符合某种格式的函数，看一下如何查找是否定义某种格式的函数，首先看第一种函数格式。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline InitializerCallback GetInitializerCallback(DLib* dlib) {</span>
<span class="line">  const char* name = &quot;node_register_module_v&quot; STRINGIFY(NODE_MODULE_VERSION);</span>
<span class="line">  // 获取函数地址</span>
<span class="line">  return reinterpret_cast&lt;InitializerCallback&gt;(dlib-&gt;GetSymbolAddress(name));</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">if (auto callback = GetInitializerCallback(dlib)) {</span>
<span class="line">    callback(exports, module, context);</span>
<span class="line">    return true;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>第一种查找的格式是 node_register_module_v 开头的，接着看第二种函数函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline napi_addon_register_func GetNapiInitializerCallback(DLib* dlib) {</span>
<span class="line">  const char* name = &quot;napi_register_module_vNAPI_MODULE_VERSION&quot;;</span>
<span class="line">  // 获取函数地址</span>
<span class="line">  return reinterpret_cast&lt;napi_addon_register_func&gt;(dlib-&gt;GetSymbolAddress(name));</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">if (auto napi_callback = GetNapiInitializerCallback(dlib)) {</span>
<span class="line">    // 执行 napi_callback 获取导出的内容</span>
<span class="line">    napi_module_register_by_symbol(exports, module, context, napi_callback);</span>
<span class="line">    return true;</span>
<span class="line">} </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>第二种函数格式是 napi_register_module_v 开头的，如果都找不到，则查找缓存看是否已经加载过。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"> // 尝试从之前缓存中获取，比如主线程已经加载了 Addon，子线程也加载 Addon 的场景</span>
<span class="line"> mp = dlib-&gt;GetSavedModuleFromGlobalHandleMap();</span>
<span class="line">// 不存在或者不符合规范则报错</span>
<span class="line">if (mp == nullptr || mp-&gt;nm_context_register_func == nullptr) {</span>
<span class="line">  dlib-&gt;Close();</span>
<span class="line">  char errmsg[1024];</span>
<span class="line">  snprintf(errmsg,</span>
<span class="line">           sizeof(errmsg),</span>
<span class="line">           &quot;Module did not self-register: &#39;%s&#39;.&quot;,</span>
<span class="line">           *filename);</span>
<span class="line">  env-&gt;ThrowError(errmsg);</span>
<span class="line">  return false;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果缓存中存在则继续执行刚才介绍的 mp 非空时的逻辑，如果缓存中不存在或者没有 nm_context_register_func 钩子函数，则直接报错。通过这里的逻辑就可以知道为什么 NODE_MODULE 定义的 Addon 只能被加载一次，比如主线程加载时会执行 Addon 的初始化函数，从而在缓存里保存了数据结构 node_module，然后子线程加载时，不会再执行初始化函数，所以 Node.js 是会从缓存里拿到 node_module 结构体，但是 Node.js 会判断 node_module 是否存在 nm_context_register_func 钩子，而 NODE_MODULE 定义的钩子函数是 nm_register_func，所以就导致了 not self-register 错误。</p><p>最后来看一下 Addon 加载的整体流程。</p><p>tu 10-1</p><h2 id="内置-js-模块" tabindex="-1"><a class="header-anchor" href="#内置-js-模块"><span>内置 JS 模块</span></a></h2><p>刚才已经分析了加载用户 JS 模块的过程，也讲到了加载用户 JS 时传入的 require 函数是对 Module._load 的封装。当我们在 JS 里通过 require 加载内置 JS 模块时，比如 net 模块，_load 函数就会通过 Module._load 中的 loadNativeModule 函数加载原生 JS 模块。我们看这个函数的定义。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">loadNativeModule</span><span class="token punctuation">(</span><span class="token parameter">filename<span class="token punctuation">,</span> request</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> mod <span class="token operator">=</span> NativeModule<span class="token punctuation">.</span>map<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>mod<span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    mod<span class="token punctuation">.</span><span class="token function">compileForPublicLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">return</span> mod<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span>
<span class="line"><span class="token keyword">class</span> <span class="token class-name">NativeModule</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token comment">// 原生 JS 模块的 map   </span></span>
<span class="line">  <span class="token keyword">static</span> map <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Map</span><span class="token punctuation">(</span>moduleIds<span class="token punctuation">.</span><span class="token function">map</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">id</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">[</span>id<span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">NativeModule</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  </span>
<span class="line">  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token parameter">id</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>filename <span class="token operator">=</span> <span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>id<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">.js</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>id <span class="token operator">=</span> id<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>canBeRequiredByUsers <span class="token operator">=</span> <span class="token operator">!</span>id<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">&#39;internal/&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>loaded <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>loading <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>module <span class="token operator">=</span> <span class="token keyword">undefined</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>exportKeys <span class="token operator">=</span> <span class="token keyword">undefined</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"><span class="token punctuation">}</span> </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>NativeModule.map 是在 Node.js 启动过程中进行初始化的一个 Map 对象，key 是模块名，值是一个 NativeModule 对象，loadNativeModule 就是根据加载的模块名从 map 中拿到一个 NativeModule 对象，接着看执行 NativeModule 对象的 compileForPublicLoader 函数。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token function">compileForPublicLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">compileForInternalLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line">  </span>
<span class="line"><span class="token function">compileForInternalLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>loaded <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span>loading<span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token comment">// id 就是我们要加载的模块，比如 net </span></span>
<span class="line">    <span class="token keyword">const</span> id <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>id<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>loading <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">try</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token keyword">const</span> fn <span class="token operator">=</span> <span class="token function">compileFunction</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">      <span class="token function">fn</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">,</span> </span>
<span class="line">         <span class="token comment">// 加载原生 JS 模块的加载器</span></span>
<span class="line">         nativeModuleRequire<span class="token punctuation">,</span> </span>
<span class="line">         <span class="token keyword">this</span><span class="token punctuation">,</span> </span>
<span class="line">         process<span class="token punctuation">,</span> </span>
<span class="line">         <span class="token comment">// 加载 C++ 模块的加载器</span></span>
<span class="line">         internalBinding<span class="token punctuation">,</span> </span>
<span class="line">         primordials<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">      <span class="token keyword">this</span><span class="token punctuation">.</span>loaded <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>  </span>
<span class="line">      <span class="token keyword">this</span><span class="token punctuation">.</span>loading <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先看一下 compileFunction 这里的逻辑，compileFunction 和刚才讲用户 JS 模块加载时的 compileFunction 不一样，该函数是 node_native_module_env.cc 模块导出的函数。具体的代码就不贴了，通过层层查找，最后到 node_native_module.cc 的NativeModuleLoader::CompileAsModule</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">MaybeLocal&lt;Function&gt; NativeModuleLoader::CompileAsModule(  </span>
<span class="line">    Local&lt;Context&gt; context,  </span>
<span class="line">    const char* id,  </span>
<span class="line">    NativeModuleLoader::Result* result) {  </span>
<span class="line">  </span>
<span class="line">  Isolate* isolate = context-&gt;GetIsolate();  </span>
<span class="line">  // 函数的形参  </span>
<span class="line">  std::vector&lt;Local&lt;String&gt;&gt; parameters = {  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;exports&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;require&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;module&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;process&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;internalBinding&quot;),  </span>
<span class="line">      FIXED_ONE_BYTE_STRING(isolate, &quot;primordials&quot;)};  </span>
<span class="line">  // 编译出一个函数  </span>
<span class="line">  return LookupAndCompile(context, id, &amp;parameters, result);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>继续看 LookupAndCompile。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">MaybeLocal&lt;Function&gt; NativeModuleLoader::LookupAndCompile(  </span>
<span class="line">    Local&lt;Context&gt; context,  </span>
<span class="line">    const char* id,  </span>
<span class="line">    std::vector&lt;Local&lt;String&gt;&gt;* parameters,  </span>
<span class="line">    NativeModuleLoader::Result* result) {  </span>
<span class="line">  </span>
<span class="line">  Isolate* isolate = context-&gt;GetIsolate();  </span>
<span class="line">  EscapableHandleScope scope(isolate);  </span>
<span class="line">  </span>
<span class="line">  Local&lt;String&gt; source;  </span>
<span class="line">  // 找到原生 JS 模块内容所在的内存地址  </span>
<span class="line">  if (!LoadBuiltinModuleSource(isolate, id).ToLocal(&amp;source)) {  </span>
<span class="line">    return {};  </span>
<span class="line">  }  </span>
<span class="line">  // &#39;net&#39; + &#39;.js&#39;</span>
<span class="line">  std::string filename_s = id + std::string(&quot;.js&quot;);  </span>
<span class="line">  Local&lt;String&gt; filename =  OneByteString(isolate, </span>
<span class="line">                                              filename_s.c_str(), </span>
<span class="line">                                              filename_s.size());  </span>
<span class="line">  // 省略一些参数处理  </span>
<span class="line">  // 脚本源码  </span>
<span class="line">  ScriptCompiler::Source script_source(source, origin, cached_data);  </span>
<span class="line">  // 编译出一个函数  </span>
<span class="line">  MaybeLocal&lt;Function&gt; maybe_fun =  </span>
<span class="line">      ScriptCompiler::CompileFunctionInContext(context,  </span>
<span class="line">                                               &amp;script_source,  </span>
<span class="line">                                               parameters-&gt;size(),</span>
<span class="line">                                               parameters-&gt;data(),</span>
<span class="line">                                               0,  </span>
<span class="line">                                               nullptr,  </span>
<span class="line">                                               options);  </span>
<span class="line">  Local&lt;Function&gt; fun = maybe_fun.ToLocalChecked();  </span>
<span class="line">  return scope.Escape(fun);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>LookupAndCompile 函数首先找到加载模块的源码，然后编译出一个函数，和用户 JS 模块加载器的原理一样，区别是加载用户 JS 模块的代码时，代码是同步从硬盘读到内存的，但是内置 JS 模块的代码是 Node.js 启动时就存在内存的，看一下LoadBuiltinModuleSource 如何查找模块源码的。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">MaybeLocal&lt;String&gt; NativeModuleLoader::LoadBuiltinModuleSource(Isolate* isolate, const char* id) {  </span>
<span class="line">  const auto source_it = source_.find(id);  </span>
<span class="line">  return source_it-&gt;second.ToStringChecked(isolate);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里的 id 是 net，通过该 id 从 _source 中找到对应的数据，那么 _source 是什么呢？因为Node.js 为了提高加载速度，通过空间换时间，把原生 JS 模块的源码字符串直接转成 ASCII 码存到内存里。这样加载这些模块的时候，就不需要从硬盘读取了，直接从内存读取就行。看一下 _source 的定义（在编译 Node.js 源码或者执行 js2c.py 生成的 node_javascript.cc 中）。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">source_.emplace(&quot;net&quot;, UnionBytes{net_raw, 46682});  </span>
<span class="line">source_.emplace(&quot;cyb&quot;, UnionBytes{cyb_raw, 63});  </span>
<span class="line">source_.emplace(&quot;os&quot;, UnionBytes{os_raw, 7548});  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>cyb 是我增加的测试模块。我们可以看一下该模块的内容。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">static const uint8_t cyb_raw[] = {  </span>
<span class="line">    99,111,110,115,116, 32, 99,121, 98, 32, 61, 32,105,110,116,101,114,110, 97,108, 66,105,110,100,105,110,103, 40, 39, 99,  </span>
<span class="line">    121, 98, 95,119,114, 97,112, 39, 41, 59, 32, 10,109,111,100,117,108,101, 46,101,120,112,111,114,116,115, 32, 61, 32, 99,  </span>
<span class="line">    121, 98, 59  </span>
<span class="line">};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>转成字符串看一下是什么</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">Buffer<span class="token punctuation">.</span><span class="token function">from</span><span class="token punctuation">(</span><span class="token punctuation">[</span></span>
<span class="line">    <span class="token number">99</span><span class="token punctuation">,</span><span class="token number">111</span><span class="token punctuation">,</span><span class="token number">110</span><span class="token punctuation">,</span><span class="token number">115</span><span class="token punctuation">,</span><span class="token number">116</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span> <span class="token number">99</span><span class="token punctuation">,</span><span class="token number">121</span><span class="token punctuation">,</span> <span class="token number">98</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span> <span class="token number">61</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span><span class="token number">105</span><span class="token punctuation">,</span><span class="token number">110</span><span class="token punctuation">,</span><span class="token number">116</span><span class="token punctuation">,</span><span class="token number">101</span><span class="token punctuation">,</span><span class="token number">114</span><span class="token punctuation">,</span><span class="token number">110</span><span class="token punctuation">,</span> <span class="token number">97</span><span class="token punctuation">,</span><span class="token number">108</span><span class="token punctuation">,</span> <span class="token number">66</span><span class="token punctuation">,</span><span class="token number">105</span><span class="token punctuation">,</span><span class="token number">110</span><span class="token punctuation">,</span><span class="token number">100</span><span class="token punctuation">,</span><span class="token number">105</span><span class="token punctuation">,</span><span class="token number">110</span><span class="token punctuation">,</span><span class="token number">103</span><span class="token punctuation">,</span> <span class="token number">40</span><span class="token punctuation">,</span> <span class="token number">39</span><span class="token punctuation">,</span> <span class="token number">99</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token number">121</span><span class="token punctuation">,</span> <span class="token number">98</span><span class="token punctuation">,</span> <span class="token number">95</span><span class="token punctuation">,</span><span class="token number">119</span><span class="token punctuation">,</span><span class="token number">114</span><span class="token punctuation">,</span> <span class="token number">97</span><span class="token punctuation">,</span><span class="token number">112</span><span class="token punctuation">,</span> <span class="token number">39</span><span class="token punctuation">,</span> <span class="token number">41</span><span class="token punctuation">,</span> <span class="token number">59</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">,</span><span class="token number">109</span><span class="token punctuation">,</span><span class="token number">111</span><span class="token punctuation">,</span><span class="token number">100</span><span class="token punctuation">,</span><span class="token number">117</span><span class="token punctuation">,</span><span class="token number">108</span><span class="token punctuation">,</span><span class="token number">101</span><span class="token punctuation">,</span> <span class="token number">46</span><span class="token punctuation">,</span><span class="token number">101</span><span class="token punctuation">,</span><span class="token number">120</span><span class="token punctuation">,</span><span class="token number">112</span><span class="token punctuation">,</span><span class="token number">111</span><span class="token punctuation">,</span><span class="token number">114</span><span class="token punctuation">,</span><span class="token number">116</span><span class="token punctuation">,</span><span class="token number">115</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span> <span class="token number">61</span><span class="token punctuation">,</span> <span class="token number">32</span><span class="token punctuation">,</span> <span class="token number">99</span><span class="token punctuation">,</span>    </span>
<span class="line">    <span class="token number">121</span><span class="token punctuation">,</span> <span class="token number">98</span><span class="token punctuation">,</span> <span class="token number">59</span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">join</span><span class="token punctuation">(</span><span class="token string">&#39;,&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">&#39;,&#39;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token string">&#39;utf-8&#39;</span><span class="token punctuation">)</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">const cyb = internalBinding(&#39;cyb_wrap&#39;);   </span>
<span class="line">module.exports = cyb;  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>所以我们执行 require(&#39;net&#39;) 时，通过 NativeModule 的 compileForInternalLoader，最终会在_source中找到net 模块对应的源码字符串，然后编译成一个函数，最终执行这个函数。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">nativeModuleRequire</span><span class="token punctuation">(</span><span class="token parameter">id</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">const</span> mod <span class="token operator">=</span> NativeModule<span class="token punctuation">.</span>map<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">return</span> mod<span class="token punctuation">.</span><span class="token function">compileForInternalLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> fn <span class="token operator">=</span> <span class="token function">compileFunction</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token function">fn</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>exports<span class="token punctuation">,</span> </span>
<span class="line">   <span class="token comment">// 加载原生 JS 模块的加载器</span></span>
<span class="line">   nativeModuleRequire<span class="token punctuation">,</span> </span>
<span class="line">   <span class="token keyword">this</span><span class="token punctuation">,</span> </span>
<span class="line">   process<span class="token punctuation">,</span> </span>
<span class="line">   <span class="token comment">// 加载 C++ 模块的加载器</span></span>
<span class="line">   internalBinding<span class="token punctuation">,</span> </span>
<span class="line">   primordials<span class="token punctuation">)</span><span class="token punctuation">;</span>   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>fn 入参和用户 JS 模块是不一样的，这里的 this 是 NativeModule 对象，exports 是 NativeModule 对象的属性，另外还有一个参数 internalBinding，这个是用于加载 C++ 模块的，我们一会详细分析，最重要的是这里传入的 require 函数和用户 JS 模块的也不一样。由 fn 的入参可以知道，我们在 net（或其它原生 JS 模块中）只能加载原生 JS 模块和内置的C++ 模块。当 fn 执行完毕后，原生模块加载器就会把 mod.exports 的值返回给调用方。整体流程如下图所示。</p><p>tu 10-2</p><h2 id="内置-c-模块" tabindex="-1"><a class="header-anchor" href="#内置-c-模块"><span>内置 C++ 模块</span></a></h2><p>除了通过 require 加载以上的三种模块外，还有一种模块就是 C++ 模块，C++ 模块通常是在内置 JS 模块里加载的，我们也可以通过 process.binding 进行加载。在原生 JS 模块中加载内置的 C++ 模块，这是 Node.js 拓展 JS 功能的关键之处。比如我们 require(&quot;net&quot;) 的时候，net 模块会加载 C++ 模块 tcp_wrap。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token constant">TCP</span><span class="token punctuation">,</span>  </span>
<span class="line">  TCPConnectWrap<span class="token punctuation">,</span>  </span>
<span class="line">  <span class="token literal-property property">constants</span><span class="token operator">:</span> TCPConstants  </span>
<span class="line"><span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span><span class="token string">&#39;tcp_wrap&#39;</span><span class="token punctuation">)</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Node.js 在初始化的时候会注册 C++ 模块，并且形成一个 C++ 模块链表，当加载 C++ 模块时，Node.js 就通过模块名，从这个链表里面找到对应的节点，然后去执行它里面的钩子函数，执行完之后就可以拿到 C++ 模块导出的内容。</p><p>tu 10-3</p><p>C++ 模块加载器是在 internal/bootstrap/loaders.js 中定义的，分为三种。</p><p>process._linkedBinding: 暴露给用户访问 C++ 模块的接口，用于访问用户自己添加的但是没有加到内置模块的 C++ 模块（flag为NM_F_LINKED）。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> bindingObj<span class="token operator">=</span> <span class="token function">ObjectCreate</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">process<span class="token punctuation">.</span><span class="token function-variable function">_linkedBinding</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token function">_linkedBinding</span><span class="token punctuation">(</span><span class="token parameter">module</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  module <span class="token operator">=</span> <span class="token function">String</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">let</span> mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">typeof</span> mod <span class="token operator">!==</span> <span class="token string">&#39;object&#39;</span><span class="token punctuation">)</span>  </span>
<span class="line">    mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token function">getLinkedBinding</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">return</span> mod<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>_linkedBinding 是在 getLinkedBinding 函数基础上加了缓存功能，getLinkedBinding 是 C++ 层定义的函数。它从另一个 C++ 模块链表中查找对应的模块，这个通常不会用到，就不详细介绍。</p><p>internalBinding：不暴露给用户的访问的接口，只能在 Node.js 代码中访问，比如原生 JS 模块。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">let</span> internalBinding<span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">{</span>  </span>
<span class="line">  <span class="token keyword">const</span> bindingObj <span class="token operator">=</span> <span class="token function">ObjectCreate</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>   </span>
<span class="line">  <span class="token function-variable function">internalBinding</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span><span class="token parameter">module</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">let</span> mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">typeof</span> mod <span class="token operator">!==</span> <span class="token string">&#39;object&#39;</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">      mod <span class="token operator">=</span> bindingObj<span class="token punctuation">[</span>module<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token function">getInternalBinding</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">      moduleLoadList<span class="token punctuation">.</span><span class="token function">push</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">Internal Binding </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>module<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token keyword">return</span> mod<span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>internalBinding 是在 getInternalBinding 函数基础上加了缓存功能。getInternalBinding 是 C++ 层定义的函数，它的作用是从 C++ 模块链表中找到对应的模块。 3. process.binding：暴露给用户调用 C++ 模块的接口，但是只能访问部分 C++ 模块。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line">process<span class="token punctuation">.</span><span class="token function-variable function">binding</span> <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token function">binding</span><span class="token punctuation">(</span><span class="token parameter">module</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">  module <span class="token operator">=</span> <span class="token function">String</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>internalBindingWhitelist<span class="token punctuation">.</span><span class="token function">has</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token keyword">return</span> <span class="token function">internalBinding</span><span class="token punctuation">(</span>module<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">  <span class="token punctuation">}</span>  </span>
<span class="line">  <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">Error</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">No such module: </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>module<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>binding 是在 internalBinding 的基础上加了白名单的逻辑，只对外暴露部分模块，因为 internalBinding 是对 getInternalBinding 的封装。所以直接看 getInternalBinding， 对应的是 binding::GetInternalBinding（node_binding.cc）。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 根据模块名查找对应的模块  </span>
<span class="line">void GetInternalBinding(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  Environment* env = Environment::GetCurrent(args);  </span>
<span class="line">  // 模块名  </span>
<span class="line">  Local&lt;String&gt; module = args[0].As&lt;String&gt;();  </span>
<span class="line">  node::Utf8Value module_v(env-&gt;isolate(), module);  </span>
<span class="line">  Local&lt;Object&gt; exports;  </span>
<span class="line">  // 从 C++ 内部模块找  </span>
<span class="line">  node_module* mod = FindModule(modlist_internal, </span>
<span class="line">                                     *module_v, </span>
<span class="line">                                     NM_F_INTERNAL);  </span>
<span class="line">  exports = InitModule(env, mod, module); </span>
<span class="line">  // 返回 C++ 层导出的功能</span>
<span class="line">  args.GetReturnValue().Set(exports);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>modlist_internal 是一条链表，在 Node.js 启动过程的时候，由各个 C++ 模块连成的链表，FindModule 就是从这个链表中找到对应的数据结构。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline struct node_module* FindModule(struct node_module* list,</span>
<span class="line">                                      const char* name,</span>
<span class="line">                                      int flag) {</span>
<span class="line">  struct node_module* mp;</span>
<span class="line"></span>
<span class="line">  for (mp = list; mp != nullptr; mp = mp-&gt;nm_link) {</span>
<span class="line">    if (strcmp(mp-&gt;nm_modname, name) == 0) break;</span>
<span class="line">  }</span>
<span class="line">  return mp;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>通过模块名找到对应的 C++ 模块后，执行 InitModule 初始化模块。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">    // 初始化一个模块，即执行它里面的注册函数  </span>
<span class="line">    static Local&lt;Object&gt; InitModule(Environment* env,  </span>
<span class="line">                                    node_module* mod,  </span>
<span class="line">                                    Local&lt;String&gt; module) { </span>
<span class="line">          // 新建一个对象，需要导出到 JS 的内容设置到该对象中 </span>
<span class="line">      Local&lt;Object&gt; exports = Object::New(env-&gt;isolate());  </span>
<span class="line">      Local&lt;Value&gt; unused = Undefined(env-&gt;isolate());  </span>
<span class="line">      mod-&gt;nm_context_register_func(exports, unused, env-&gt;context(), mod-&gt;nm_priv);  </span>
<span class="line">      return exports;  </span>
<span class="line">    }  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>传入一个 exports 变量进去，然后执行 C++ 模块的 nm_context_register_func 指向的函数。这个函数就是在 C++ 模块最后一行定义的 Initialize 函数。Initialize 会通过修改 exports 设置导出的对象，比如 TCP 模块的 Initialize。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void TCPWrap::Initialize(Local&lt;Object&gt; target,</span>
<span class="line">                         Local&lt;Value&gt; unused,</span>
<span class="line">                         Local&lt;Context&gt; context,</span>
<span class="line">                         void* priv) {</span>
<span class="line">  target-&gt;Set(env-&gt;context(), tcpString, ...).Check();</span>
<span class="line">  // 设置对象的TCPConnectWrap属性 </span>
<span class="line">  target-&gt;Set(env-&gt;context(), wrapString, ...).Check();</span>
<span class="line"></span>
<span class="line">  // 设置对象的constant属性 </span>
<span class="line">  Local&lt;Object&gt; constants = Object::New(env-&gt;isolate());</span>
<span class="line">  NODE_DEFINE_CONSTANT(constants, SOCKET);</span>
<span class="line">  NODE_DEFINE_CONSTANT(constants, SERVER);</span>
<span class="line">  NODE_DEFINE_CONSTANT(constants, UV_TCP_IPV6ONLY);</span>
<span class="line">  target-&gt;Set(context, env-&gt;constants_string(), constants).Check();</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>target 里设置的值就是 JS 层能拿到的值，最后我们就可以从 JS 访问到 Initialize 导出的内容了。</p><h2 id="自定义模块加载器" tabindex="-1"><a class="header-anchor" href="#自定义模块加载器"><span>自定义模块加载器</span></a></h2><p>了解了 Node.js 的各种模块加载器原理后，我们最后实现两个自己的模块加载器，这样不仅可以处理其他类型的模块，还能深入理解模块加载的实现原理。通过前面的介绍可以知道，我们通过拓展 Module._extensions 来支持我们自己的模块类型。首先看一下如何实现一个 TS 模块加载器。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Module <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;module&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> fs <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;fs&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> path <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;path&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> ts <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;typescript&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> compileFunction <span class="token punctuation">}</span> <span class="token operator">=</span> process<span class="token punctuation">.</span><span class="token function">binding</span><span class="token punctuation">(</span><span class="token string">&#39;contextify&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// 加入处理 TS 的函数</span></span>
<span class="line">Module<span class="token punctuation">.</span>_extensions<span class="token punctuation">[</span><span class="token string">&#39;.ts&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">module<span class="token punctuation">,</span> filename</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// 获取模块内容</span></span>
<span class="line">    <span class="token keyword">const</span> content <span class="token operator">=</span> fs<span class="token punctuation">.</span><span class="token function">readFileSync</span><span class="token punctuation">(</span>filename<span class="token punctuation">,</span> <span class="token string">&#39;utf8&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 先把 TS 转成 JS</span></span>
<span class="line">    <span class="token keyword">const</span> <span class="token punctuation">{</span> outputText <span class="token punctuation">}</span> <span class="token operator">=</span> ts<span class="token punctuation">.</span><span class="token function">transpileModule</span><span class="token punctuation">(</span>content<span class="token punctuation">,</span> <span class="token punctuation">{</span> <span class="token literal-property property">compilerOptions</span><span class="token operator">:</span> <span class="token punctuation">{</span> <span class="token literal-property property">module</span><span class="token operator">:</span> ts<span class="token punctuation">.</span>ModuleKind<span class="token punctuation">.</span>CommonJS <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 编译代码拿到一个函数</span></span>
<span class="line">    <span class="token keyword">const</span> result <span class="token operator">=</span> <span class="token function">compileFunction</span><span class="token punctuation">(</span></span>
<span class="line">        outputText<span class="token punctuation">,</span></span>
<span class="line">        filename<span class="token punctuation">,</span></span>
<span class="line">        <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token keyword">undefined</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token boolean">false</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token keyword">undefined</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">[</span></span>
<span class="line">          <span class="token string">&#39;exports&#39;</span><span class="token punctuation">,</span></span>
<span class="line">          <span class="token string">&#39;require&#39;</span><span class="token punctuation">,</span></span>
<span class="line">          <span class="token string">&#39;module&#39;</span><span class="token punctuation">,</span></span>
<span class="line">          <span class="token string">&#39;__filename&#39;</span><span class="token punctuation">,</span></span>
<span class="line">          <span class="token string">&#39;__dirname&#39;</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">]</span></span>
<span class="line">    <span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token comment">// 执行</span></span>
<span class="line">    result<span class="token punctuation">.</span><span class="token function">function</span><span class="token punctuation">.</span><span class="token function">call</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> module<span class="token punctuation">.</span>exports<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter"><span class="token operator">...</span>args</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> module<span class="token punctuation">.</span><span class="token function">require</span><span class="token punctuation">(</span><span class="token operator">...</span>args<span class="token punctuation">)</span><span class="token punctuation">,</span> module<span class="token punctuation">,</span> filename<span class="token punctuation">,</span> path<span class="token punctuation">.</span><span class="token function">dirname</span><span class="token punctuation">(</span>filename<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们只需要保证上面的代码在我们的 TS 代码之前执行，这样就可以直接执行 TS 代码了。TS 模块加载器的原理是拓展 _extensions 的类型，使得它遇到 .ts 类型的文件时执行我们设置的函数，然后读取到文件内容后，利用 typescript 把 TS 转成 JS，最后执行 JS 代码，有兴趣可以参考<a href="https://github.com/theanarkh/tiny-ts-node" target="_blank" rel="noopener noreferrer">这里</a>。</p><p>我们不仅可以通过 Module._extensions 拓展自定义的模块类型，我们甚至可以通过 Addon 来实现一个自己的 JS 模块加载器，代码可以参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/loader" target="_blank" rel="noopener noreferrer">这里</a>。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">static void Compile(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">    Isolate* isolate = args.GetIsolate();</span>
<span class="line">    Local&lt;Context&gt; context = isolate-&gt;GetCurrentContext();</span>
<span class="line">    String::Utf8Value filename(isolate, args[0].As&lt;String&gt;());</span>
<span class="line">    int fd = open(*filename, 0 , O_RDONLY);</span>
<span class="line">    std::string content;</span>
<span class="line">    char buffer[4096];</span>
<span class="line">    while (1)</span>
<span class="line">    {</span>
<span class="line">      memset(buffer, 0, 4096);</span>
<span class="line">      int ret = read(fd, buffer, 4096);</span>
<span class="line">      if (ret == -1) {</span>
<span class="line">        return args.GetReturnValue().Set(newStringToLcal(isolate, &quot;read file error&quot;));</span>
<span class="line">      }</span>
<span class="line">      if (ret == 0) {</span>
<span class="line">        break;</span>
<span class="line">      }</span>
<span class="line">      content.append(buffer, ret);</span>
<span class="line">    }</span>
<span class="line">    close(fd);</span>
<span class="line">    ScriptCompiler::Source script_source(newStringToLcal(isolate, content.c_str()));</span>
<span class="line">    Local&lt;String&gt; params[] = {</span>
<span class="line">      newStringToLcal(isolate, &quot;require&quot;),</span>
<span class="line">      newStringToLcal(isolate, &quot;exports&quot;),</span>
<span class="line">      newStringToLcal(isolate, &quot;module&quot;),</span>
<span class="line">    };</span>
<span class="line">    MaybeLocal&lt;Function&gt; fun =</span>
<span class="line">    ScriptCompiler::CompileFunctionInContext(context, &amp;script_source, 3, params, 0, nullptr);</span>
<span class="line">    if (fun.IsEmpty()) {</span>
<span class="line">      args.GetReturnValue().Set(Undefined(isolate));</span>
<span class="line">    } else {</span>
<span class="line">      args.GetReturnValue().Set(fun.ToLocalChecked());</span>
<span class="line">    }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Compile 函数首先从参数中拿到文件路径，然后把文件的内容读到内存中，最后通过 CompileFunctionInContext 编译成一个 JS 函数，所以执行完 Compile 后我们就可以拿到一个函数。下面看看怎么使用。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> path <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;path&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> loader <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;./build/Release/main.node&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> filepath <span class="token operator">=</span> path<span class="token punctuation">.</span><span class="token function">resolve</span><span class="token punctuation">(</span>__dirname<span class="token punctuation">,</span> <span class="token string">&#39;demo.js&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">loader<span class="token punctuation">.</span><span class="token function">compile</span><span class="token punctuation">(</span>filepath<span class="token punctuation">)</span><span class="token punctuation">(</span>require<span class="token punctuation">,</span> module<span class="token punctuation">.</span>exports<span class="token punctuation">,</span> module<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>使用方式也很简单，传入实参然后执行 compile 返回的函数，至于传入哪些参数这个是可以自己根据情况自定义。</p><p>总结 通过本节课的内容可以知道，Node.js 中一共有 JSON、用户 JS、原生 JS、C++、Addon 五种模块，虽然我们平时只需要一个 require 就可以了，但是 Node.js 中处理细节还是非常多的，尤其是 Addon 模块。在 Node.js 中，json 模块加载器是通过文件模块和 V8 的 JSON.Parse 实现的，JS 模块是通过 V8 的 CompileFunctionInContext 实现的，C++ 模块是通过 V8 把 C++ 的功能导出到 JS 层实现的，Addon 本质上是加载和使用动态链接库。</p><p>理解了这些模块加载器原理，不仅可以帮助我们更了解 Node.js 的内部机制，我们也可以自己实现新的模块加载器，比如课程中的 JS 和 TS 模块加载器，另外在使用 Addon 模块时碰到问题我们也能引刃而解。</p>`,183)]))}const o=s(i,[["render",p],["__file","module.html.vue"]]),d=JSON.parse('{"path":"/nodejs/deep_into_nodejs/module.html","title":"模块加载的实现","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"Addon 模块","slug":"addon-模块","link":"#addon-模块","children":[]},{"level":2,"title":"内置 JS 模块","slug":"内置-js-模块","link":"#内置-js-模块","children":[]},{"level":2,"title":"内置 C++ 模块","slug":"内置-c-模块","link":"#内置-c-模块","children":[]},{"level":2,"title":"自定义模块加载器","slug":"自定义模块加载器","link":"#自定义模块加载器","children":[]}],"git":{"updatedTime":1705375577000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"nodejs/deep_into_nodejs/module.md"}');export{o as comp,d as data};
