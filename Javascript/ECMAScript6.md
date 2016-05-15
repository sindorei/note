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

## 模板字符串
- 模板字符串中支持字符串插值
- 模板字符串可以包含多行
- `\`\``
