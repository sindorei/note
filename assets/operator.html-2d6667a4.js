import{_ as e,p as i,q as d,a1 as l}from"./framework-5866ffd3.js";const a={},c=l(`<h1 id="运算符" tabindex="-1"><a class="header-anchor" href="#运算符" aria-hidden="true">#</a> 运算符</h1><h2 id="算术运算符" tabindex="-1"><a class="header-anchor" href="#算术运算符" aria-hidden="true">#</a> 算术运算符</h2><ul><li><code>+</code> 加</li><li><code>-</code> 减</li><li><code>*</code> 乘</li><li><code>/</code> 除</li><li><code>%</code> 取余</li><li><code>^</code> 乘幂</li><li><code>-</code> 负号</li><li><code>//</code> 整除运算符(&gt;=lua5.3)</li></ul><h2 id="关系运算符" tabindex="-1"><a class="header-anchor" href="#关系运算符" aria-hidden="true">#</a> 关系运算符</h2><ul><li><code>==</code></li><li><code>~=</code> 不等于</li><li><code>&gt;</code></li><li><code>&lt;</code></li><li><code>&gt;=</code></li><li><code>&lt;=</code></li></ul><h2 id="逻辑运算符" tabindex="-1"><a class="header-anchor" href="#逻辑运算符" aria-hidden="true">#</a> 逻辑运算符</h2><ul><li><code>and</code></li><li><code>or</code></li><li><code>not</code></li></ul><h2 id="位运算符" tabindex="-1"><a class="header-anchor" href="#位运算符" aria-hidden="true">#</a> 位运算符</h2><ul><li><code>&amp;</code>: bitwise AND</li><li><code>|</code>: bitwise OR</li><li><code>~</code>: bitwise exclusive OR</li><li><code>&gt;&gt;</code>: right shift</li><li><code>&lt;&lt;</code>: left shift</li><li><code>~</code>: unary bitwise NOT</li></ul><h2 id="其他运算符" tabindex="-1"><a class="header-anchor" href="#其他运算符" aria-hidden="true">#</a> 其他运算符</h2><ul><li><code>..</code> 连接2个字符串</li><li><code>#</code> 一元运算符，返回字符串或表的长度</li></ul><h2 id="运算符优先级" tabindex="-1"><a class="header-anchor" href="#运算符优先级" aria-hidden="true">#</a> 运算符优先级</h2><p>从低到高：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>or
and
&lt;     &gt;     &lt;=    &gt;=    ~=    ==
|
~
&amp;
&lt;&lt;    &gt;&gt;
..
+     -
*     /     //    %
unary operators (not   #     -     ~)
^
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,14),o=[c];function n(r,t){return i(),d("div",null,o)}const h=e(a,[["render",n],["__file","operator.html.vue"]]);export{h as default};
