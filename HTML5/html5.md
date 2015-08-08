# EventSource
用来管理服务器发送事件
 * onmessage 接受服务器传来的吴类型的消息（无event字段的消息）
 * addEventListener() 监听其他指定了事件类型的消息
 
 属性：
 * onerror
 * onmessage
 * onopen
 * readyState
 * url 
 
 服务器端 http请求头 Content-Type:text/event-stream