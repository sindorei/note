# NodeJs 与 javascript的异同
- ECMAScript
  - 语法
  - 内置对象、方法
- 顶层对象
  - javascript ： window
  - nodejs ： global

# 模块
- 一个文件就是一个模块
- 每个模块都有自己的作用域

用var申明一个变量，不是全局的，而是属于当前模块下

# 模块加载
`require()` 参数：相对路径或绝对路径

当前目录不可省略 ‘./’，不然会加载nodejs核心模块文件夹中的文件（node_moudles）

查找机制：

- 首先按照文件名称查找
- 如果查找不到，会自动在模块文件名称后加入.js的后缀，再进行查找
- 如果还没有找到，会在文件名称后加入.json的后缀，再进行查找
- 如果还没有找到，则会在文件名后加上.node的后缀，再进行查找
- 还没有就会报错


# exports

在一个模块中通过var定义的变量，其作用域范围是当前模块，外部不能够直接访问

如果我们想一个模块能够访问另一个模块中定义的变量，可以：
- 把变量作为global对象的一个属性（不推荐）
- 使用模块对象 module

module 保存提供和当前模块有关的一些信息

module对象中有个exports对象

require 返回值就是被加载对象的module.exports对象

模块作用域中有个exports对象，和module.exports对象指向同一个引用

# os模块
- 提供操作系统的一些基本信息
- platform() 查看操作系统平台
- release() 查看操作系统版本
- type() 查看操作系统名称
- arch() 查看操作系统CPU架构

# process 对象
全局对象，对当前运行程序的进程进行访问和控制

可以截获进程的异常、退出等事件。也可以获取进程的当前目录、环境变量、内存占用等信息。还可以执行进程退出、目录切换等操作。

- argv
  - node
  - 运行的文件
  - 命令行传入的参数
- execPath
  - 开启当前进程的绝对路径
- env
  - 返回用户环境信息
- version  
- pid 当前进程的pid
- title
- platform 返回当前操作系统平台
- cwd() 返回当前进程的工作目录
- chdir(directory) 改变当前进程的工作目录
- memoryUsage() 返回node进程的内存使用情况，单位是byte
- exit(code) 退出
    * 杀死进程退出程序
    * code 为退出后返回的代码，省略则默认为0
- kill(pid) 向进程发送信息

- stdin 、stdout 标准输入输出 IO
  - process.stdin.write()
  - 默认输入流是关闭的，要监听处理输入流数据，要先开启输入流 process.stdin.resume()
  - 用注册事件的方式获取输入的内容
- stderr
    * 标准错误流，用来打印错误信息
- on
    * 监听进程事件
        * exit事件，进程退出之前会触发exit事件
        * uncaughtException 进程发生了未捕获的异常时触发
- 设置编码
    * process.stdin.setEncoding()
    * process.stdout.setEncoding()

# Buffer 类
- new Buffer(size)
  * size [Number] 创建一个Buffer对象，并为这个对象分配一个大小
  * 分配空间大小后，不能再更改
- new Buffer(Array)
  * 字节数组
- new Buffer(string,[encoding])
  * 编码默认utf-8
- length 属性 Buffer的bytes大小
- buf[index]
  * 获取或者设置在指定index索引位置的8位字节内容
- write() 方法
  * 参数：
    1.要写入的字符串
    2.写入字符串的位置
    3.写入字符串的长度
    4.编码方式
- toString([encoding],[start],[end])
  * 根据encoding参数返回一个解码的string类型
- toJSON()
  * 返回一个JSON表示的BUffer实例
  * JSON.stringify将会默认调用字符串序列化这个Buffer实例
- slice([start],[end]) 截取
  * 返回的新buffer与老的buffer引用相同的地址
- copy(targetBuffer , [targetStart] , [sourceStart] , [sourceEnd])

- Buffer类静态方法
  * isEncoding() 是否是支持的编码
  * isBuffer() 是否是一个Buffer对象
  * byteLength(string,[encoding])
    * 返回指定字符串的真是byte长度
  * concat(list,[totalLength])
    * 将字节数组拼接成一个buffer对象

# File
需引入fs模块

```
var fs = require('fs');
/*
*  fs.open(path,flags, [mode] , callback)
*  path : 要打开的文件的路径
*  flags：打开文件的方式 读/写  r r+
*  model：设置文件的模式 读/写/执行
*  callback：回调
*          err ： 文件打开失败的错误
*          fd ： 被打开文件的标识
**/

```
- open()
  * 打开一个文件（异步的）

- openSync()
  * 打开一个文件（同步的）

- read()
  * fd: 成功打开文件返回的编号
  * buffer: buffer对象
  * offset: 新内容添加到buffer中的起始位置
  * length：
  * position
  * callback

- readSync()
  * 同步
  * 返回bytesRead的个数

- write()
  * fd 打开的文件
  * buffer 要写入的数据
  * offset 写入数据的起始位置
  * length 写入数据的长度
  * position fd的起始位置
  * callback 回调

- write(fd,data[,position[,encoding]],callback)

- close(fd,callback)

- writeFile(filename,data,[options],callback)
    * 异步将数据写入一个文件，如果文件已存在则会被替换
    * 数据参数可以是string或者是Buffer
    * 编码格式参数可选，默认为“utf8”
    * 回调函数只有一个参数err

- appendFile()
    * 将新的内容追加到已有的文件中
    * 如果文件不存在会创建一个新的文件
    * 参数： 文件名，数据，编码，回调函数

- exists(filename,callback)
  * 文件是否存在
  * 回调函数只有一个参数，布尔型，true为存在，false为不存在

- readFile(filename,[encoding],callback)
  * 要读取的文件路径
  * 编码（可选）
  * 回调函数
    * 错误信息
    * 读取的数据 buffer对象

- unlink()
  * 删除文件
  * 参数： 文件 ， 回调函数(err)

- rename(oldPath,newPath,callback)
  * 重命名
  * 可以用来移动文件
- stat(path,callback)
  * 读取文件信息
- watch(filename,[options],[listener])
  * 观察指定路径的改变
  * 不稳定的

- mkdir() 创建文件夹
    * mkdir(路径,权限,回调函数(err))
    * 权限参数，可选，只在linux下有效，默认为0777

- rmdir() 删除文件夹
    * rmdir(路径,回调函数(err))

- readdir()
    * 读取指定目录下所有文件
    * readdir(目录,回调函数(err,files))
    * 回调函数接受两个参数，其中第二个参数是一个存储目录中所包含的文件名称的数组，数组中不包括‘.’和‘..’


# url处理 -- url 模块
- parse()
    * 解析url，返回一个js对象
    * 第二个参数为true时，url中的查询字符串(query)也转成对象
    * 第三个参数为true时，解析时会将url的"//"和第一个"/"之间的部分解析为主机名
- format()
    * 将对象组装成url地址
- resolve()
    * 第一个参数是开始路径
    * 第二个参数是要去的路径
    * 返回值是一个组装好的url

# path
- normalize()
    * 将不符合规范的路径经过格式化转换为标准路径
- join
    * 将传入的多个路径拼接为标准路径并将其格式化，返回规范的路径
- dirname
    * 返回路径中的目录名
- basename
    * 返回路径中的最后一部分，并且可以对其进行条件排除
- extname
    * 返回路径中文件的扩展名

# querystring模块 字符串转换
用于实现URL参数字符串与参数对象之间的互相转换，提供了"stringify"、"parse"等一些实用函数来针对字符串进行处理，通过序列化和反序列化

- stringify
    * querystring.stringify("对象"，"分隔符"，"分配符")
    * 默认分隔符是 `&` 分配符是 `=`
- parse
    * 反序列化字符串（默认是由"="、"&"拼接而成），转换得到一个对象类型
    * querystring.parse("字符串"，"分隔符"，"分配符")

```
var qs = require('querystring');
var str = 'foo@bar$cool@xux$cool@yys';
var obj = qs.parse(str,'$','@');

console.log(obj); // { foo: 'bar', cool: [ 'xux', 'yys' ] }
```

# util模块

Node.js核心模块，提供常用函数的集合，用于弥补核心javascript的一些功能

并提供了一系列常用工具，用来对数据的输出和验证。

- inspect
    * util.inspect(object,[showHidden],[depth],[colors])
    * 将任意对象转换为字符串的函数，通常用于调试和错误输出。

```javascript
var util = require('util');
var obj = { username:'哈斯卡', age: 23 };
var res = util.inspect(obj);
console.log(res); // { username: '哈斯卡', age: 23 }
```
- format
    * 根据第一个参数，，返回一个格式化字符串
    * 第一个参数是一个可包含零个或多个占位符的字符串
    * 每一个占位符被替换为与其对应的转换后的值
    * 支持的占位符有："%s(字符串)"、"%d(数字<整型和浮点型>)"、"%j(JSON)"、"%(单独一个百分号则不作为一个参数)"
    * 如果占位符没有相应的参数，占位符将不会被替换
    * 如果参数多于占位符，额外的参数会调用`util.inspect()`转化为字符串。这些字符串用空格分隔连接
    * 如果第一个参数是一个非格式化字符串，则会把所有的参数转换成字符串并以空格隔开拼接在一起，并返回

```javascript
var util = require('util');
var res = util.format('%s:%s','hello','world');
console.log(res); // hello:world
console.log(util.format('%d:%s:%s',1,'hello')); // 1:hello:%s
util.format('%d:%s:%s',1,'hello','world','露娜');//1:hello:world 露娜
console.log(util.format(1,'hello','world','露娜')); // 1 'hello' 'world' '露娜'
```

- isArray
    * 判断是否为数组类型，是返回true ， 否 返回false

```javascript
var util = require('util');
var arr = [1,2,3];
var str = 'hello nodejs';
console.log(util.isArray(arr)); // true
console.log(util.isArray(str)); // false
```
- isDate
    * 判断是否为日期类型
- isRegExp
    * 判断是否为正则类型

# child_process 子进程
- spawn
    * 用给定的命令发布一个子进程
- exec
    * 与spawn 不同之处： 可接受一个回调函数作为参数
    * 回调函数有三个参数：err ，stdout，stderr
- execFile
    * 可直接执行所指的的文件
- fork
    * 可直接运行Node.js模块
    * 该方法是spawn()的特殊情景，用于派生Node进程。除了普通ChildProcess实例所具有的所有方法，所返回的对象还具有内建的通讯通道
