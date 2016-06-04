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
