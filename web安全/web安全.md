# Secure By Default 原则
- 黑名单、白名单
- 最小权限原则
# 纵深防御原则 Defense in Depth
在正确的地方做正确的事
# 数据与代码分离原则
# 不可预测性原则
 
 需要用到加密算法、随机数算法、哈希算法

# 浏览器安全
### 同源策略
host（域名或ip） 、 子域名 、 端口 、 协议
### 浏览器沙箱
### 恶意网址拦截


# XSS

跨站脚本攻击 Cross Site Script 

- 反射型XSS
- 存储型XSS
- DOM Based XSS  通过DOM节点形成的XSS

XSS Payload

Cookie劫持  给关键Cookie植入HttpOnly标识 cookie和ip绑定 可以预防

XSS 构建GET POST 请求

- GET img标签的src
- POST 创建表单提交 XMLHttpRequest
