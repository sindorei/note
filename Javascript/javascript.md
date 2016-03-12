# 编写高质量javascript代码的基本要点
- 书写可维护的代码
- 最小全局变量
- 访问全局对象

```javascript
var global = (function() {
    return this;
})();
```

次方法不适用于严格模式

- 单var形式
- 预解析： var散布的问题

当你使用了一个变量，然后不久在函数中又重新声明的话，就可能产生逻辑错误。对于JavaScript，只 要你的变量是在同一个作用域中（同一函数），它都被当做是声明的，即使是它在var声明前使用的时候。

- for循环

每次循环都获取数组长度的话会降低效率，尤其是遍历HTMLCollection对象的时候

缓存数组（集合）的长度

++和–-促进了“过分棘手(excessive trickiness)” 用 i = i + 1 或 i += 1替换

```javascript
//第一种变化的形式：
var i, myarray = [];
for (i = myarray.length; i–-;) {
   // 使用myarray[i]做点什么
}

//第二种使用while循环：

var myarray = [],
    i = myarray.length;
while (i–-) {
   // 使用myarray[i]做点什么
}
```
- for in 循环

从技术上将，你可以使用for-in循环数组（因为JavaScript中数组也是对象），但这是不推荐的。因为如果数组对象已被自定义的功能增强，就可能发生逻辑错误。另外，在for-in中，属性列表的顺序（序列）是不能保证的。所以最好数组使用正常的for循环，对象使用for-in循环。

hasOwnProperty()方法，当遍历对象属性的时候可以过滤掉从原型链上下来的属性

```javascript
var i, hasOwn = Object.prototype.hasOwnProperty;
for (i in man) {
    if (hasOwn.call(man, i)) { // 过滤
        console.log(i, ":", man[i]);
    }
}
```

- 不扩展内置原型

如果非要添加，满足以下三条件:

    * 可以预期将来的ECMAScript版本或是JavaScript实现将一直将此功能当作内置方法来实现。例如，你可以添加ECMAScript 5中描述的方法，一直到各个浏览器都迎头赶上。这种情况下，你只是提前定义了有用的方法。
    * 如果您检查您的自定义属性或方法已不存在——也许已经在代码的其他地方实现或已经是你支持的浏览器JavaScript引擎部分。
    * 你清楚地文档记录并和团队交流了变化。

    ```javascript
    if (typeof Object.protoype.myMethod !== "function") {
   Object.protoype.myMethod = function () {
      // 实现...
   };
}
    ```
- switch

- 避免隐式类型转换

较值和表达式类型的时候始终使用===和!==操作符

- 避免eval

安全隐患

如果非要用eval ，可以考虑用 Function替代

给setInterval(), setTimeout()和Function()构造函数传递字符串，大部分情况下，与使用eval()是类似的

- parseInt()

  该方法接受另一个基数参数，这经常省略，但不应该。当字符串以”0″开头的时候就有可能会出问 题，例如，部分时间进入表单域，在ECMAScript 3中，开头为”0″的字符串被当做8进制处理了，但这已在ECMAScript 5中改变了。为了避免矛盾和意外的结果，总是指定基数参数。

  ```javascript
  var month = "06",
     year = "09";
  month = parseInt(month, 10);
  year = parseInt(year, 10);
  ```
