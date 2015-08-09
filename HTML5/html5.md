# EventSource  service send event
用来管理服务器发送事件
 * onmessage 接受服务器传来的吴类型的消息（无event字段的消息）
 * addEventListener() 监听其他指定了事件类型的消息
 
 属性：
 * onerror 初始值为null，指向一个自定义函数，连接发生错误时自动调用
 * onmessage 初始值为null，在接受一个没有event字段的消息时会自动调用
 * onopen 初始值为null，成功建立连接后调用
 * readyState 连接的当前状态必须为 CONNECTING,OPEN或者CLOSED中的一种，只读
 * url 只读
 
 服务器端 MIMIE 类型指定 Content-Type:text/event-stream
 
 常量 (readState属性的值)
 * CONNECTING 0 正在建立连接
 * OPEN 1 连接处于打开状态正在调度事件
 * CLOSED 2 连接没有被建立，或者已经关闭或者发生了某个致命错误
 
 方法
 close()
 如果连接处于打开状态，则关闭连接，并把readyState属性的值设为CLOSED
 如果连接已经关闭，则该方法不会做任何事
 
init
参数：
* principal

用来进行请求的principal ，不能为null

* scriptContext

进行该请求的脚本上下文，可以为null

* ownerWindow

与该请求关联的window对象，可以为null

* url

EventSource对象的目标URL，不能为空

[接口文档地址](http://www.w3.org/TR/eventsource/#the-eventsource-interface)
