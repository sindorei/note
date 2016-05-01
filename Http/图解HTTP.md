# 网络基础TCP/IP
## TCP/IP的分层管理
- 应用层
- 传输层
- 网络层
- 数据链路层

## 与HTTP关系密切的协议
### 负责传输的IP协议
- 使用ARP协议凭借MAC地址进行通信

### 确保可靠性的TCP协议
- 三次握手
    * 发送端首先发送一个带有SYN标识的数据包给对方
    * 接收端收到后，回传一个带有SYN/ACK标识的数据包以示传达确认信息
    * 发送端再回传一个带有ACK标识的数据包，代表“握手”结束。
- TCP的标志（flag）
    * SYN synchronize
    * ACK acknowledgement

![三次握手](images/threeway.png)

### 负责域名解析的DNS服务
- Domain Name System
- 应用层协议
- 提供域名到IP地址之间的解析服务
