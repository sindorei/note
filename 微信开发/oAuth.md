# OAuth
- Open Authorization
- 1.0 2007
- 2.0 2010
## 应用场景
- QQ用户授权 xx 网使用其QQ账号相关的信息
- 获取授权后，在符合权限规则的

- 请求OAuth登录页
  * Request Token URL
    * 未授权的令牌请求服务地址

 - 返回登录结果
   * User Authorization URL
     * 用户授权的令牌请求服务地址
   * AccessToken
     * 用户通过第三方应用访问OAuth接口的令牌

  - AccessToken 与 RefreshToken
    * AccessToken - 具有较长生命周期（10天半个月甚至更长）
    * RefreshToken 可用来更新AccessToken
