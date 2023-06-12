import{_ as n,p as a,q as s,a1 as e}from"./framework-5866ffd3.js";const l={},i=e(`<h1 id="模块" tabindex="-1"><a class="header-anchor" href="#模块" aria-hidden="true">#</a> 模块</h1><p>Lua 的模块是由变量、函数等已知元素组成的<code>table</code>，因此创建一个模块很简单，就是创建一个<code>table</code>，然后把需要导出的常量、函数放入其中，最后返回这个 <code>table</code>就行。</p><h2 id="导出模块" tabindex="-1"><a class="header-anchor" href="#导出模块" aria-hidden="true">#</a> 导出模块</h2><div class="language-lua line-numbers-mode" data-ext="lua"><pre class="language-lua"><code><span class="token comment">-- 文件名为 module.lua</span>
<span class="token comment">-- 定义一个名为 module 的模块</span>
module <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>
 
<span class="token comment">-- 定义一个常量</span>
module<span class="token punctuation">.</span>constant <span class="token operator">=</span> <span class="token string">&quot;这是一个常量&quot;</span>
 
<span class="token comment">-- 定义一个函数</span>
<span class="token keyword">function</span> module<span class="token punctuation">.</span><span class="token function">func1</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    io<span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span><span class="token string">&quot;这是一个公有函数！\\n&quot;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>
 
<span class="token keyword">local</span> <span class="token keyword">function</span> <span class="token function">func2</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">&quot;这是一个私有函数！&quot;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>
 
<span class="token keyword">function</span> module<span class="token punctuation">.</span><span class="token function">func3</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token function">func2</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>
 
<span class="token keyword">return</span> module
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="导入模块" tabindex="-1"><a class="header-anchor" href="#导入模块" aria-hidden="true">#</a> 导入模块</h2><ul><li><code>require(&quot;&lt;模块名&gt;&quot;)</code></li><li><code>require &quot;&lt;模块名&gt;&quot;</code></li></ul><p>执行 require 后会返回一个由模块常量或函数组成的 table，并且还会定义一个包含该 table 的全局变量。</p><div class="language-lua line-numbers-mode" data-ext="lua"><pre class="language-lua"><code><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&quot;module&quot;</span><span class="token punctuation">)</span>
 
<span class="token function">print</span><span class="token punctuation">(</span>module<span class="token punctuation">.</span>constant<span class="token punctuation">)</span>
 
module<span class="token punctuation">.</span><span class="token function">func3</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-lua line-numbers-mode" data-ext="lua"><pre class="language-lua"><code><span class="token keyword">local</span> m <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&quot;module&quot;</span><span class="token punctuation">)</span>
 
<span class="token function">print</span><span class="token punctuation">(</span>m<span class="token punctuation">.</span>constant<span class="token punctuation">)</span>
 
m<span class="token punctuation">.</span><span class="token function">func3</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="加载机制" tabindex="-1"><a class="header-anchor" href="#加载机制" aria-hidden="true">#</a> 加载机制</h2><p>对于自定义的模块，模块文件不是放在哪个文件目录都行，函数 require 有它自己的文件路径加载策略，它会尝试从 Lua 文件或 C 程序库中加载模块。</p><p>require 用于搜索 Lua 文件的路径是存放在全局变量 package.path 中，当 Lua 启动后，会以环境变量 <code>LUA_PATH</code> 的值来初始这个环境变量。如果没有找到该环境变量，则使用一个编译时定义的默认路径来初始化。</p><p>当然，如果没有 <code>LUA_PATH</code> 这个环境变量，也可以自定义设置，在当前用户根目录下打开 <code>.profile</code> 文件（没有则创建，打开 .bashrc 文件也可以），例如把 &quot;~/lua/&quot; 路径加入 <code>LUA_PATH</code>环境变量里：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment">#LUA_PATH</span>
<span class="token builtin class-name">export</span> <span class="token assign-left variable">LUA_PATH</span><span class="token operator">=</span><span class="token string">&quot;~/lua/?.lua;;&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>文件路径以 &quot;;&quot; 号分隔，最后的 2 个 &quot;;;&quot; 表示新加的路径后面加上原来的默认路径。</p><p>接着，更新环境变量参数，使之立即生效。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token builtin class-name">source</span> ~/.profile
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这时假设 package.path 的值是：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>/Users/dengjoe/lua/?.lua;./?.lua;/usr/local/share/lua/5.1/?.lua;/usr/local/share/lua/5.1/?/init.lua;/usr/local/lib/lua/5.1/?.lua;/usr/local/lib/lua/5.1/?/init.lua
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>那么调用 require(&quot;module&quot;) 时就会尝试打开以下文件目录去搜索目标。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>/Users/dengjoe/lua/module.lua;
./module.lua
/usr/local/share/lua/5.1/module.lua
/usr/local/share/lua/5.1/module/init.lua
/usr/local/lib/lua/5.1/module.lua
/usr/local/lib/lua/5.1/module/init.lua
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果找过目标文件，则会调用 package.loadfile 来加载模块。否则，就会去找 C 程序库。</p><p>搜索的文件路径是从全局变量 package.cpath 获取，而这个变量则是通过环境变量 LUA_CPATH 来初始。</p><p>搜索的策略跟上面的一样，只不过现在换成搜索的是 so 或 dll 类型的文件。如果找得到，那么 require 就会通过 package.loadlib 来加载它。</p><h2 id="c-包" tabindex="-1"><a class="header-anchor" href="#c-包" aria-hidden="true">#</a> C 包</h2>`,25),t=[i];function u(c,o){return a(),s("div",null,t)}const d=n(l,[["render",u],["__file","module.html.vue"]]);export{d as default};
