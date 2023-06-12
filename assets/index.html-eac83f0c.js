import{_ as e,M as s,p as i,q as l,R as n,t,N as c,a1 as d}from"./framework-5866ffd3.js";const r={},o=d(`<h1 id="基础语法" tabindex="-1"><a class="header-anchor" href="#基础语法" aria-hidden="true">#</a> 基础语法</h1><h2 id="注释" tabindex="-1"><a class="header-anchor" href="#注释" aria-hidden="true">#</a> 注释</h2><div class="language-lua line-numbers-mode" data-ext="lua"><pre class="language-lua"><code><span class="token comment">-- 单行注释</span>


<span class="token comment">--[[
 多行注释
 多行注释
 --]]</span>
 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="标识符" tabindex="-1"><a class="header-anchor" href="#标识符" aria-hidden="true">#</a> 标识符</h2><ul><li>标示符以一个字母 A 到 Z 或 a 到 z 或下划线 _ 开头后加上 0 个或多个字母，下划线，数字（0 到 9）。</li><li>不能是Lua关键字。</li><li>最好不要使用下划线加大写字母的标示符，因为Lua的保留字也是这样的。</li><li>区分大小写。</li></ul><p>关键字：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code> and       break     do        else      elseif    end
 false     for       function  goto      if        in
 local     nil       not       or        repeat    return
 then      true      until     while
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="变量申明" tabindex="-1"><a class="header-anchor" href="#变量申明" aria-hidden="true">#</a> 变量申明</h2><p>BNF格式： <code>var ::= Name</code></p><div class="language-lua line-numbers-mode" data-ext="lua"><pre class="language-lua"><code>str <span class="token operator">=</span> <span class="token string">&#39;Hello&#39;</span> <span class="token comment">-- 全局变量</span>
<span class="token keyword">local</span> str2 <span class="token operator">=</span> <span class="token string">&#39;World!&#39;</span> <span class="token comment">-- 局部变量</span>

a<span class="token punctuation">,</span> b<span class="token punctuation">,</span> c <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token number">2</span> <span class="token comment">-- 多个变量同时赋值</span>
<span class="token function">print</span><span class="token punctuation">(</span>a<span class="token punctuation">,</span>b<span class="token punctuation">,</span>c<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>未申明的变量为<code>nil</code></p><h2 id="参考" tabindex="-1"><a class="header-anchor" href="#参考" aria-hidden="true">#</a> 参考</h2>`,12),p={href:"https://www.lua.org/docs.html",target:"_blank",rel:"noopener noreferrer"};function u(v,m){const a=s("ExternalLinkIcon");return i(),l("div",null,[o,n("ul",null,[n("li",null,[n("a",p,[t("官方文档"),c(a)])])])])}const b=e(r,[["render",u],["__file","index.html.vue"]]);export{b as default};
