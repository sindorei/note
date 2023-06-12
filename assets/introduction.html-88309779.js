import{_ as s,M as r,p as a,q as d,R as n,t as e,N as l,a1 as t}from"./framework-5866ffd3.js";const c={},o=t(`<h1 id="介绍" tabindex="-1"><a class="header-anchor" href="#介绍" aria-hidden="true">#</a> 介绍</h1><h2 id="角色" tabindex="-1"><a class="header-anchor" href="#角色" aria-hidden="true">#</a> 角色</h2><ul><li>资源所有者 resource owner</li><li>资源服务器 resource server</li><li>客户端 client</li><li>授权服务器 authorization server</li></ul><h2 id="协议流程" tabindex="-1"><a class="header-anchor" href="#协议流程" aria-hidden="true">#</a> 协议流程</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>+--------+                               +---------------+
|        |--(1)- Authorization Request -&gt;|   Resource    |
|        |                               |     Owner     |
|        |&lt;-(2)-- Authorization Grant ---|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(3)-- Authorization Grant --&gt;| Authorization |
| Client |                               |     Server    |
|        |&lt;-(4)----- Access Token -------|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(5)----- Access Token ------&gt;|    Resource   |
|        |                               |     Server    |
|        |&lt;-(6)--- Protected Resource ---|               |
+--------+                               +---------------+

              Figure 1: Abstract Protocol Flow
              图 1：抽象协议流程
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="授权许可" tabindex="-1"><a class="header-anchor" href="#授权许可" aria-hidden="true">#</a> 授权许可</h2><p>OAuth2.1 去掉了隐式授权和资源所有者密码凭据</p><h3 id="授权码-authorization-code" tabindex="-1"><a class="header-anchor" href="#授权码-authorization-code" aria-hidden="true">#</a> 授权码(Authorization Code)</h3><p>授权码（authorization code）是获得访问令牌（access token）的临时凭证。 客户端将资源所有者定向到授权服务器，然后授权服务器再将资源所有者定向回客户端，同时返回授权码。 然后客户端可以用授权码去交换访问令牌。 在将资源所有者引导回客户端之前，授权服务器对资源所有者进行身份验证，并可能请求资源所有者的同意或以其他方式告知他们此次客户端的请求。因为资源所有者仅通过授权服务器进行身份验证，资源所有者的凭据永远不会与客户端共享，并且客户端不需要了解任何额外的身份验证步骤。 授权代码提供了一些重要的安全优势，例如对客户端进行身份验证的能力，以及将访问令牌直接传输到客户端，而无需通过资源所有者的用户代理将其传递并可能将其暴露给其他人，包括资源所有者。</p><h3 id="刷新令牌-refresh-token" tabindex="-1"><a class="header-anchor" href="#刷新令牌-refresh-token" aria-hidden="true">#</a> 刷新令牌(Refresh Token)</h3><div class="custom-container tip"><p class="custom-container-title">TIP</p><p>可选</p></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>+--------+                                           +---------------+
|        |--(1)------- Authorization Grant ---------&gt;|               |
|        |                                           |               |
|        |&lt;-(2)----------- Access Token -------------|               |
|        |               &amp; Refresh Token             |               |
|        |                                           |               |
|        |                            +----------+   |               |
|        |--(3)---- Access Token ----&gt;|          |   |               |
|        |                            |          |   |               |
|        |&lt;-(4)- Protected Resource --| Resource |   | Authorization |
| Client |                            |  Server  |   |     Server    |
|        |--(5)---- Access Token ----&gt;|          |   |               |
|        |                            |          |   |               |
|        |&lt;-(6)- Invalid Token Error -|          |   |               |
|        |                            +----------+   |               |
|        |                                           |               |
|        |--(7)----------- Refresh Token -----------&gt;|               |
|        |                                           |               |
|        |&lt;-(8)----------- Access Token -------------|               |
+--------+           &amp; Optional Refresh Token        +---------------+
Figure 2: Refreshing an Expired Access Token
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="客户端凭据-client-credentials" tabindex="-1"><a class="header-anchor" href="#客户端凭据-client-credentials" aria-hidden="true">#</a> 客户端凭据(Client Credentials)</h3>`,13),v={href:"https://www.rfc-editor.org/info/rfc7523",target:"_blank",rel:"noopener noreferrer"},u=n("h2",{id:"访问令牌-access-token",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#访问令牌-access-token","aria-hidden":"true"},"#"),e(" 访问令牌(Access Token)")],-1);function h(m,b){const i=r("ExternalLinkIcon");return a(),d("div",null,[o,n("p",null,[e("当授权范围限于客户端控制下的受保护资源时，客户端凭据或其他形式的客户端身份验证（例如，用于签署 JWT 的私钥，如 "),n("a",v,[e("RFC7523"),l(i)]),e(" 中所述）可用作权限授予或保护资源。当客户端请求访问先前授权服务器授权的受保护资源时，将使用客户端凭据。")]),u])}const p=s(c,[["render",h],["__file","introduction.html.vue"]]);export{p as default};
