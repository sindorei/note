# 安装Node.js及相关要点
## Node.js的全局变量和保留字
- process
- global
- module.exports 和 exports

## 进程相关信息
- 每个运行的nodejs脚本本质上都是一个进程
- 通过`process`对象获取同进程相关的信息
    * `process.pid`
    * `process.cwd()`

## \_\_dirname与process.cwd的对比
- \_\_dirname 是使用该全局变量文件的绝对路径
- process.cwd() 是运行脚本进程的绝对路径

## Node.js核心模块
- http
- util
- querystring
- url
- fs

## Node.js中的数据流
- 应用在处理数据的时候还可以同时接收数据
- 默认情况Node.js使用buffer来处理流

## 调试nodejs
- debuger
    * next ， n ： 单步执行
    * cont ， c：继续执行，知道遇到下一个断点
    * step ， s: 单步执行并进入函数
    * out ， o: 从函数中跳出
    * watch(expression) : 把表达式expression加入监视列表

- Node Inspector
    * 安装 `npm install -g node-inspector`

## 监听文件变化
- forever
- node-dev
- nodemon
- supervisor
