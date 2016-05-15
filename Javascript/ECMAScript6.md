# ECMAScript 6
## let 和 const
### let
* 使用let，声明的变量仅在块级作用域内有效
* 不存在变量提升
* 只要块级作用域内存在let命令，它所声明的变量就“绑定”（binding）这个区域，不再受外部的影响。
* let不允许在相同作用域内，重复声明同一个变量。(不能在函数内部重新声明参数)
* 函数本身的作用域，在其所在的块级作用域之内。

如果在严格模式下，函数只能在顶层作用域和函数内声明，其他情况（比如if代码块、循环代码块）的声明都会报错。

```javascript
 "use strict";
       {
            let a = '123';
            var b = 'abc';
       }

        console.log(b); // 输出abc
        console.log(a); //报错 Uncaught ReferenceError: a is not defined
```
```javascript
var a = [];
for (var i = 0; i < 10; i++) {
  a[i] = function () {
    console.log(i);
  };
}
a[6](); // 10
```
```javascript
var a = [];
for (let i = 0; i < 10; i++) {
  a[i] = function () {
    console.log(i);
  };
}
a[6](); // 6
```
```javascript
function f() { console.log('I am outside!'); }
(function () {
  if(false) {
    // 重复声明一次函数f
    function f() { console.log('I am inside!'); }
  }

  f();
}());
```
上面代码在ES5中运行，会得到“I am inside!”，但是在ES6中运行，会得到“I am outside!”。这是因为ES5存在函数提升，不管会不会进入if代码块，函数声明都会提升到当前作用域的顶部，得到执行；而ES6支持块级作用域，不管会不会进入if代码块，其内部声明的函数皆不会影响到作用域的外部。

#### let 应用
- for循环的计数器
```javascript
var a = [];
for (let i = 0; i < 10; i++) {
  a[i] = function () {
    document.write(i);
  };
}
document.write(a[6]());  // 6
```

### const
用来声明变量，但是声明的是常量。一旦声明，常量的值就不能改变。
改变常量的值是不起作用的。需要注意的是，对常量重新赋值不会报错，只会默默地失败。
* const的作用域与let命令相同：只在声明所在的块级作用域内有效。
* const命令也不存在提升，只能在声明的位置后面使用(即必须先申明)。
* const不可重复声明
* const指令指向变量所在的地址，所以对该变量进行属性设置是可行的。
* 如果想完全不可变（包括属性），可以使用冻结`Object.freeze()`
### 跨模块常量
const声明的常量只在当前代码块有效。如果想设置跨模块的常量，可以采用下面的写法。
```javascript
// constants.js 模块
export const A = 1;
export const B = 3;
export const C = 4;

// test1.js 模块
import * as constants from './constants';
console.log(constants.A); // 1
console.log(constants.B); // 3

// test2.js 模块
import {A, B} from './constants';
console.log(A); // 1
console.log(B); // 3
```
### 全局对象属性
全局对象是最顶层的对象，在浏览器环境指的是window对象，在Node.js指的是global对象。在JavaScript语言中，所有全局变量都是全局对象的属性。

ES6规定，var命令和function命令声明的全局变量，属于全局对象的属性；let命令、const命令、class命令声明的全局变量，不属于全局对象的属性。

## 变量的解构赋值
ES6允许按照一定模式，从数组和对象中提取值，对变量进行赋值，这被称为解构（Destructuring）。
ES6中允许这样赋值
`var [a, b, c] = [1, 2, 3];`


## 字符串新方法

### 判断字符串中是否包含某个字符串
- includes()
    * 返回布尔值，表示是否找到了参数字符串
    * 第二个参数，表示开始的位置
- startsWidth()
    * 返回布尔值，表示参数字符串是否在源字符串的头部
    * 第二个参数表示开始的位置
- endsWidth()
    * 返回布尔值，表示参数字符串是否在源字符串的尾部
    * 第二个参数，针对前 n个字符，不包括n

- repeat()
    * 返回一个新字符串
    * 表示将原字符串重复n次

### 模板字符串
- 模板字符串中支持字符串插值
- 模板字符串可以包含多行
- \`\`

```javascript
let username = '哈斯卡';
document.write(`这个英雄的名字叫${username}`);

let multiLine = `
    This is
    a string
    with multiple
    lines`;
document.write(multiLine);  
```

### 标签模板
```javascript
var a = 5;
var b = 10;
tag`Hello ${ a + b } world ${ a * b }`;
```
上面代码中，模板字符串前面有一个标识名`tag`。  它是一个函数。整个表达式的返回值，就是tag函数处理模板字符串后的返回值。

tag函数所有参数的实际值如下：
- 第一个参数： ['Hello ',' world ']
- 第二个参数: 15
- 第三个参数： 50

tag函数实际是以下面的形式调用的
```javascript
tag(['Hello ', ' world '], 15, 50)
```

### String.raw()
- 若使用`String.raw`作为模板字符串的前缀，则模板字符串可以是原始的。反斜线也不再是特殊字符，`\n`也不会被解释成换行符

## Number新方法
- `Number.isFinite()` 检查一个值是否非无穷
    * 有限的数字才返回true
- `Number.isNaN()` 检查一个值是否为NaN
- `Number.isInteger()` 判断一个值是否为整数
    * javascript内部 整数 和 浮点数 是同样的存储方法
    * 3 和 3.0 被视为同一个值 都 返回 true

## Math新方法
- `Math.trunc()` 去除一个数的小数部分，返回整数部分
    * 对空值与无法截取整数的值，返回 `NaN`
- `Math.sign()` 判断一个数到底是整数、负数、还是零
    * 返回 +1 ，整数
    * 返回 -1 ， 负数
    * 返回 0 ， 0
    * 返回 -0， -0
    * 返回 NaN ， 其他
- `Math.cbrt()` 计算一个数的立方根
- `Math.fround()` 返回一个数的单精度浮点数形式
- `Math.hypot()` 返回所有参数的平方和的平方根
    * 参数不是数值，会将其转为数值
    * 只要有一个参数无法转换为数值，则返回 `NaN`
