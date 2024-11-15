import{_ as s,c as a,f as e,o as l}from"./app-LHpjaFTr.js";const i={};function p(t,n){return l(),a("div",null,n[0]||(n[0]=[e(`<h1 id="libuv功能是如何引入到js的" tabindex="-1"><a class="header-anchor" href="#libuv功能是如何引入到js的"><span>libuv功能是如何引入到js的</span></a></h1><h2 id="v8基础知识" tabindex="-1"><a class="header-anchor" href="#v8基础知识"><span>v8基础知识</span></a></h2><p>JS 的拓展能力是由 V8 提供的。也就是说，在 Libuv 实现了网络、文件、进程等功能后，还需要借助 V8 提供的拓展能力引入 JS 中，才能在 JS 里使用相关的功能。因此，我们需要先了解 V8 的一些基础数据结构和提供的拓展机制。</p><p>V8 的数据结构非常多，但是常用的是下面的几个，我们需要了解下面的数据结构才能更好地了解和使用 V8。</p><ul><li>Isolate：Isolate 代表一个 V8 的实例，它相当于这一个容器。通常一个线程里面会有一个这样的实例。比如说在 Node.js 主线程里面就会有一个 Isolate 实例，子线程里也会有一个 Isolate 实例。</li><li>Context：Context 是代表代码执行的上下文，起到隔离的作用，即我们改变一个 Context 的内容不会影响另一个 Context，它主要是保存 Object、- Function 这些我们平时经常会用到的内置类型。如果我们想拓展 JS 功能，就可以通过这个对象实现。另外一个 Isolate 中，可以存在多个 Context。</li><li>ObjectTemplate：ObjectTemplate 是用于定义对象的模板。我们可以基于这个模板去创建对象。</li><li>FunctionTemplate：FunctionTemplate 和 ObjectTemplate 是类似的，它主要是用于定义一个函数的模板。我们可以基于这个函数模板去创建一个函数。</li><li>FunctionCallbackInfo： 用于实现 JS 和 C++ 通信的对象。当我们通过 JS 调用 C++ 代码时，就会通过该类的对象获取 JS 层传入的参数。</li><li>Handle：Handle 用于 V8 的内存管理，它保存了 V8 堆对象的地址信息。我们平时定义的对象和数组，就是用 Handle 来管理的。比如在 C++ 层创建一个 JS 对象。</li></ul><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// Local 是 Handle 的一种，Object::New 用于在 V8 堆分配内存</span>
<span class="line">Local&lt;Value&gt; object = Object::New(isolate);</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>HandleScope：HandleScope 是一个 Handle 容器，方便管理大量 Handle 的创建和销毁。它主要是利用 C++ 的析构函数机制管理多个 Handle 的生命周期。</li></ul><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">{</span>
<span class="line">    HandleScope scope(env-&gt;isolate());</span>
<span class="line">    // 创建两个 Handle 对象，指向两个对象</span>
<span class="line">    Local&lt;Value&gt; object1 = Object::New(isolate);</span>
<span class="line">    Local&lt;Value&gt; object2 = Object::New(isolate);</span>
<span class="line">} // 执行到这后 object1 和 object2 的内存被释放，Object 被 GC</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接下来我们详细介绍一下 FunctionTemplate 和 ObjectTemplate 这两个非常核心的类，它们是我们拓展 JS 能力时经常会使用到的。就像建房子会根据设计图施工一样，我们可以在 V8 中通过定义某种模板创建出对应的实例，那我们该如何定义一个函数模版呢，具体代码可参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/V8/FunctionTemplate" target="_blank" rel="noopener noreferrer">这里</a></p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">Local&lt;String&gt; newString(const char * name) {</span>
<span class="line">  return String::NewFromUtf8(Isolate::GetCurrent(), name, v8::NewStringType::kNormal).ToLocalChecked();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void ProtoMethod(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">    std::cout&lt;&lt;&quot;call ProtoMethod&quot;&lt;&lt;std::endl;</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">// 定义一个加法函数</span>
<span class="line">void InstanceMethod(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">    std::cout&lt;&lt;&quot;call InstanceMethod&quot;&lt;&lt;std::endl;</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void Initialize(</span>
<span class="line">  Local&lt;Object&gt; exports,</span>
<span class="line">  Local&lt;Value&gt; module,</span>
<span class="line">  Local&lt;Context&gt; context</span>
<span class="line">) {</span>
<span class="line">        Isolate* isolate = context-&gt;GetIsolate();</span>
<span class="line">        // 新建一个函数模版</span>
<span class="line">        Local&lt;FunctionTemplate&gt; parentFunc = FunctionTemplate::New(isolate);</span>
<span class="line">        // 新建一个字符串表示函数名</span>
<span class="line">        Local&lt;String&gt; parentName = String::NewFromUtf8(isolate, &quot;Parent&quot;, v8::NewStringType::kNormal).ToLocalChecked();</span>
<span class="line">        // 设置函数名</span>
<span class="line">        parentFunc-&gt;SetClassName(parentName);</span>
<span class="line">        // 设置原型属性</span>
<span class="line">        parentFunc-&gt;PrototypeTemplate()-&gt;Set(isolate, &quot;protoField&quot;, Number::New(isolate, 1));</span>
<span class="line">        // 设置原型函数，JS 调 protoMethod 时就会调 ProtoMethod 函数</span>
<span class="line">        parentFunc-&gt;PrototypeTemplate()-&gt;Set(isolate, &quot;protoMethod&quot;, FunctionTemplate::New(isolate, ProtoMethod));</span>
<span class="line">        // 设置对象属性</span>
<span class="line">        parentFunc-&gt;InstanceTemplate()-&gt;Set(isolate, &quot;instanceField&quot;, Number::New(isolate, 2));</span>
<span class="line">        parentFunc-&gt;InstanceTemplate()-&gt;Set(isolate, &quot;instanceMethod&quot;, FunctionTemplate::New(isolate, InstanceMethod));</span>
<span class="line">        // 根据模块创建函数实例</span>
<span class="line">        Local&lt;Function&gt; parentInstance = parentFunc-&gt;GetFunction(context).ToLocalChecked();</span>
<span class="line">        // 导出到 JS 层</span>
<span class="line">        exports-&gt;Set(context, parentName, parentInstance).Check();</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">// addon 定义</span>
<span class="line">NODE_MODULE_CONTEXT_AWARE(NODE_GYP_MODULE_NAME, Initialize)</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下面来详细解释上面的代码。</p><p>通过 FunctionTemplate::New(isolate) 创建一个函数模板，函数模板是定义了当通过这个函数模板创建一个函数时函数的内容，比如函数名，函数的原型对象里有什么属性等，对应 JS 的函数。 通过 SetClassName 定义了当通过这个函数模板创建一个函数时，这个函数的名字。 通过设置 PrototypeTemplate 的属性定义了当通过这个函数模板创建一个函数时，这个函数的原型对象，就是 JS 里的 function.prototype。 通过设置 InstanceTemplate 的属性定义了当通过这个函数模板创建一个函数并且通过 new 执行这个函数时，生成的对象里有哪些内容。</p><p>翻译成 JS 如下:</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">function</span> <span class="token function">Parent</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>instanceField <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function-variable function">instanceMethod</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span> <span class="token operator">...</span> <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token class-name">Parent</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span>protoField <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token class-name">Parent</span><span class="token punctuation">.</span>prototype<span class="token punctuation">.</span><span class="token function-variable function">protoMethod</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span> <span class="token operator">...</span> <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下面通过使用这个 Addon 来体验下效果:</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Parent <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;./build/Release/test.node&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> parent <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Parent</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;Parent.prototype: &#39;</span><span class="token punctuation">,</span> <span class="token class-name">Parent</span><span class="token punctuation">.</span>prototype<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;parent.protoField: &#39;</span><span class="token punctuation">,</span> parent<span class="token punctuation">.</span>protoField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">parent<span class="token punctuation">.</span><span class="token function">protoMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;parent.instanceField: &#39;</span><span class="token punctuation">,</span> parent<span class="token punctuation">.</span>instanceField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">parent<span class="token punctuation">.</span><span class="token function">instanceMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出如下：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">Parent.prototype:  Parent { protoField: 1, protoMethod: [Function: protoMethod] } </span>
<span class="line">parent.protoField:  1 </span>
<span class="line">call ProtoMethod</span>
<span class="line">parent.instanceField:  2 </span>
<span class="line">call InstanceMethod</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>了解了基础使用后，接着看一下高级点的用法：继承，V8 提供了类似 JS 里的原型链继承的功能，具体代码可参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/V8/Inherit" target="_blank" rel="noopener noreferrer">这里</a>。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">Local&lt;FunctionTemplate&gt; childFunc = FunctionTemplate::New(isolate);</span>
<span class="line">Local&lt;String&gt; childName = String::NewFromUtf8(isolate, &quot;Child&quot;, v8::NewStringType::kNormal).ToLocalChecked();</span>
<span class="line">childFunc-&gt;SetClassName(childName);</span>
<span class="line">// 定义自己的原型属性</span>
<span class="line">childFunc-&gt;PrototypeTemplate()-&gt;Set(isolate, &quot;childProtoField&quot;, Number::New(isolate, 1));</span>
<span class="line">// 定义自己的实例属性</span>
<span class="line">childFunc-&gt;InstanceTemplate()-&gt;Set(isolate, &quot;childInstanceField&quot;, Number::New(isolate, 2));</span>
<span class="line">// 继承 parentFunc 函数模版</span>
<span class="line">childFunc-&gt;Inherit(parentFunc);</span>
<span class="line"></span>
<span class="line">Local&lt;Function&gt; parentInstance = parentFunc-&gt;GetFunction(context).ToLocalChecked();</span>
<span class="line">Local&lt;Function&gt; childInstance = childFunc-&gt;GetFunction(context).ToLocalChecked();</span>
<span class="line">exports-&gt;Set(context, parentName, parentInstance).Check();</span>
<span class="line">exports-&gt;Set(context, childName, childInstance).Check();</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里和刚才的区别是多了个继承的设置，这样 child 就可以直接使用 parent 的一些内容了。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Parent<span class="token punctuation">,</span> Child <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;./build/Release/test.node&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> child <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Child</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;Child.prototype: &#39;</span><span class="token punctuation">,</span> <span class="token class-name">Child</span><span class="token punctuation">.</span>prototype<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;Parent.prototype === Child.prototype: &#39;</span><span class="token punctuation">,</span> <span class="token class-name">Parent</span><span class="token punctuation">.</span>prototype <span class="token operator">===</span> <span class="token class-name">Child</span><span class="token punctuation">.</span>prototype<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child.protoField: &#39;</span><span class="token punctuation">,</span> child<span class="token punctuation">.</span>protoField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">child<span class="token punctuation">.</span><span class="token function">protoMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child.instanceField: &#39;</span><span class="token punctuation">,</span> child<span class="token punctuation">.</span>instanceField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child.instanceMethod: &#39;</span><span class="token punctuation">,</span> child<span class="token punctuation">.</span>instanceMethod<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child.childProtoField: &#39;</span><span class="token punctuation">,</span> child<span class="token punctuation">.</span>childProtoField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child.childInstanceField: &#39;</span><span class="token punctuation">,</span> child<span class="token punctuation">.</span>childInstanceField<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;child instanceof Parent: &#39;</span><span class="token punctuation">,</span> child <span class="token keyword">instanceof</span> <span class="token class-name">Parent</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">Child.prototype:  Parent { childProtoField: 1 }</span>
<span class="line">Parent.prototype === Child.prototype:  false</span>
<span class="line">child.protoField:  1</span>
<span class="line">call ProtoMethod</span>
<span class="line">child.instanceField:  undefined</span>
<span class="line">child.instanceMethod:  undefined</span>
<span class="line">child.childProtoField:  1</span>
<span class="line">child.childInstanceField:  2</span>
<span class="line">child instanceof Parent:  true</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下面再看一下另一个高级的用法：JS 和 C++ 对象绑定，也是 Node.js 中非常核心的部分，具体代码可参考<a href="https://github.com/theanarkh/nodejs-book/tree/main/src/V8/WrapperObject" target="_blank" rel="noopener noreferrer">这里</a>。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class Dummy {</span>
<span class="line">  public:</span>
<span class="line">    Dummy(Local&lt;Object&gt; object): jsObject(Isolate::GetCurrent(), object) {</span>
<span class="line">      // 设置 JS 对象关联的 C++ 对象</span>
<span class="line">      object-&gt;SetAlignedPointerInInternalField(0, static_cast&lt;void*&gt;(this));</span>
<span class="line">      // 给 JS 对象设置一个属性</span>
<span class="line">      Local&lt;Context&gt; context = Isolate::GetCurrent()-&gt;GetCurrentContext();</span>
<span class="line">      (void)object-&gt;Set(context, newString(&quot;hello&quot;), newString(&quot;world&quot;));</span>
<span class="line">    };</span>
<span class="line">    // C++ 对象关联的 JS 对象</span>
<span class="line">    Global&lt;Object&gt; jsObject;</span>
<span class="line">    int dummy_field = 1;</span>
<span class="line">};</span>
<span class="line"></span>
<span class="line">void New(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">    new Dummy(args.This());</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void Method(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">    Isolate* isolate = args.GetIsolate();</span>
<span class="line">    Local&lt;Context&gt; context = isolate-&gt;GetCurrentContext();</span>
<span class="line">    // 获取 JS 对象的属性</span>
<span class="line">    Local&lt;String&gt; hello = newString(&quot;hello&quot;);</span>
<span class="line">    // 获取 hello 属性等值</span>
<span class="line">    Local&lt;String&gt; helloValue = args.Holder()-&gt;Get(context, hello).ToLocalChecked().As&lt;String&gt;();</span>
<span class="line">    // 获取 JS 对象关联的 C++ 对象</span>
<span class="line">    Dummy* dummy = static_cast&lt;Dummy*&gt;(args.Holder()-&gt;GetAlignedPointerFromInternalField(0));</span>
<span class="line">    Local&lt;Object&gt; obj = Object::New(isolate);</span>
<span class="line">    // 把 JS 和 C++ 对象的属性返回给 JS 层</span>
<span class="line">    (void)obj-&gt;Set(context, hello, helloValue);</span>
<span class="line">    (void)obj-&gt;Set(context, newString(&quot;dummy_field&quot;), Number::New(isolate, dummy-&gt;dummy_field));</span>
<span class="line">    args.GetReturnValue().Set(obj);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">// 新建一个函数模版</span>
<span class="line">Local&lt;FunctionTemplate&gt; funcWithCallback = FunctionTemplate::New(isolate, New);</span>
<span class="line">// 设置 JS 对象可以关联的 C++ 对象个数</span>
<span class="line">funcWithCallback-&gt;InstanceTemplate()-&gt;SetInternalFieldCount(1);</span>
<span class="line">funcWithCallback-&gt;PrototypeTemplate()-&gt;Set(isolate, &quot;method&quot;, FunctionTemplate::New(isolate, Method));</span>
<span class="line">// 新建一个字符串表示函数名</span>
<span class="line">Local&lt;String&gt; funcWithCallbackName = String::NewFromUtf8(isolate, &quot;FuncWithCallback&quot;, v8::NewStringType::kNormal).ToLocalChecked();</span>
<span class="line">// 设置函数名</span>
<span class="line">funcWithCallback-&gt;SetClassName(funcWithCallbackName);</span>
<span class="line">Local&lt;Function&gt; funcWithCallbackInstance = funcWithCallback-&gt;GetFunction(context).ToLocalChecked();</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>看一下效果：</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> Parent<span class="token punctuation">,</span> Child<span class="token punctuation">,</span> FuncWithCallback <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;./build/Release/test.node&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> instace <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">FuncWithCallback</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>instace<span class="token punctuation">.</span><span class="token function">method</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出如下：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">{ hello: &#39;world&#39;, dummy_field: 1 }</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>以上代码用到的技术几乎是 Node.js 每个 C++ 模块都会用到的，下面来详细分析一下上面的代码，看看它的工作原理。</p><p>创建一个函数模块，和之前不一样的是，这里会设置一个回调函数是 New，并执行 InstanceTemplate()-&gt;SetInternalFieldCount(1)，因为我们需要在 JS 对象中关联一个 C++ 对象，所以需要设置为 1，类似预留一个 slot。 当 JS 执行 new FuncWithCallback 时，C++ 层首先会创建一个 JS 对象，然后调用 New 函数，在 New 函数中可以通过 args.This() 拿到这个 JS 对象。 接着创建一个 Dummy 对象，把这个 JS 对象传入 Dummy 的构造函数中。Dummy 构造函数在 jsObject 字段中保存了 JS 对象，然后在 JS 对象中保存了 Dummy 对象，最后往 JS 对象新增了一个hello 属性，结构图如下：</p><p>JS 层 new 执行完毕拿到了一个 JS 对象 instance，接着执行 instace.method() 时就会调用 C++ 的 Method。Method 函数中可以通过 args.Holder() 或 args.This()（通常是一样的）获得函数调用的上下文，类似 JS 函数调用时的 this。 接着通过 GetAlignedPointerFromInternalField(0) 获得之前关联的 C++ 对象。从而取得相应的内容。</p><h2 id="c-层核心数据结构" tabindex="-1"><a class="header-anchor" href="#c-层核心数据结构"><span>C++ 层核心数据结构</span></a></h2><p>有了 V8 的拓展机制后，理论上就可以把 Libuv 引入 JS 里了，但 Node.js 在 C++ 层还设计了一些通用的数据结构，很多 C++ 模块中都会用到它们，所以我们先来了解下这些数据结构。</p><p>BaseObject</p><p>BaseObject 是 Node.js 中非常重要的数据结构，是 C++ 层大多数类的基类，用于管理 JS 和所关联 C++ 对象的生命周期，这里只介绍常用的部分。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class BaseObject : public MemoryRetainer {  </span>
<span class="line"> private:  </span>
<span class="line">  // 持久句柄，指向 JS 对象  </span>
<span class="line">  v8::Global&lt;v8::Object&gt; persistent_handle_;  </span>
<span class="line">  Environment* env_;  </span>
<span class="line">};  </span>
<span class="line">    </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>BaseObject 中最重要的字段是 persistent_handle_，persistent_handle_ 是一个持久句柄，用于保存 JS 层的对象，并且通过弱引用机制管理 JS 和 C++ 对象的生命周期。</p><p>构造函数</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">    // 把 JS 对象存储到 persistent_handle_ 中，需要的时候通过 object() 函数取出来  </span>
<span class="line">    BaseObject::BaseObject(Environment* env, </span>
<span class="line">                           v8::Local&lt;v8::Object&gt; object) </span>
<span class="line">    : persistent_handle_(env-&gt;isolate(), object), </span>
<span class="line">      env_(env) {  </span>
<span class="line">      // 把 this 存到 JS 对象 object 中  </span>
<span class="line">      object-&gt;SetAlignedPointerInInternalField(0, static_cast&lt;void*&gt;(this));  </span>
<span class="line">    }  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>构造函数用于关联 JS 对象和 C++ 对象，下图中的对象即我们平时在 JS 层使用的由 C++ 模块创建的对象，比如 new TCP() 和 TCPWrap 对象的关系，后面我们可以看到用处。</p><p>获取 JS 对象</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">v8::Local&lt;v8::Object&gt; BaseObject::object() const {  </span>
<span class="line">  return PersistentToLocal::Default(env()-&gt;isolate(), persistent_handle_);  </span>
<span class="line">}  </span>
<span class="line"> </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>object 函数用于返回 JS 层使用的对象。</p><p>获取 BaseObject 对象</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 通过 obj 取出里面保存的 BaseObject 对象  </span>
<span class="line">BaseObject* BaseObject::FromJSObject(v8::Local&lt;v8::Object&gt; obj) {</span>
<span class="line">  return static_cast&lt;BaseObject*&gt;(obj-&gt;GetAlignedPointerFromInternalField(0));  </span>
<span class="line">}  </span>
<span class="line">// T 为 BaseObject 子类</span>
<span class="line">T* BaseObject::FromJSObject(v8::Local&lt;v8::Object&gt; object) {  </span>
<span class="line">  return static_cast&lt;T*&gt;(FromJSObject(object));  </span>
<span class="line">}  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>FromJSObject 用于通过 JS 对象获取对应的 C++ 对象，因为它们互相关联，所以很自然可以获取到。</p><p>Unwrap</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 从 obj 中取出对应的 BaseObject 对象  </span>
<span class="line">inline T* Unwrap(v8::Local&lt;v8::Object&gt; obj) {  </span>
<span class="line">  return BaseObject::FromJSObject&lt;T&gt;(obj);  </span>
<span class="line">}  </span>
<span class="line">  </span>
<span class="line">// 从 obj 中获取对应的 BaseObject 对象，如果为空则返回第三个参数的值（默认值）  </span>
<span class="line">#define ASSIGN_OR_RETURN_UNWRAP(ptr, obj, ...) \\  </span>
<span class="line">  do {       \\  </span>
<span class="line">    *ptr = static_cast&lt;typename std::remove_reference&lt;decltype(*ptr)&gt;::type&gt;( \\  </span>
<span class="line">        BaseObject::FromJSObject(obj));   \\  </span>
<span class="line">    if (*ptr == nullptr)  \\  </span>
<span class="line">      return __VA_ARGS__; \\  </span>
<span class="line">  } while (0)  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Unwrap 是非常重要的逻辑，基本每次从 JS 层到 C++ 层都用到了这个函数，它用于从 JS 对象中获取对应的 C++ 对象，比如 JS 层调 setNoDelay 时会执行 C++ 层 SetNoDelay。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void TCPWrap::SetNoDelay(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {</span>
<span class="line">  TCPWrap* wrap;</span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap,</span>
<span class="line">                          // JS 层使用的对象，比如 _handle = new TCP()</span>
<span class="line">                          args.Holder(),</span>
<span class="line">                          args.GetReturnValue().Set(UV_EBADF));</span>
<span class="line"> // ...</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>MakeWeak</p><p>BaseObject 中通过 persistent_handle_ 持有了一个 JS 对象，MakeWeak 利用了 V8 提供的机制，在 JS 对象只有 persistent_handle_ 引用时可以被 GC，从而释放关联的 C++ 对象的内存。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void BaseObject::MakeWeak() {</span>
<span class="line">  persistent_handle_.SetWeak(</span>
<span class="line">      this,</span>
<span class="line">      [](const v8::WeakCallbackInfo&lt;BaseObject&gt;&amp; data) {</span>
<span class="line">        BaseObject* obj = data.GetParameter();</span>
<span class="line">        // 不再引用 JS 对象</span>
<span class="line">        obj-&gt;persistent_handle_.Reset();</span>
<span class="line">        // 执行 GC 逻辑，默认释放 BaseObject 对象内存</span>
<span class="line">        obj-&gt;OnGCCollect();</span>
<span class="line">      }, v8::WeakCallbackType::kParameter);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">void BaseObject::OnGCCollect() {</span>
<span class="line">  delete this;</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>但是 BaseObject 默认不会调用 MakeWeak，这个是子类控制的。另外值得一提的是 SetWeak 也可以不传入如何参数，这种方式会在只有持久句柄引用 JS 对象时，该 JS 对象可以被 GC，并且会重置持久句柄，使得它不再引用该 JS 对象。</p><p>AsyncWrap</p><p>AsyncWrap 是 BaseObject 的子类，实现了 async_hook 模块的功能，同时实现了异步操作的功能，这里我们只关注异步操作中回调 JS 的功能。当 C++ 层回调 JS 层时会调用 AsyncWrap 的 MakeCallback 函数。</p><p>回调 JS</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline v8::MaybeLocal&lt;v8::Value&gt; AsyncWrap::MakeCallback(</span>
<span class="line">    const v8::Local&lt;v8::Name&gt; symbol,  </span>
<span class="line">    int argc,</span>
<span class="line">    v8::Local&lt;v8::Value&gt;* argv)</span>
<span class="line">{  </span>
<span class="line">  v8::Local&lt;v8::Value&gt; cb_v;  </span>
<span class="line">  // 从对象中取出该 symbol 属性对应的值，值是个函数</span>
<span class="line">  // symbol 的值通常在 JS 层设置，比如 onread = xxx，oncomplete = xxx  </span>
<span class="line">  if (!object()-&gt;Get(env()-&gt;context(), symbol).ToLocal(&amp;cb_v))  </span>
<span class="line">    return v8::MaybeLocal&lt;v8::Value&gt;();  </span>
<span class="line">  // 需要是个函数  </span>
<span class="line">  if (!cb_v-&gt;IsFunction()) {  </span>
<span class="line">    return v8::MaybeLocal&lt;v8::Value&gt;();  </span>
<span class="line">  }  </span>
<span class="line">  // 回调，见 async_wrap.cc  </span>
<span class="line">  return MakeCallback(cb_v.As&lt;v8::Function&gt;(), argc, argv);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>以上只是入口函数，看看真正的实现。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">MaybeLocal&lt;Value&gt; AsyncWrap::MakeCallback(const Local&lt;Function&gt; cb,  </span>
<span class="line">                                          int argc,  </span>
<span class="line">                                          Local&lt;Value&gt;* argv) {  </span>
<span class="line">  </span>
<span class="line">  MaybeLocal&lt;Value&gt; ret = InternalMakeCallback(env(), object(), cb, argc, argv, context);  </span>
<span class="line">  return ret;  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看一下 InternalMakeCallback</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">MaybeLocal&lt;Value&gt; InternalMakeCallback(Environment* env,  </span>
<span class="line">                                       Local&lt;Object&gt; recv,  </span>
<span class="line">                                       const Local&lt;Function&gt; callback,  </span>
<span class="line">                                       int argc,  </span>
<span class="line">                                       Local&lt;Value&gt; argv[],  </span>
<span class="line">                                       async_context asyncContext) {  </span>
<span class="line">  // …省略其他代码</span>
<span class="line">  // 执行 JS 层回调  </span>
<span class="line">  callback-&gt;Call(env-&gt;context(), recv, argc, argv);}  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最终通过 V8 Function 的 Call 执行该 JS 函数。</p><p>HandleWrap</p><p>HandleWrap 是对 Libuv uv_handle_t 结构体和操作的封装，也是很多 C++ 类的基类，比如 TCP、UDP。结构图如下。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">class HandleWrap : public AsyncWrap {  </span>
<span class="line"> public:  </span>
<span class="line">  // 操作和判断 handle 状态函数，对 Libuv 的封装  </span>
<span class="line">  static void Close(...);  </span>
<span class="line">  static void Ref(...);  </span>
<span class="line">  static void Unref(...);  </span>
<span class="line">  static void HasRef(...);  </span>
<span class="line">  static inline bool IsAlive(const HandleWrap* wrap) {  </span>
<span class="line">    return wrap != nullptr &amp;&amp; wrap-&gt;state_ != kClosed;  </span>
<span class="line">  }  </span>
<span class="line">  </span>
<span class="line">  static inline bool HasRef(const HandleWrap* wrap) {  </span>
<span class="line">    return IsAlive(wrap) &amp;&amp; uv_has_ref(wrap-&gt;GetHandle());  </span>
<span class="line">  }  </span>
<span class="line">  // 获取封装的 handle  </span>
<span class="line">  inline uv_handle_t* GetHandle() const { return handle_; }  </span>
<span class="line">  // 关闭 handle，如果传入回调则在 close 阶段被执行  </span>
<span class="line">  virtual void Close(v8::Local&lt;v8::Value&gt; close_callback = v8::Local&lt;v8::Value&gt;());  </span>
<span class="line">  </span>
<span class="line"> protected:  </span>
<span class="line">  // 子类可实现</span>
<span class="line">  virtual void OnClose() {}  </span>
<span class="line">  // handle 状态  </span>
<span class="line">  inline bool IsHandleClosing() const {  </span>
<span class="line">    return state_ == kClosing || state_ == kClosed;  </span>
<span class="line">  }  </span>
<span class="line">  </span>
<span class="line"> private:   </span>
<span class="line">  static void OnClose(uv_handle_t* handle);  </span>
<span class="line">  </span>
<span class="line">  // handle 队列  </span>
<span class="line">  ListNode&lt;HandleWrap&gt; handle_wrap_queue_;  </span>
<span class="line">  // handle 的状态  </span>
<span class="line">  enum { kInitialized, kClosing, kClosed } state_;  </span>
<span class="line">  // 所有 handle 的基类  </span>
<span class="line">  uv_handle_t* const handle_;  </span>
<span class="line">};  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>HandleWrap 有个 handle_ 成员，它指向子类的 handle 类结构体，比如 TCP 模块的 uv_tcp_t，然后剩下的功能就是对 handle 管理的逻辑，比如 Ref 和 Unref 用于控制该 handle 是否影响事件循环的退出。</p><p>构造函数</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">/* </span>
<span class="line">  object 为 JS 层对象 </span>
<span class="line">  handle 为子类具体的 handle 类型，不同模块不一样 </span>
<span class="line">*/  </span>
<span class="line">HandleWrap::HandleWrap(Environment* env,  </span>
<span class="line">                       Local&lt;Object&gt; object,  </span>
<span class="line">                       uv_handle_t* handle,  </span>
<span class="line">                       AsyncWrap::ProviderType provider)  </span>
<span class="line">    : AsyncWrap(env, object, provider),  </span>
<span class="line">      state_(kInitialized),  </span>
<span class="line">      handle_(handle) {  </span>
<span class="line">  // 保存 Libuv handle 和 C++ 对象的关系，Libuv 执行 C++ 回调时使用</span>
<span class="line">  handle_-&gt;data = this;  </span>
<span class="line">}  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>判断和操作 handle 状态</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 修改 handle 为活跃状态  </span>
<span class="line">void HandleWrap::Ref(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  HandleWrap* wrap;  </span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap, args.Holder());  </span>
<span class="line">  </span>
<span class="line">  if (IsAlive(wrap))  </span>
<span class="line">    uv_ref(wrap-&gt;GetHandle());  </span>
<span class="line">}  </span>
<span class="line">  </span>
<span class="line">// 修改 hande 为不活跃状态  </span>
<span class="line">void HandleWrap::Unref(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  HandleWrap* wrap;  </span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap, args.Holder());  </span>
<span class="line">  </span>
<span class="line">  if (IsAlive(wrap))  </span>
<span class="line">    uv_unref(wrap-&gt;GetHandle());  </span>
<span class="line">}  </span>
<span class="line">  </span>
<span class="line">// 判断 handle 是否处于活跃状态  </span>
<span class="line">void HandleWrap::HasRef(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  HandleWrap* wrap;  </span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap, args.Holder());  </span>
<span class="line">  args.GetReturnValue().Set(HasRef(wrap));  </span>
<span class="line">}  </span>
<span class="line"></span>
<span class="line">// 关闭 handle（JS 层调用） </span>
<span class="line">void HandleWrap::Close(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  HandleWrap* wrap;  </span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap, args.Holder());  </span>
<span class="line">  // 传入回调  </span>
<span class="line">  wrap-&gt;Close(args[0]);  </span>
<span class="line">}  </span>
<span class="line"></span>
<span class="line">// 真正关闭 handle 的函数  </span>
<span class="line">void HandleWrap::Close(Local&lt;Value&gt; close_callback) {  </span>
<span class="line">  // 正在关闭或已经关闭  </span>
<span class="line">  if (state_ != kInitialized)  </span>
<span class="line">    return;  </span>
<span class="line">  // 调用 Libuv 函数  </span>
<span class="line">  uv_close(handle_, OnClose);  </span>
<span class="line">  // 关闭中  </span>
<span class="line">  state_ = kClosing;  </span>
<span class="line">  // 传了 onclose 回调则保存起来，在 close 阶段后调用  </span>
<span class="line">  if (!close_callback.IsEmpty() &amp;&amp; </span>
<span class="line">       close_callback-&gt;IsFunction() &amp;&amp;  </span>
<span class="line">      !persistent().IsEmpty()) {  </span>
<span class="line">    object()-&gt;Set(env()-&gt;context(),  </span>
<span class="line">                  env()-&gt;handle_onclose_symbol(),  </span>
<span class="line">                  close_callback).Check();  </span>
<span class="line">  }  </span>
<span class="line">}  </span>
<span class="line">  </span>
<span class="line">// 关闭 handle 成功后回调，Libuv 层执行  </span>
<span class="line">void HandleWrap::OnClose(uv_handle_t* handle) {  </span>
<span class="line">  Environment* env = wrap-&gt;env();  </span>
<span class="line">  wrap-&gt;state_ = kClosed;  </span>
<span class="line">  // 执行子类的 onClose，如果没有则是空操作</span>
<span class="line">  wrap-&gt;OnClose();  </span>
<span class="line">  // 有 JS 层 onclose 回调则执行  </span>
<span class="line">  if (!wrap-&gt;persistent().IsEmpty() &amp;&amp;  </span>
<span class="line">      wrap-&gt;object()-&gt;Has(env-&gt;context(), env-&gt;handle_onclose_symbol())  </span>
<span class="line">      .FromMaybe(false)) {  </span>
<span class="line">    wrap-&gt;MakeCallback(env-&gt;handle_onclose_symbol(), </span>
<span class="line">                       0,</span>
<span class="line">                       nullptr);  </span>
<span class="line">  }  </span>
<span class="line">}  </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>ReqWrap</p><p>ReqWrap 表示通过 Libuv 对 handle 的一次请求，比如读取文件。ReqWrap 是请求操作的基类，可以实现不同的子类。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T&gt;  </span>
<span class="line">class ReqWrap : public AsyncWrap, public ReqWrapBase { </span>
<span class="line"> protected:  </span>
<span class="line">  // Libuv 请求结构体，类型由子类决定</span>
<span class="line">  T req_;  </span>
<span class="line">};   </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>看一下实现:</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T&gt;  </span>
<span class="line">ReqWrap&lt;T&gt;::ReqWrap(Environment* env,  </span>
<span class="line">                    v8::Local&lt;v8::Object&gt; object,  </span>
<span class="line">                    AsyncWrap::ProviderType provider)  </span>
<span class="line">    : AsyncWrap(env, object, provider),  </span>
<span class="line">      ReqWrapBase(env) {</span>
<span class="line">  // 初始化状态  </span>
<span class="line">  Reset();  </span>
<span class="line">}   </span>
<span class="line">  </span>
<span class="line">// 重置字段  </span>
<span class="line">template &lt;typename T&gt;  </span>
<span class="line">void ReqWrap&lt;T&gt;::Reset() {  </span>
<span class="line">  // 由 Libuv 调用的 C++ 层回调</span>
<span class="line">  original_callback_ = nullptr;  </span>
<span class="line">  req_.data = nullptr;  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>构造函数没有太多逻辑，只是做了一些初始化的事情。接着看发起请求时的逻辑</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"></span>
<span class="line">// 获取 Libuv 请求结构体</span>
<span class="line">T* req() { return &amp;req_; }  </span>
<span class="line"></span>
<span class="line">// 保存 Libuv 数据结构和 ReqWrap 实例的关系，发起请求时调用  </span>
<span class="line">template &lt;typename T&gt;  </span>
<span class="line">void ReqWrap&lt;T&gt;::Dispatched() {  </span>
<span class="line">  req_.data = this;  </span>
<span class="line">} </span>
<span class="line"></span>
<span class="line">// 调用 Libuv 函数  </span>
<span class="line">template &lt;typename T&gt;</span>
<span class="line">template &lt;typename LibuvFunction, typename... Args&gt;</span>
<span class="line">int ReqWrap&lt;T&gt;::Dispatch(LibuvFunction fn, Args... args) {</span>
<span class="line">  // 关联 Libuv 结构体和 C++ 请求对象</span>
<span class="line">  Dispatched();</span>
<span class="line">  CallLibuvFunction&lt;T, LibuvFunction&gt;::Call(</span>
<span class="line">      // 执行 Libuv 函数</span>
<span class="line">      fn,</span>
<span class="line">      env()-&gt;event_loop(),</span>
<span class="line">      req(),</span>
<span class="line">      // 由 Libuv 执行的回调，args 通常 handle，参数，回调</span>
<span class="line">      MakeLibuvRequestCallback&lt;T, Args&gt;::For(this, args)...);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当 Node.js 需求发起一个请求时，会先创建一个 ReqWrap 的子类对象，然后调 Dispatch 发起真正的请求，Dispatch 通过 CallLibuvFunction&lt;T, LibuvFunction&gt;::Call 调用 Libuv 的函数.</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// Detect \`int uv_foo(uv_loop_t* loop, uv_req_t* request, ...);\`.</span>
<span class="line">template &lt;typename ReqT, typename... Args&gt;</span>
<span class="line">struct CallLibuvFunction&lt;ReqT, int(*)(uv_loop_t*, ReqT*, Args...)&gt; {</span>
<span class="line">  using T = int(*)(uv_loop_t*, ReqT*, Args...);</span>
<span class="line">  template &lt;typename... PassedArgs&gt;</span>
<span class="line">  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {</span>
<span class="line">    return fn(loop, req, args...);</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span>
<span class="line">// Detect \`int uv_foo(uv_req_t* request, ...);\`.</span>
<span class="line">template &lt;typename ReqT, typename... Args&gt;</span>
<span class="line">struct CallLibuvFunction&lt;ReqT, int(*)(ReqT*, Args...)&gt; {</span>
<span class="line">  using T = int(*)(ReqT*, Args...);</span>
<span class="line">  template &lt;typename... PassedArgs&gt;</span>
<span class="line">  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {</span>
<span class="line">    return fn(req, args...);</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span>
<span class="line">// Detect \`void uv_foo(uv_req_t* request, ...);\`.</span>
<span class="line">template &lt;typename ReqT, typename... Args&gt;</span>
<span class="line">struct CallLibuvFunction&lt;ReqT, void(*)(ReqT*, Args...)&gt; {</span>
<span class="line">  using T = void(*)(ReqT*, Args...);</span>
<span class="line">  template &lt;typename... PassedArgs&gt;</span>
<span class="line">  static int Call(T fn, uv_loop_t* loop, ReqT* req, PassedArgs... args) {</span>
<span class="line">    fn(req, args...);</span>
<span class="line">    return 0;</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Node.js 针对不了的 Libuv 函数签名格式编写了不同的模版函数，不过我们不用过于纠结细节，只需要知道它最终会调用 Libuv 的某个函数，并传入了一系列参数，其中一个为 MakeLibuvRequestCallback&lt;T, Args&gt;::For(this, args)...。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 通过 req 成员找所属对象的地址</span>
<span class="line">template &lt;typename T&gt;</span>
<span class="line">ReqWrap&lt;T&gt;* ReqWrap&lt;T&gt;::from_req(T* req) {</span>
<span class="line">  return ContainerOf(&amp;ReqWrap&lt;T&gt;::req_, req);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">template &lt;typename ReqT, typename T&gt;</span>
<span class="line">struct MakeLibuvRequestCallback {</span>
<span class="line">  // 匹配第二个参数为非函数</span>
<span class="line">  static T For(ReqWrap&lt;ReqT&gt;* req_wrap, T v) {</span>
<span class="line">    return v;</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span>
<span class="line">template &lt;typename ReqT, typename... Args&gt;</span>
<span class="line">struct MakeLibuvRequestCallback&lt;ReqT, void(*)(ReqT*, Args...)&gt; {</span>
<span class="line">  using F = void(*)(ReqT* req, Args... args);</span>
<span class="line">  // Libuv 回调</span>
<span class="line">  static void Wrapper(ReqT* req, Args... args) {</span>
<span class="line">    // 通过 Libuv 结构体拿到对应的 C++ 对象</span>
<span class="line">    ReqWrap&lt;ReqT&gt;* req_wrap = ReqWrap&lt;ReqT&gt;::from_req(req);</span>
<span class="line">    // 拿到原始的回调执行</span>
<span class="line">    F original_callback = reinterpret_cast&lt;F&gt;(req_wrap-&gt;original_callback_);</span>
<span class="line">    original_callback(req, args...);</span>
<span class="line">  }</span>
<span class="line">  // 匹配第二个参数为函数</span>
<span class="line">  static F For(ReqWrap&lt;ReqT&gt;* req_wrap, F v) {</span>
<span class="line">    // 保存原来的函数</span>
<span class="line">    req_wrap-&gt;original_callback_ = reinterpret_cast&lt;typename ReqWrap&lt;ReqT&gt;::callback_t&gt;(v);</span>
<span class="line">    // 返回包裹函数</span>
<span class="line">    return Wrapper;</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>MakeLibuvRequestCallback::For 用于适配不同的 Dispatch 调用格式，例如 TCP 连接和 DNS 解析。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"> // TCP 连接</span>
<span class="line"> req_wrap-&gt;Dispatch(uv_tcp_connect,</span>
<span class="line">                    &amp;wrap-&gt;handle_,</span>
<span class="line">                    reinterpret_cast&lt;const sockaddr*&gt;(&amp;addr),</span>
<span class="line">                    AfterConnect); // 回调</span>
<span class="line"> // DNS 解析</span>
<span class="line"> req_wrap-&gt;Dispatch(uv_getaddrinfo,</span>
<span class="line">                    AfterGetAddrInfo, // 回调</span>
<span class="line">                    *hostname,</span>
<span class="line">                    nullptr,</span>
<span class="line">                    &amp;hints);</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>MakeLibuvRequestCallback::For 会遍历传入的参数，如果是非函数参数，则透传给 Libuv，如果是函数参数时会执行第二个 For 函数，第二个 For 函数封装了原始的回调，然后把一个 Wrapper 函数传入 Libuv，等到 Libuv 回调时，再执行真正的回调，通过这种劫持的方式，C++ 层可以做一些额外的事情。执行 Dispatch 后的结构图如下(图7-8)所示。</p><p>总的来说，ReqWrap 抽象了请求 Libuv 的过程，具体数据结构和操作由子类实现，看一下某个子类的实现。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 请求 Libuv 时，数据结构是 uv_connect_t，表示一次连接请求  </span>
<span class="line">class ConnectWrap : public ReqWrap&lt;uv_connect_t&gt; {  </span>
<span class="line"> public:  </span>
<span class="line">  ConnectWrap(...);  </span>
<span class="line">};  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当发起一个 TCP 连接时，使用方式如下</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// req_wrap_obj JS 层传来的 req 对象</span>
<span class="line">ConnectWrap* req_wrap = new ConnectWrap(env, req_wrap_obj, ...);</span>
<span class="line">// 发起请求，回调为 AfterConnect</span>
<span class="line">req_wrap-&gt;Dispatch(uv_tcp_connect,</span>
<span class="line">                   &amp;wrap-&gt;handle_,</span>
<span class="line">                   reinterpret_cast&lt;const sockaddr*&gt;(&amp;addr),</span>
<span class="line">                   AfterConnect);</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="js-和-c、c-层通信" tabindex="-1"><a class="header-anchor" href="#js-和-c、c-层通信"><span>JS 和 C、C++ 层通信</span></a></h2><p>接下来我们看一下 JS 和 C、C++ 层的通信，Node.js 很多功能都是由 C、C++ 实现，然后暴露到 JS 层使用的，所以当我们调用 JS 代码时，就会进入 C++ 层，接着 C++ 层会进入 Libuv 的 C 层，等到 Libuv 完成操作后就会回调 C++ 代码，最终 C++ 代码再回调 JS 层。</p><h3 id="js-调用-c" tabindex="-1"><a class="header-anchor" href="#js-调用-c"><span>JS 调用 C++ ？</span></a></h3><p>JS 本身是没有网络、文件和进程这些功能的，在 Node.js 里，这些功能需要通过底层的 C、C++ 实现，最终通过 JS API 提供给用户使用。那么当我们调用一个 JS API 时，底层发生了什么呢？我们以 TCP 模块为例，下面的代码摘自 Node.js 的 net 模块。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> <span class="token punctuation">{</span> <span class="token constant">TCP</span> <span class="token punctuation">}</span><span class="token operator">=</span> process<span class="token punctuation">.</span><span class="token function">binding</span><span class="token punctuation">(</span><span class="token string">&#39;tcp_wrap&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    </span>
<span class="line"><span class="token keyword">const</span> tcp <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCP</span><span class="token punctuation">(</span><span class="token operator">...</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>在 Node.js 中，C++ 模块（类）一般只会定义对应的 Libuv 结构体和一系列函数，然后创建一个函数模版，并传入一个回调，接着把这些函数挂载到函数模板中，最后通过函数模板返回一个函数 F 给 JS 层使用。我们从 C++ 的层面先分析执行 new TCP() 的逻辑，再分析 bind 的逻辑，这两个逻辑涉及的机制是其它 C++ 模块也会使用到的。首先看看 TCP 在 C++ 层的实现。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void TCPWrap::Initialize(Local&lt;Object&gt; target,</span>
<span class="line">                         Local&lt;Value&gt; unused,</span>
<span class="line">                         Local&lt;Context&gt; context,</span>
<span class="line">                         void* priv) {</span>
<span class="line">  Environment* env = Environment::GetCurrent(context);</span>
<span class="line">  // 创建一个函数模版</span>
<span class="line">  Local&lt;FunctionTemplate&gt; t = env-&gt;NewFunctionTemplate(New);</span>
<span class="line">  // 函数名</span>
<span class="line">  Local&lt;String&gt; tcpString = FIXED_ONE_BYTE_STRING(env-&gt;isolate(), &quot;TCP&quot;);</span>
<span class="line">  t-&gt;SetClassName(tcpString);</span>
<span class="line">  // 可关联的 C++ 对象个数</span>
<span class="line">  t-&gt;InstanceTemplate()-&gt;SetInternalFieldCount(StreamBase::kInternalFieldCount);</span>
<span class="line">  // 设置原型方法</span>
<span class="line">  env-&gt;SetProtoMethod(t, &quot;open&quot;, Open);</span>
<span class="line">  env-&gt;SetProtoMethod(t, &quot;bind&quot;, Bind);</span>
<span class="line">  // ...</span>
<span class="line">  // 根据函数模块导出一个函数到 JS 层</span>
<span class="line">  target-&gt;Set(env-&gt;context(),</span>
<span class="line">              tcpString,</span>
<span class="line">              t-&gt;GetFunction(env-&gt;context()).ToLocalChecked()).Check();</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当 JS 层执行 new TCP 时，C++ 层就会创建一个对象（ JS 层拿到的对象），然后把这个对象和 JS 层传入的参数传给 TCPWrap::New 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void TCPWrap::New(const FunctionCallbackInfo&lt;Value&gt;&amp; args) {  </span>
<span class="line">  new TCPWrap(env, args.This(), ...);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>TCPWrap 继承了 HandleWrap。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">HandleWrap::HandleWrap(Environment* env,  </span>
<span class="line">                       Local&lt;Object&gt; object,  </span>
<span class="line">                       uv_handle_t* handle,  </span>
<span class="line">                       AsyncWrap::ProviderType provider)  </span>
<span class="line">    : AsyncWrap(env, object, provider),  </span>
<span class="line">      state_(kInitialized),  </span>
<span class="line">      handle_(handle) {  </span>
<span class="line">  // 保存 Libuv handle 和 C++ 对象的关系  </span>
<span class="line">  handle_-&gt;data = this;  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>HandleWrap 保存了 Libuv 结构体和 C++ 对象的关系，这样我们从 Libuv 回调时就可以知道 handle 对应的 C++ 对象。HandleWrap 继承了 BaseObject。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 把对象存储到 persistent_handle_ 中，需要的时候通过 object() 取出来  </span>
<span class="line">BaseObject::BaseObject(Environment* env, v8::Local&lt;v8::Object&gt; object)  </span>
<span class="line">    : persistent_handle_(env-&gt;isolate(), object), env_(env) {  </span>
<span class="line">  // 把 this 存到 object中，BaseObject::kSlot 为 0  </span>
<span class="line">  object-&gt;SetAlignedPointerInInternalField(BaseObject::kSlot, static_cast&lt;void*&gt;(this));    </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>前面讲过，SetAlignedPointerInInternalField 函数做的事情就是把一个值（TCPWrap对象）保存到 JS 对象 object 里。如下图7-9所示。</p><p>这时候 new TCP 就执行完毕了，下面我们会看到这些关联起来的对象有什么作用，接着看在 JS 层执行tcp.connect(...) 函数的逻辑。</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token keyword">const</span> req <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCPConnectWrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>oncomplete <span class="token operator">=</span> afterConnect<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>address <span class="token operator">=</span> address<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>port <span class="token operator">=</span> port<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>localAddress <span class="token operator">=</span> localAddress<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>localPort <span class="token operator">=</span> localPort<span class="token punctuation">;</span></span>
<span class="line">self<span class="token punctuation">.</span>_handle<span class="token punctuation">.</span><span class="token function">connect</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> address<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着看 C++ 层 connect 函数。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">template &lt;typename T&gt;</span>
<span class="line">void TCPWrap::Connect(...) {</span>
<span class="line">  TCPWrap* wrap;</span>
<span class="line">  // 从 JS 对象拿到关联的 C++ 对象</span>
<span class="line">  /*</span>
<span class="line">        wrap = args.Holder()-&gt;GetAlignedPointerFromInternalField(BaseObject::kSlot));</span>
<span class="line">  */</span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap,</span>
<span class="line">                          args.Holder(),</span>
<span class="line">                          args.GetReturnValue().Set(UV_EBADF));</span>
<span class="line">  // 从 C++ 对象 TCPWrap 中获得 Libuv 的 handle 结构体</span>
<span class="line">  uv_tcp_connect(&amp;wrap-&gt;handle_, ...);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们只需看一下 ASSIGN_OR_RETURN_UNWRAP 宏的逻辑，主要是从 args.Holder() 中获取对应的 C++ 对象（TCPWrap），然后就可以使用 TCPWrap 对象的 handle 去请求 Libuv 了。</p><h2 id="c-调用-libuv" tabindex="-1"><a class="header-anchor" href="#c-调用-libuv"><span>C++ 调用 Libuv</span></a></h2><p>那么 C++ 调用 Libuv 又是如何串起来的呢？来详细看一下 connect 函数的代码。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">void TCPWrap::Connect(const FunctionCallbackInfo&lt;Value&gt;&amp; args,  </span>
<span class="line">    std::function&lt;int(const char* ip_address, T* addr)&gt; uv_ip_addr) {  </span>
<span class="line">  Environment* env = Environment::GetCurrent(args);  </span>
<span class="line">  </span>
<span class="line">  TCPWrap* wrap;  </span>
<span class="line">  ASSIGN_OR_RETURN_UNWRAP(&amp;wrap,  </span>
<span class="line">                          args.Holder(),  </span>
<span class="line">                          args.GetReturnValue().Set(UV_EBADF));  </span>
<span class="line">  </span>
<span class="line">  // 第一个参数是 TCPConnectWrap 对象</span>
<span class="line">  Local&lt;Object&gt; req_wrap_obj = args[0].As&lt;Object&gt;();  </span>
<span class="line">  // 忽略其他参数处理</span>
<span class="line">  // 创建一个对象请求 Libuv</span>
<span class="line">  ConnectWrap* req_wrap =  new ConnectWrap(env,  req_wrap_obj, ...);  </span>
<span class="line">  req_wrap-&gt;Dispatch(uv_tcp_connect,  </span>
<span class="line">                     &amp;wrap-&gt;handle_,  </span>
<span class="line">                     reinterpret_cast&lt;const sockaddr*&gt;(&amp;addr),  </span>
<span class="line">                     AfterConnect);  </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>ConnectWrap 是 C++ 类，继承了 BaseObject，req_wrap_obj 是 JS 对象，它们会互相关联，和之前分析的一样。</p><p>图7-10</p><p>另外，ConnectWrap 还继承了 ReqWrap，ReqWrap 是用于管理 Libuv 请求的。接着看一下 Dispatch。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">// 调用 Libuv 函数  </span>
<span class="line">int ReqWrap&lt;T&gt;::Dispatch(LibuvFunction fn, Args... args) {  </span>
<span class="line">  // 保存 Libuv 结构体和 C++ 层对象 ConnectWrap 的关系    </span>
<span class="line">  req_.data = this;    </span>
<span class="line">  CallLibuvFunction&lt;T, LibuvFunction&gt;::Call(  </span>
<span class="line">      fn,  </span>
<span class="line">      env()-&gt;event_loop(),  </span>
<span class="line">      req(),  </span>
<span class="line">      MakeLibuvRequestCallback&lt;T, Args&gt;::For(this, args)...);   </span>
<span class="line">}  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>调用 Libuv 之前的结构如下图所示：7-11</p><p>接下来分析调用 Libuv 的具体过程：</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">uv_tcp_connect(  </span>
<span class="line">  req(),  </span>
<span class="line">  &amp;wrap-&gt;handle_,  </span>
<span class="line">  reinterpret_cast&lt;const sockaddr*&gt;(&amp;addr),  </span>
<span class="line">  AfterConnect</span>
<span class="line">);  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再看看uv_tcp_connect做了什么。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">    int uv_tcp_connect(uv_connect_t* req,  </span>
<span class="line">                       uv_tcp_t* handle,  </span>
<span class="line">                       const struct sockaddr* addr,  </span>
<span class="line">                       uv_connect_cb cb) {  </span>
<span class="line">      // ...  </span>
<span class="line">      return uv__tcp_connect(req, handle, addr, addrlen, cb);  </span>
<span class="line">    }  </span>
<span class="line">      </span>
<span class="line">    int uv__tcp_connect(uv_connect_t* req,  </span>
<span class="line">                        uv_tcp_t* handle,  </span>
<span class="line">                        const struct sockaddr* addr,  </span>
<span class="line">                        unsigned int addrlen,  </span>
<span class="line">                        uv_connect_cb cb) {  </span>
<span class="line">      int err;  </span>
<span class="line">      int r;  </span>
<span class="line">      </span>
<span class="line">      // 非阻塞发起连接</span>
<span class="line">      connect(uv__stream_fd(handle), addr, addrlen);</span>
<span class="line">      // 保存回调 AfterConnect</span>
<span class="line">      req-&gt;cb = cb;</span>
<span class="line">      // 关联起来  </span>
<span class="line">      req-&gt;handle = (uv_stream_t*) handle;  </span>
<span class="line">      // 注册事件，连接结束后触发，然后执行回调</span>
<span class="line">      uv__io_start(handle-&gt;loop, &amp;handle-&gt;io_watcher, POLLOUT);</span>
<span class="line">      // ...  </span>
<span class="line">    }  </span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Libuv 中保存了请求上下文，比如回调，并把 req 和 handle 做了关联，在执行回调时会使用，如下图所示。7-12</p><h2 id="libuv-回调-c" tabindex="-1"><a class="header-anchor" href="#libuv-回调-c"><span>Libuv 回调 C++</span></a></h2><p>分析完 C++ 调用 Libuv 后，我们看看 Libuv 回调 C++ 的。当连接结束后，比如完成了三次握手，操作系统会通知 Libuv，Libuv 会执行 uv__stream_connect 处理连接结果 。</p><div class="language-c line-numbers-mode" data-highlighter="prismjs" data-ext="c" data-title="c"><pre><code><span class="line"><span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">uv__stream_connect</span><span class="token punctuation">(</span><span class="token class-name">uv_stream_t</span><span class="token operator">*</span> stream<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">int</span> error<span class="token punctuation">;</span></span>
<span class="line">  <span class="token class-name">uv_connect_t</span><span class="token operator">*</span> req <span class="token operator">=</span> stream<span class="token operator">-&gt;</span>connect_req<span class="token punctuation">;</span></span>
<span class="line">  <span class="token class-name">socklen_t</span> errorsize <span class="token operator">=</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 获取连接结果</span></span>
<span class="line">  <span class="token function">getsockopt</span><span class="token punctuation">(</span><span class="token function">uv__stream_fd</span><span class="token punctuation">(</span>stream<span class="token punctuation">)</span><span class="token punctuation">,</span></span>
<span class="line">             SOL_SOCKET<span class="token punctuation">,</span></span>
<span class="line">             SO_ERROR<span class="token punctuation">,</span></span>
<span class="line">             <span class="token operator">&amp;</span>error<span class="token punctuation">,</span></span>
<span class="line">             <span class="token operator">&amp;</span>errorsize<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    error <span class="token operator">=</span> <span class="token function">UV__ERR</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 执行回调</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>req<span class="token operator">-&gt;</span>cb<span class="token punctuation">)</span></span>
<span class="line">    req<span class="token operator">-&gt;</span><span class="token function">cb</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> error<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>uv__stream_connect 从操作系统获取连接结果，然后执行 C++ 层回调，从前面的分析中可以知道回调函数是 AfterConnect。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line"></span>
<span class="line">void ConnectionWrap&lt;WrapType, UVType&gt;::AfterConnect(uv_connect_t* req,  </span>
<span class="line">                                                    int status) {  </span>
<span class="line">  // 从 Libuv 结构体拿到 C++ 层的请求对象  </span>
<span class="line">  std::unique_ptr&lt;ConnectWrap&gt; req_wrap(static_cast&lt;ConnectWrap*&gt;(req-&gt;data));  </span>
<span class="line">  // 从 C++ 层请求对象拿到对应的 handle 结构体（Libuv 里关联起来的），</span>
<span class="line">  // 再通过 handle 拿到对应的C++层 TCPWrap 对象（HandleWrap 关联的）  </span>
<span class="line">  WrapType* wrap = static_cast&lt;WrapType*&gt;(req-&gt;handle-&gt;data);  </span>
<span class="line">  Environment* env = wrap-&gt;env();  </span>
<span class="line">  ...  </span>
<span class="line">  Local&lt;Value&gt; argv[5] = {  </span>
<span class="line">    Integer::New(env-&gt;isolate(), status),  </span>
<span class="line">    wrap-&gt;object(),  </span>
<span class="line">    req_wrap-&gt;object(),  </span>
<span class="line">    Boolean::New(env-&gt;isolate(), readable),  </span>
<span class="line">    Boolean::New(env-&gt;isolate(), writable)  </span>
<span class="line">  };  </span>
<span class="line">  // 回调 JS 层 oncomplete  </span>
<span class="line">  req_wrap-&gt;MakeCallback(env-&gt;oncomplete_string(), </span>
<span class="line">                         arraysize(argv), </span>
<span class="line">                         argv);  </span>
<span class="line">}    </span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>AfterConnect 通过之前的关联关系拿到 TCPWrap 对象，最后再通过 req_wrap 对象（ConnectWrap）的 MakeCallback 执行 JS 回调。</p><h2 id="c-回调-js" tabindex="-1"><a class="header-anchor" href="#c-回调-js"><span>C++ 回调 JS</span></a></h2><p>接着看 MakeCallback 是如何回调 JS 的。</p><div class="language-c++ line-numbers-mode" data-highlighter="prismjs" data-ext="c++" data-title="c++"><pre><code><span class="line">inline v8::MaybeLocal&lt;v8::Value&gt; AsyncWrap::MakeCallback(</span>
<span class="line">    const v8::Local&lt;v8::String&gt; symbol,</span>
<span class="line">    int argc,</span>
<span class="line">    v8::Local&lt;v8::Value&gt;* argv) {</span>
<span class="line">  return MakeCallback(symbol.As&lt;v8::Name&gt;(), argc, argv);</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">inline v8::MaybeLocal&lt;v8::Value&gt; AsyncWrap::MakeCallback(</span>
<span class="line">    const v8::Local&lt;v8::Name&gt; symbol,</span>
<span class="line">    int argc,</span>
<span class="line">    v8::Local&lt;v8::Value&gt;* argv) {</span>
<span class="line">    </span>
<span class="line">  v8::Local&lt;v8::Value&gt; cb_v;</span>
<span class="line">  // 通过 ConnectWrap 的 object() 获取关联的 JS 对象并获取 oncomplete 属性的值</span>
<span class="line">  object()-&gt;Get(env()-&gt;context(), symbol).ToLocal(&amp;cb_v)</span>
<span class="line">    </span>
<span class="line">  return MakeCallback(cb_v.As&lt;v8::Function&gt;(), argc, argv);</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这样就完成了回调 JS 层。整个过程翻译成 JS 大致如下：</p><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js" data-title="js"><pre><code><span class="line"><span class="token comment">// 操作系统</span></span>
<span class="line"><span class="token keyword">let</span> fd <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">socket</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token operator">++</span>fd<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">connect</span><span class="token punctuation">(</span><span class="token parameter">fd<span class="token punctuation">,</span> addr<span class="token punctuation">,</span> port<span class="token punctuation">,</span> req</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Promise</span><span class="token punctuation">(</span><span class="token parameter">resolve</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token comment">// 模拟</span></span>
<span class="line">        <span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token function">resolve</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">//Libuv  </span></span>
<span class="line"><span class="token keyword">async</span> <span class="token keyword">function</span> <span class="token function">uv_tcp_connect</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> handle<span class="token punctuation">,</span> addr<span class="token punctuation">,</span> port<span class="token punctuation">,</span> cb</span><span class="token punctuation">)</span> <span class="token punctuation">{</span> </span>
<span class="line">    handle<span class="token punctuation">.</span>fd <span class="token operator">=</span> <span class="token function">socket</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    req<span class="token punctuation">.</span>handle <span class="token operator">=</span> handle<span class="token punctuation">;</span></span>
<span class="line">    req<span class="token punctuation">.</span>cb <span class="token operator">=</span> cb<span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> status <span class="token operator">=</span> <span class="token keyword">await</span> <span class="token function">connect</span><span class="token punctuation">(</span>handle<span class="token punctuation">.</span>fd<span class="token punctuation">,</span> addr<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    req<span class="token punctuation">.</span><span class="token function">cb</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> status<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span>    </span>
<span class="line">      </span>
<span class="line"><span class="token comment">// C++  </span></span>
<span class="line"><span class="token keyword">class</span> <span class="token class-name">ConnectWrap</span> <span class="token punctuation">{</span></span>
<span class="line">    uv_connect_t <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token parameter">object</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        object<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">this</span><span class="token punctuation">.</span>object <span class="token operator">=</span> object<span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">    <span class="token function">Dispatch</span><span class="token punctuation">(</span><span class="token parameter">fn<span class="token punctuation">,</span> <span class="token operator">...</span>args</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token keyword">this</span><span class="token punctuation">.</span>uv_connect_t<span class="token punctuation">.</span>data <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token function">fn</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>uv_connect_t<span class="token punctuation">,</span> <span class="token operator">...</span>args<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">    <span class="token function">MakeCallback</span><span class="token punctuation">(</span><span class="token parameter">key<span class="token punctuation">,</span> <span class="token operator">...</span>args</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token keyword">this</span><span class="token punctuation">.</span>object<span class="token punctuation">[</span>key<span class="token punctuation">]</span><span class="token punctuation">(</span><span class="token operator">...</span>args<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"><span class="token keyword">class</span> <span class="token class-name">TCPWrap</span> <span class="token punctuation">{</span>    </span>
<span class="line">  uv_tcp_t <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>    </span>
<span class="line">  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">this</span><span class="token punctuation">.</span>uv_tcp_t<span class="token punctuation">.</span>data <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  <span class="token keyword">static</span> <span class="token function">Connect</span><span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> addr<span class="token punctuation">,</span> port</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>    </span>
<span class="line">    <span class="token keyword">const</span> tcpWrap <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">;</span>    </span>
<span class="line">    <span class="token keyword">const</span> connectWrap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ConnectWrap</span><span class="token punctuation">(</span>req<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    connectWrap<span class="token punctuation">.</span><span class="token function">Dispatch</span><span class="token punctuation">(</span></span>
<span class="line">        uv_tcp_connect<span class="token punctuation">,</span> </span>
<span class="line">        tcpWrap<span class="token punctuation">.</span>uv_tcp_t<span class="token punctuation">,</span>  </span>
<span class="line">        addr<span class="token punctuation">,</span>  </span>
<span class="line">        port<span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">(</span><span class="token parameter">req<span class="token punctuation">,</span> status</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span> </span>
<span class="line">          <span class="token keyword">const</span> connectWrap <span class="token operator">=</span> req<span class="token punctuation">.</span>data<span class="token punctuation">;</span></span>
<span class="line">          <span class="token keyword">const</span> tcpWrap <span class="token operator">=</span> req<span class="token punctuation">.</span>handle<span class="token punctuation">.</span>data<span class="token punctuation">;</span></span>
<span class="line">          connectWrap<span class="token punctuation">.</span><span class="token function">MakeCallback</span><span class="token punctuation">(</span><span class="token string">&#39;oncomplete&#39;</span><span class="token punctuation">,</span> tcpWrap<span class="token punctuation">,</span> connectWrap<span class="token punctuation">,</span> status<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">)</span><span class="token punctuation">;</span>    </span>
<span class="line"> <span class="token punctuation">}</span>    </span>
<span class="line">  </span>
<span class="line"><span class="token punctuation">}</span>    </span>
<span class="line">  </span>
<span class="line"><span class="token keyword">function</span> <span class="token function">FunctionTemplate</span><span class="token punctuation">(</span><span class="token parameter">cb</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>    </span>
<span class="line">   <span class="token keyword">function</span> <span class="token function">Tmp</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">    Object<span class="token punctuation">.</span><span class="token function">assign</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">,</span> map<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">    cb <span class="token operator">&amp;&amp;</span> <span class="token function">cb</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">   <span class="token punctuation">}</span>  </span>
<span class="line">   <span class="token keyword">const</span> map <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>  </span>
<span class="line">   <span class="token keyword">return</span> <span class="token punctuation">{</span>  </span>
<span class="line">    <span class="token function-variable function">PrototypeTemplate</span><span class="token operator">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">        <span class="token keyword">return</span> <span class="token punctuation">{</span>  </span>
<span class="line">            <span class="token function-variable function">set</span><span class="token operator">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">k<span class="token punctuation">,</span> v</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">                <span class="token class-name">Tmp</span><span class="token punctuation">.</span>prototype<span class="token punctuation">[</span>k<span class="token punctuation">]</span> <span class="token operator">=</span> v<span class="token punctuation">;</span>  </span>
<span class="line">            <span class="token punctuation">}</span>  </span>
<span class="line">        <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span>  </span>
<span class="line">    <span class="token function-variable function">InstanceTemplate</span><span class="token operator">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">        <span class="token keyword">return</span> <span class="token punctuation">{</span>  </span>
<span class="line">            <span class="token function-variable function">set</span><span class="token operator">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token parameter">k<span class="token punctuation">,</span> v</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">                map<span class="token punctuation">[</span>k<span class="token punctuation">]</span> <span class="token operator">=</span> v<span class="token punctuation">;</span>  </span>
<span class="line">            <span class="token punctuation">}</span>  </span>
<span class="line">        <span class="token punctuation">}</span>  </span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span>  </span>
<span class="line">    <span class="token function">GetFunction</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  </span>
<span class="line">        <span class="token keyword">return</span> Tmp<span class="token punctuation">;</span>  </span>
<span class="line">    <span class="token punctuation">}</span>  </span>
<span class="line">   <span class="token punctuation">}</span>   </span>
<span class="line">  </span>
<span class="line"><span class="token punctuation">}</span>    </span>
<span class="line">  </span>
<span class="line"><span class="token keyword">const</span> TCPFunctionTemplate <span class="token operator">=</span> <span class="token function">FunctionTemplate</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">target</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span> target<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCPWrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">)</span>    </span>
<span class="line">  </span>
<span class="line">TCPFunctionTemplate<span class="token punctuation">.</span><span class="token function">PrototypeTemplate</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span><span class="token string">&#39;connect&#39;</span><span class="token punctuation">,</span> TCPWrap<span class="token punctuation">.</span>Connect<span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line">TCPFunctionTemplate<span class="token punctuation">.</span><span class="token function">InstanceTemplate</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span><span class="token string">&#39;name&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;hi&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token keyword">const</span> <span class="token constant">TCP</span> <span class="token operator">=</span> TCPFunctionTemplate<span class="token punctuation">.</span><span class="token function">GetFunction</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> TCPConnectWrapFunctionTemplate <span class="token operator">=</span> <span class="token function">FunctionTemplate</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    </span>
<span class="line"><span class="token keyword">const</span> TCPConnectWrap <span class="token operator">=</span> TCPConnectWrapFunctionTemplate<span class="token punctuation">.</span><span class="token function">GetFunction</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> </span>
<span class="line"></span>
<span class="line"><span class="token comment">// JS  </span></span>
<span class="line"><span class="token keyword">const</span> tcp <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCP</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>  </span>
<span class="line"><span class="token keyword">const</span> req <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TCPConnectWrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> address <span class="token operator">=</span> <span class="token string">&#39;127.0.0.1&#39;</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> port <span class="token operator">=</span> <span class="token number">80</span><span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span><span class="token function-variable function">oncomplete</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&#39;connect 成功&#39;</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>address <span class="token operator">=</span> address<span class="token punctuation">;</span></span>
<span class="line">req<span class="token punctuation">.</span>port <span class="token operator">=</span> port<span class="token punctuation">;</span></span>
<span class="line">tcp<span class="token punctuation">.</span><span class="token function">connect</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> address<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>总结 这节课我们围绕 C++ 层是如何把 Libuv 的功能引入 JS 的，详细讲解了 C++ 层核心内容。</p><p>Node.js 通过 V8 提供的函数模版和对象模版来拓展 JS 的功能。 C++ 层的核心数据结构大多数是 C++ 类的基类，它们封装了很多通用的逻辑。BaseObject 用于 JS 和 C++ 对象的管理，AsyncWrap 用于异步回调 JS，HandleWrap 和 ReqWrap 是对 Libuv handle 和 request 的封装，这是我们必须理解的核心数据结构，后面的课程中会大量引用。 我们沿着 JS 到 C++ 再到 Libuv，然后从 Libuv 到 C++，再到 JS 的路线进行了详细的分析，在这个过程中，我们需要捋清楚 JS、C++ 和 Libuv 三层之间，数据结构的关联关系，否则就会陷入迷雾中。</p>`,136)]))}const d=s(i,[["render",p],["__file","libuv_js.html.vue"]]),o=JSON.parse('{"path":"/nodejs/deep_into_nodejs/libuv/libuv_js.html","title":"libuv功能是如何引入到js的","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"v8基础知识","slug":"v8基础知识","link":"#v8基础知识","children":[]},{"level":2,"title":"C++ 层核心数据结构","slug":"c-层核心数据结构","link":"#c-层核心数据结构","children":[]},{"level":2,"title":"JS 和 C、C++ 层通信","slug":"js-和-c、c-层通信","link":"#js-和-c、c-层通信","children":[{"level":3,"title":"JS 调用 C++ ？","slug":"js-调用-c","link":"#js-调用-c","children":[]}]},{"level":2,"title":"C++ 调用 Libuv","slug":"c-调用-libuv","link":"#c-调用-libuv","children":[]},{"level":2,"title":"Libuv 回调 C++","slug":"libuv-回调-c","link":"#libuv-回调-c","children":[]},{"level":2,"title":"C++ 回调 JS","slug":"c-回调-js","link":"#c-回调-js","children":[]}],"git":{"updatedTime":1705375577000,"contributors":[{"name":"sindorei","email":"wupan1030@foxmail.com","commits":1,"url":"https://github.com/sindorei"}]},"filePathRelative":"nodejs/deep_into_nodejs/libuv/libuv_js.md"}');export{d as comp,o as data};