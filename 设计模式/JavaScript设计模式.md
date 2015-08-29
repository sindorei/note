#单例模式
#策略模式
#代理模式
 ## 虚拟代理
 ## 缓存代理
 
 #装饰者模式
给对象动态地增加职责的方式
### AOP装饰函数

`Function.prototype.before`和`Function.prototype.after`方法

```javascript
Function.prototype.before = function(beforefn){
    var __self = this; //保存原函数的引用
    return function(){ // 返回包含了原函数和新函数的代理函数
        beforefn.apply(this,arguments); // 执行新函数，且保证this不被劫持，新函数接受的参数也会被原封不动地传入原函数，新函数在原函数之前执行
        return __self.apply(this,arguments); // 执行原函数并返回原函数的执行结果，并且保证this不被劫持
    }
} 

Function.prototype.after = function( afterfn ){
    var __self = this;
    return function() {
        var ret = __self.apply(this,arguments);
        afterfn.apply(this,arguments);
        return ret;
    }
}
```

注意：函数通过`Function.prototype.before`和`Function.prototype.after`被装饰后，返回的实际上是一个新函数，如在原函数上保存了一些属性，那么这些属性会丢失。

另这种装饰方式也叠加了函数的作用域，如果装饰的链条太长，性能上也会受到一些影响

#设计原则与编程技巧

## 单一职责原则
## 最少知识原则
## 开放封闭原则

开放-封闭原则的思想：当需要改变一个程序的功能或者给这个程序增加新功能的时候，可以使用增加代码的方式，但是不允许改动程序源代码。

用对象的多态性消除条件分支

把程序中不变的部分隔离出来，把可变的部分封装起来

帮助我们编写遵守开发-封闭原则的代码：
 1. 放置挂钩（hook）
 2. 使用回调函数
 
 有些代码是无论如何也不能完全封闭的，总会存在一些无法对其封闭的变化。
 
 * 挑选出最容易发生变化的地方，然后构造抽象来封闭这些变化
 * 在不可避免发生修改的时候，尽量修改那些相对容易修改的地方。