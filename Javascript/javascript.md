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
