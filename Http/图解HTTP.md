# 网络基础TCP/IP
## TCP/IP的分层管理
- 应用层
- 传输层
- 网络层
- 数据链路层

# 与HTTP关系密切的协议
## 负责传输的IP协议
- 使用ARP协议凭借MAC地址进行通信

## 确保可靠性的TCP协议
- 三次握手
    * 发送端首先发送一个带有SYN标识的数据包给对方
    * 接收端收到后，回传一个带有SYN/ACK标识的数据包以示传达确认信息
    * 发送端再回传一个带有ACK标识的数据包，代表“握手”结束。
- TCP的标志（flag）
    * SYN synchronize
    * ACK acknowledgement

![三次握手](images/threeway.png)

## 负责域名解析的DNS服务
- Domain Name System
- 应用层协议
- 提供域名到IP地址之间的解析服务

# URI 和 URL
- Uniform Resource Identifier 统一资源标识符
- Uniform Resource Locator 统一资源定位符

URI用字符串标识某一互联网资源，URL表示资源的地点

![URI格式](images/URI.png)

# HTTP协议
## HTTP协议用于客户端和服务器端之间的通信
## 通过请求和响应的交换达成通信
## HTTP是不保存状态的协议
- 协议自身不具备保存之前发送过的请求或响应的功能

## 请求URI定位资源
- URI为完整的请求URI

`GET http://hello.com/index.html HTTP/1.1`

- 在首部字段Host中写明域名或IP地址

```HTTP
GET /index.html HTTP/1.14
Host: hello.com
```
