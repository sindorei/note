# Promise
CommonJS工作组提出的一种规范，目的是为异步操作提供统一接口
什么是promise？
* 一个对象
* 起到代理作用
  使得异步操作具备正常的同步运行的流程
  
  ECMAScript6 实现了promise
  promise对象三种状态：
  * 等待 pending
  * 成功 resolve
  * 拒绝 reject
  then 方法 调用 resolve 和 reject 状态的回调函数
  
  ```javascript
  var pro = new Promise(function(resolve,reject){
  
  })
  ```
  catch
  all
  race