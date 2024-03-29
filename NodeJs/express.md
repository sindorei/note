# Express介绍
Express是一个简洁、灵活的node.js Web应用开发框架, 它提供一系列强大的功能，比如：模板解析、静态文件服务、中间件、路由控制等等,并且还可以使用插件或整合其他模块来帮助你创建各种 Web和移动设备应用,是目前最流行的基于Node.js的Web开发框架，并且支持Ejs、jade等多种模板，可以快速地搭建一个具有完整功能的网站。

- 安装
    * `npm init` 创建package.json文件
    * 指定 `entry point` 入口文件
    * `npm install express --save`
- 创建应用
```javascript
var express = require('express');
var app = express();
app.get('/',function(request,response){
	response.send('Hello World!');
});
app.listen(80);
```

# get 请求
- 根据请求路径来处理客户端发出的GET请求
- 格式：app.get(path,function(request, response));

## Middleware<中间件>
- 处理http请求的函数，用来完成各种特点的任务
- 特点：一个中间件处理完，可以把相应数据再传递给下一个中间件

## all
- 以匹配所有的HTTP动词，也就是说它可以过滤所有路径的请求，如果使用all函数定义中间件，那么就相当于所有请求都必须先通过此该中间件。
- 格式：app.all(path,function(request, response));

```javascript
var express = require('express');
var app = express();
app.all('*',function(request,response,next){
	response.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
  next();
})
app.get('/',function(request,response){
	response.end('欢迎来到首页！');
});
app.get('/about',function(request,response){
	response.end('about us');
});
app.get('*',function(request,response){
	response.end('404-你要的页面飞啦！');
})
app.listen(80);
```

## use
- use是express调用中间件的方法，它返回一个函数。
- app.use([path], function(request, response, next){});
- 可选参数path默认为“/”
- 回调函数的next参数，表示接受其他中间件的调用，函数体中的next()，表示将请求数据传递给下一个中间件。

## 回调函数
- Express回调函数有2个参数
- request 客户端发来的http请求
- response 发向客户端的http回应
- 获取主机、路径名
    * req.host , req.path
## query 可获取客户端get请求路径参数的对象属性
## param
    * 格式：req.param("参数名")
## params
    * 和param相似，但params是一个可以解析包含着有复杂命名路由规则的请求对象的属性。
    * 格式：req.params.参数名

## send
- 向浏览器发送一个响应信息，并可以智能处理不同类型的数据
- 参数为String时，Content-Type 默认设置为'text/html'
- 参数为Array或Object时，Express返回一个JSON
- 参数为一个Number时，并且没有响应体，Express会帮你设置一个响应体，比如：200会返回字符“OK”
- send方法在输出响应时会自动进行一些设置，比如HEAD信息、HTTP缓存支持等等

```javascript
res.send({ user: 'tobi' }); //{"user":"tobi"}
res.send([1,2,3]); //[1,2,3]
res.send(200); // OK
res.send(404); // Not Found
res.send(500); // Internal Server Error
```
# 模板引擎
- ejs
    * `npm install ejs` 安装ejs
    * `app.set('view engine', 'ejs');`
    * 修改模板文件后缀名

```javascript
// 修改模板文件的后缀名为html
app.set( 'view engine', 'html' );
// 运行ejs模块
app.engine( '.html', require( 'ejs' ).__express );
```
- 静态资源
    * `app.use(express.static(require('path').join(__dirname, 'public')));`
    * `express.static` 指定静态文件的查找目录

- 添加视图
    * 设置views存放的目录
```javascript
// 设定views变量，意为视图存放的目录
app.set('views', __dirname);
```
- 访问视图
    * render 对网页模板进行渲染
        * 格式： res.render(view,[locals],callback);
- redirect
    * 默认302
    * 格式： res.redirect([status],url);

- Post 请求
    * body
        * 引入express的两个中间件 body-parser和 multer
```Node
npm install body-parser
npm install multer
```
```javascript
var bodyParser = require('body-parser');
var multer = require('multer');
   ......
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
```

# 路由
