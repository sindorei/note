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

- 对数方法
    * `Math.expm1()`
    * `Math.log1p()`
    * `Math.log10()`
    * `Math.log2()`

- 三角函数方法
    * `Math.sinh()` 双曲正弦
    * `Math.cosh()` 双曲余弦
    * `Math.tanh()` 双曲正切
    * `Math.asinh()` 反双曲正弦
    * `Math.acosh()` 反双曲余弦
    * `Math.atanh()` 反双曲正切

## Array新方法
- `Array.from`
    * 将类似数组的对象和可遍历的对象，转为真正的数组
    * 第二个参数，作用类似于数组的`map`方法，用来对每个元素进行处理
- `Array.of`
    * 将一组值，转换成数组
```javascript
Array.of(3, 11, 8) // [3,11,8]
Array.of(3) // [3]
Array.of(3).length // 1
```
这个方法的主要目的，是弥补数组构造函数Array()的不足。因为参数个数的不同，会导致Array()的行为有差异

```javascript
Array() // []
Array(3) // [undefined, undefined, undefined]
Array(3,11,8) // [3, 11, 8]
```

上面代码说明，只有当参数个数不少于2个，Array()才会返回由参数组成的新数组。

## 数组实例新方法
- `find()`
    * 找出第一个符合条件的数组成员
    * 参数是一个回调函数，所有数组成员依次执行该回调函数，直到找出第一个返回值为true的成员，然后返回该成员。如果没有符合的成员，则返回`undefined`
    * find方法的回调函数可以接受三个参数，依次为当前的值、当前的位置和原数组
    * 可以接受第二个参数，用来绑定回调函数的`this`对象
- `findIndex()`
    * 返回第一个符合条件的数组成员的位置，如果所有成员都不符合条件，则返回-1
    * 可以接受第二个参数，用来绑定回调函数的`this`对象

- `fill()`
    * 使用给定的值，填充一个数组
    * 第二个和第三个参数，用于指定填充的起始位置和结束位置

## 遍历数组的三个新方法
- `entries()`
    * 对键值对的遍历
- `keys()`
    * 对键名的遍历
- `values()`
    * 对键值的遍历

用 for...of循环进行遍历

## 属性的简洁表示法
- ES6允许直接写入变量和函数，作为对象的属性和方法
```javascript
function fn(x , y) {
    return {x , y};
}
//等同于

function fn(x , y) {
    return { x:x, y:y };
}

```

## 属性名表达式
ES6允许字面量定义对象是，用表达式作为对象的属性名，把表达式放在方括号内。
表达式还可以用于定义方法名

## 比较两个值是否严格相等
- `Object.is()`
    * 与`===`的行为基本一致
    * 与`===`的区别
        * +0 不等于-0
        * NaN等于自身

## 源对象的所有可枚举属性，复制到目标对象
- `Object.assign`
- 至少需要两个对象，第一个参数是目标对象，后面的参数都是源对象
- 目标对象与源对象有同名属性，或多个源对象有同名属性，则后面的属性会覆盖前面的属性

##　proto属性
- 读取或设置当前对象的`prototype`对象
- ？

## Symbol 类型
- 表示独一无二的ID
- 凡是属性名属于Symbol类型，都是独一无二的，可以保证不会与其他属性名产生冲突
- Symbol类型的值不能与其他类型的值进行运算，会报错
- Symbol类型的值可以转为字符串

## 内置代理
- `new Proxy(target , handler)`
    * `get(target,propKey,receiver)` 拦截对象属性的读取，返回类型不限。最后一个参数receiver可选，，当target对象设置了propKey属性的get函数时，receiver对象会绑定get函数的this对象
    *  `set(target , propKey , value , receiver)` 拦截对象属性的设置，返回一个布尔值
    * `has(target , propKey)` 拦截`propKey in proxy`的操作，返回一个布尔值
    * `deleteProperty(target , propKey)` 拦截`delete proxy[propKey]`的操作，返回一个布尔值
    * `enumerate(target)` 拦截 `for(var x in proxy)` ， 返回一个遍历器
    * hasOwn(target, propKey)：拦截proxy.hasOwnProperty('foo')，返回一个布尔值。
    * ownKeys(target)：拦截Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、Object.keys(proxy)，返回一个数组。该方法返回对象所有自身的属性，而Object.keys()仅返回对象可遍历的属性。
    * getOwnPropertyDescriptor(target, propKey) ：拦截Object.getOwnPropertyDescriptor(proxy, propKey)，返回属性的描述对象。
    * defineProperty(target, propKey, propDesc)：拦截Object.defineProperty(proxy, propKey, propDesc）、Object.defineProperties(proxy, propDescs)，返回一个布尔值。
    * preventExtensions(target)：拦截Object.preventExtensions(proxy)，返回一个布尔值。
    * getPrototypeOf(target) ：拦截Object.getPrototypeOf(proxy)，返回一个对象。
    * isExtensible(target)：拦截Object.isExtensible(proxy)，返回一个布尔值。
    * setPrototypeOf(target, proto)：拦截Object.setPrototypeOf(proxy, proto)，返回一个布尔值。

如果目标对象是函数，那么还有两种额外操作可以拦截。

* apply(target, object, args)：拦截Proxy实例作为函数调用的操作，比如proxy(...args)、proxy.call(object, ...args)、proxy.apply(...)。
* construct(target, args, proxy)：拦截Proxy实例作为构造函数调用的操作，比如new proxy(...args)。

## 默认参数
- 可以在定义函数的时候指定参数的 **默认值**

## rest参数
- 形式为 "...变量名" ， 可以称为不定参数，用户获取函数多于的参数
```javascript
function add(...values) {
    let sum = 0;
    for(var val of values) {
        sum += val;
    }

    return sum;
}

add(1, 2 ,3);
```
## 扩展运算符
- `...` 将一个数组转为用逗号分隔的参数序列
```javascript
var people=['张三','李四','王五'];

//sayHello函数本来接收三个单独的参数people1，people2和people3
function sayHello(people1,people2,people3){
    document.write(`Hello ${people1},${people2},${people3}`);
}

//但是我们将一个数组以拓展参数的形式传递，它能很好地映射到每个单独的参数
sayHello(...people);   //输出：Hello 张三,李四,王五

//而在以前，如果需要传递数组当参数，我们需要使用函数的apply方法
sayHello.apply(null,people);   //输出：Hello 张三,李四,王五
```

## 箭头函数
- 使用`=>`语法的函数简写形式
- 与普通函数不同的是：箭头函数和其山下文中的代码共享同一个具有词法作用域的`this`
- 注意点
    * 函数体内的this对象，绑定定义时所在的对象，而不是使用时所在的对象。
    * 不可以当作构造函数，也就是说，不可以使用new命令，否则会抛出一个错误。
    * 不可以使用arguments对象，该对象在函数体内不存在。

## 函数绑定
- 函数绑定运算符`::`， 左边是一个对象，右边是一个函数

## 尾调用优化
- 尾调用
    * 某个函数的最后return的是调用另一个函数

```javascript
function f(x){
  return g(x);
}
```

## 数据结构Set
- 类似数组，但是成员的值都是 **唯一** 的
- 可以接受一个数组作为参数，用来初始化
- Set实例的属性
    * `Set.prototype.constructor`：构造函数，默认就是Set函数。
    * `Set.prototype.size`：返回Set实例的成员总数。
- Set 实例的方法
    * 操作方法
        - add(value)：添加某个值，返回Set结构本身。
        - delete(value)：删除某个值，返回一个布尔值，表示删除是否成功。
        - has(value)：返回一个布尔值，表示该值是否为Set的成员。
        - clear()：清除所有成员，没有返回值。
    * 遍历方法
        - keys()：返回一个键名的遍历器
        - values()：返回一个键值的遍历器
        - entries()：返回一个键值对的遍历器
        - forEach()：使用回调函数遍历每个成员

由于Set结构没有键名，只有键值（或者说键名和键值是同一个值），所以key方法和value方法的行为完全一致。

## WeakSet
- 和Set一样都不存储重复的元素
- WeakSet的成员只能是对象，而不能是其他类型的值
- 三个方法
    * `WeakSet.prototype.add(value)`：向WeakSet实例添加一个新成员。
    * `WeakSet.prototype.delete(value)`：清除WeakSet实例的指定成员。
    * `WeakSet.prototype.has(value)`：返回一个布尔值，表示某个值是否在
- WeakSet没有size属性，没有办法遍历它的成员。

## map
- Map是一个超对象，其key除了可以是String类型之外，还可以是其他类型（如：对象）
- 方法
    * size：返回成员总数。
    * set(key, value)：设置一个键值对。返回整个Map结构
    * get(key)：读取一个键。
    * has(key)：返回一个布尔值，表示某个键是否在Map数据结构中。
    * delete(key)：删除某个键。
    * clear()：清除所有成员。
    * keys()：返回键名的遍历器。
    * values()：返回键值的遍历器。
    * entries()：返回所有成员的遍历器。
    * forEach()
- Map转为数组，可结合使用扩展运算符`...` `[...map.keys()]`

## WeakMap
- WeakMap结构与Map结构基本类似，唯一的区别是它只接受对象作为键名（null除外），不接受原始类型的值作为键名，而且键名所指向的对象，不计入垃圾回收机制。set()和get()分别用来添加数据和获取数据:
```javascript
var map = new WeakMap(),
    element = document.querySelector(".element");

map.set(element, "Original");

// 下面就可以使用了
var value = map.get(element);
document.write(value);             // "Original"
```

- WeakMap与Map在API上的区别主要是两个:

    * 一是没有遍历操作（即没有key()、values()和entries()方法），也没有size属性；
    * 二是无法清空，即不支持clear方法。这与WeakMap的键不被计入引用、被垃圾回收机制忽略有关。

因此，WeakMap只有四个方法可用：get()、set()、has()、delete()。

## Iterator（迭代器）
- 遍历器（Iterator）就是统一的接口机制，来处理所有不同的数据结构。

- Iterator的作用有三个：
    * 一是为各种数据结构，提供一个统一的、简便的访问接口；
    * 二是使得数据结构的成员能够按某种次序排列；
    * 三是ES6创造了一种新的遍历命令for...of循环，Iterator接口主要供for...of消费。

- Iterator的遍历过程
    * 创建一个指针，指向当前数据结构的起始位置。也就是说，遍历器的返回值是一个指针对象。
    * 第一次调用指针对象的next方法，可以将指针指向数据结构的第一个成员。
    * 第二次调用指针对象的next方法，指针就指向数据结构的第二个成员。
    * 调用指针对象的next方法，直到它指向数据结构的结束位置。
    * 每一次调用next方法，都会返回当前成员的信息，具体来说，就是返回一个包含value和done两个属性的对象。其中，value属性是当前成员的值，done属性是一个布尔值，表示遍历是否结束
```javascript
function idMaker(){
    var index = 0;

    return {
       next: function(){
           return {value: index++, done: false};
       }
    }
}

var it = idMaker();

it.next().value // '0'
it.next().value // '1'
it.next().value // '2'
```
- 数据结构的默认Iterator接口
    * ES6中，可迭代数据结构（如数组），都必须实现一个名为Symbol.iterator的方法，该方法返回一个该结构元素的迭代器。
```javascript
let arr = ['a', 'b', 'c'];
let iter = arr[Symbol.iterator]();

iter.next() // { value: 'a', done: false }
iter.next() // { value: 'b', done: false }
iter.next() // { value: 'c', done: false }
iter.next() // { value: undefined, done: true }
```
arr是一个数组，原生就具有遍历器接口，在arr的 `Symbol.iterator`属性上。调用这个属性就得到遍历器。

- 调用默认Iterator接口的场合
    * 解构赋值
    * 扩展运算符
    * yield
    * Array.from()
    * Map(),Set(),WeakMap(),WeakSet()
    * Promise.all(),Promise.race()

- 原生具备Iterator接口的数据结构
    *
