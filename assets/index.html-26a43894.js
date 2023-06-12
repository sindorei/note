import{_ as t,M as l,p as i,q as o,R as n,t as s,N as p,a1 as a}from"./framework-5866ffd3.js";const r={},u=a('<h1 id="主要模块" tabindex="-1"><a class="header-anchor" href="#主要模块" aria-hidden="true">#</a> 主要模块</h1><ul><li>@babel/core <ul><li>babel主模块被其他模块peer dependency</li></ul></li><li>@babel/preset-env <ul><li>根据指定的环境转换预发 <ul><li>可配置<code>useBuiltIns</code>为usage或entry自动引入polyfill，需自行安装好core-js和regenerator-runtime模块到dependencies <ul><li>entry 需 在入口因UR<code>core-js/stable</code> 和 <code>regenerator-runtime/runtime</code></li></ul></li><li>useBuiltIns设为usage时需要注意第三方模块的风险</li><li>注意core-js@3 才有实例方法如 <code>[].map</code></li><li>corejs 属性可以指定core-js版本，指定到次版本号</li></ul></li></ul></li><li>@babel/plugin-transform-runtime <ul><li>需安装 @babel/runtime模块到dependencies</li></ul></li><li>@babel/runtime <ul><li>含Babel模块化运行时帮助程序和regenerator-runtime库</li><li>安装到生产依赖</li></ul></li></ul><h1 id="使用搭配" tabindex="-1"><a class="header-anchor" href="#使用搭配" aria-hidden="true">#</a> 使用搭配</h1><h2 id="方案一-推荐应用用" tabindex="-1"><a class="header-anchor" href="#方案一-推荐应用用" aria-hidden="true">#</a> 方案一 (推荐应用用)</h2><ul><li>@babel/core</li><li>@babel/preset-env 设置 useBuiltIns</li></ul><h2 id="方案二-推荐库用" tabindex="-1"><a class="header-anchor" href="#方案二-推荐库用" aria-hidden="true">#</a> 方案二（推荐库用）</h2>',6),c=n("li",null,"@babel/core",-1),d=n("li",null,"@babel/preset-env useBuiltIns 为false（默认false）",-1),b={href:"https://babeljs.io/docs/en/next/babel-plugin-transform-runtime#corejs",target:"_blank",rel:"noopener noreferrer"},v=n("li",null,[s("@babel/runtime 或 @babel/runtime-corejs2 或 @babel/runtime-corejs3 "),n("ul",null,[n("li",null,[s("区别 runtime-corejs3 支持实例方法,e.g. "),n("code",null,"[].includes")])])],-1),m=a(`<h2 id="方案三" tabindex="-1"><a class="header-anchor" href="#方案三" aria-hidden="true">#</a> 方案三</h2><ul><li>@babel/core</li><li>@babel/preset-env useBuiltIns 为false（默认false</li><li>代码里手动引入core-js@3和regenerator-runtime（代替之前的直接引入@babel/polyfill）</li></ul><h1 id="其他" tabindex="-1"><a class="header-anchor" href="#其他" aria-hidden="true">#</a> 其他</h1><ul><li>注意配置文件查找，如果项目中有子库需设置 <code>rootMode: &#39;upward&#39;</code>,记得改js的babel-loader及vue-loader的</li></ul><h1 id="配置示例" tabindex="-1"><a class="header-anchor" href="#配置示例" aria-hidden="true">#</a> 配置示例</h1><h2 id="示例1" tabindex="-1"><a class="header-anchor" href="#示例1" aria-hidden="true">#</a> 示例1</h2><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token punctuation">{</span>
  <span class="token string-property property">&quot;presets&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/preset-env&quot;</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token string-property property">&quot;modules&quot;</span><span class="token operator">:</span> <span class="token string">&quot;commonjs&quot;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string-property property">&quot;plugins&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/plugin-transform-runtime&quot;</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token string-property property">&quot;corejs&quot;</span><span class="token operator">:</span> <span class="token number">3.23</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="示例2" tabindex="-1"><a class="header-anchor" href="#示例2" aria-hidden="true">#</a> 示例2</h2><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token punctuation">{</span>
  <span class="token string-property property">&quot;presets&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/preset-env&quot;</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token string-property property">&quot;useBuiltIns&quot;</span><span class="token operator">:</span> <span class="token string">&quot;entry&quot;</span><span class="token punctuation">,</span>
        <span class="token string-property property">&quot;corejs&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>
          <span class="token string-property property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3.23</span><span class="token punctuation">,</span>
          <span class="token string-property property">&quot;proposals&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span>
        <span class="token punctuation">}</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string-property property">&quot;plugins&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/plugin-transform-runtime&quot;</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token string-property property">&quot;corejs&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span>
<span class="token comment">// 入口文件内</span>
<span class="token keyword">import</span> <span class="token string">&#39;core-js/stable&#39;</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token string">&#39;regenerator-runtime/runtime&#39;</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="示例3" tabindex="-1"><a class="header-anchor" href="#示例3" aria-hidden="true">#</a> 示例3</h2><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code>
<span class="token punctuation">{</span>
  <span class="token string-property property">&quot;presets&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/preset-env&quot;</span><span class="token punctuation">,</span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string-property property">&quot;plugins&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>
      <span class="token string">&quot;@babel/plugin-transform-runtime&quot;</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>
        <span class="token string-property property">&quot;corejs&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>
          <span class="token string-property property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3.23</span><span class="token punctuation">,</span>
          <span class="token string-property property">&quot;proposals&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span>
        <span class="token punctuation">}</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">]</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="参考" tabindex="-1"><a class="header-anchor" href="#参考" aria-hidden="true">#</a> 参考</h1><ul><li>https://babeljs.io/docs/en/next/usage</li></ul><h1 id="_6-x-升级到-7-x" tabindex="-1"><a class="header-anchor" href="#_6-x-升级到-7-x" aria-hidden="true">#</a> 6.x 升级到 7.x</h1><ul><li>@babel/core</li><li>@babel/preset-env</li><li>插件 <ul><li>babel-plugin-transform-vue-jsx -&gt; @vue/babel-plugin-transform-vue-jsx</li><li>babel-plugin-syntax-jsx -&gt; @babel/plugin-syntax-jsx</li><li>babel-helper-vue-jsx-merge-props -&gt; @vue/babel-helper-vue-jsx-merge-props</li></ul></li></ul><h1 id="babel-preset-env" tabindex="-1"><a class="header-anchor" href="#babel-preset-env" aria-hidden="true">#</a> @babel/preset-env</h1><ul><li>corejs 的version设为 3.x时会使用<code>babel-plugin-polyfill-corejs3</code>插件，此插件会使用到 <code>core-js-compat</code>模块 <ul><li><code>core-js-compat/data.json</code> 中定义了各api在各浏览器中支持的最低版本，<code>core-js-compat/modules-by-versions.json</code>中定义了corejs中各版本对应引入的api</li></ul></li></ul><h1 id="其他-1" tabindex="-1"><a class="header-anchor" href="#其他-1" aria-hidden="true">#</a> 其他</h1><ul><li><code>npx browserslist</code> 可查看当前的browserslist配置匹配到哪些浏览器，<code>npx browserslist &gt;1%</code> 可用于方便查看匹配</li><li><code>@babel/preset-env</code>的<code>debug</code>参数设为<code>true</code>可在控制台打印相关debug数据，方便查看哪些插件和polyfill引入了</li></ul>`,19);function k(h,g){const e=l("ExternalLinkIcon");return i(),o("div",null,[u,n("ul",null,[c,d,n("li",null,[s("@babel/plugin-transform-runtime "),n("ul",null,[n("li",null,[s("corejs 属性配置runtime版本，默认false，使用@babel/runtime，"),n("a",b,[s("配置参考"),p(e)])])])]),v]),m])}const y=t(r,[["render",k],["__file","index.html.vue"]]);export{y as default};
