# concurrent.thread.js

# Worker
- `new Worker()`
- 监听返回 `onmessage`
- 发送数据 `postMessage()`
- `close()` 关闭线程

#　SharedWorker  共享线程
- 可被多个页面使用
- port
- 使用SharedWorker对象的后台代码需要绑定connect和message事件
- connect事件会在页面上的port被start时触发。
- 最后port调用postMessage方法把结果传回给页面。
