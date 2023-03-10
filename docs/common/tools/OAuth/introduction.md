
# 介绍

## 角色
- 资源所有者 resource owner
- 资源服务器 resource server
- 客户端 client
- 授权服务器 authorization server


## 协议流程
```
+--------+                               +---------------+
|        |--(1)- Authorization Request ->|   Resource    |
|        |                               |     Owner     |
|        |<-(2)-- Authorization Grant ---|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(3)-- Authorization Grant -->| Authorization |
| Client |                               |     Server    |
|        |<-(4)----- Access Token -------|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(5)----- Access Token ------>|    Resource   |
|        |                               |     Server    |
|        |<-(6)--- Protected Resource ---|               |
+--------+                               +---------------+

              Figure 1: Abstract Protocol Flow
              图 1：抽象协议流程
```

## 授权许可

OAuth2.1 去掉了隐式授权和资源所有者密码凭据

### 授权码(Authorization Code)

授权码（authorization code）是获得访问令牌（access token）的临时凭证。
客户端将资源所有者定向到授权服务器，然后授权服务器再将资源所有者定向回客户端，同时返回授权码。
然后客户端可以用授权码去交换访问令牌。
在将资源所有者引导回客户端之前，授权服务器对资源所有者进行身份验证，并可能请求资源所有者的同意或以其他方式告知他们此次客户端的请求。因为资源所有者仅通过授权服务器进行身份验证，资源所有者的凭据永远不会与客户端共享，并且客户端不需要了解任何额外的身份验证步骤。
授权代码提供了一些重要的安全优势，例如对客户端进行身份验证的能力，以及将访问令牌直接传输到客户端，而无需通过资源所有者的用户代理将其传递并可能将其暴露给其他人，包括资源所有者。


### 刷新令牌(Refresh Token)
:::tip
可选
:::

```
+--------+                                           +---------------+
|        |--(1)------- Authorization Grant --------->|               |
|        |                                           |               |
|        |<-(2)----------- Access Token -------------|               |
|        |               & Refresh Token             |               |
|        |                                           |               |
|        |                            +----------+   |               |
|        |--(3)---- Access Token ---->|          |   |               |
|        |                            |          |   |               |
|        |<-(4)- Protected Resource --| Resource |   | Authorization |
| Client |                            |  Server  |   |     Server    |
|        |--(5)---- Access Token ---->|          |   |               |
|        |                            |          |   |               |
|        |<-(6)- Invalid Token Error -|          |   |               |
|        |                            +----------+   |               |
|        |                                           |               |
|        |--(7)----------- Refresh Token ----------->|               |
|        |                                           |               |
|        |<-(8)----------- Access Token -------------|               |
+--------+           & Optional Refresh Token        +---------------+
Figure 2: Refreshing an Expired Access Token
```

### 客户端凭据(Client Credentials)


当授权范围限于客户端控制下的受保护资源时，客户端凭据或其他形式的客户端身份验证（例如，用于签署 JWT 的私钥，如 [RFC7523](https://www.rfc-editor.org/info/rfc7523) 中所述）可用作权限授予或保护资源。当客户端请求访问先前授权服务器授权的受保护资源时，将使用客户端凭据。

## 访问令牌

