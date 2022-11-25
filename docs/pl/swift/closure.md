# 闭包

类似其他一些编程语言中的匿名函数（Lambdas）比较相似。

闭包采用如下三种形式之一：
全局函数是一个有名字但不会捕获任何值的闭包
嵌套函数是一个有名字并可以捕获其封闭函数域内值的闭包
闭包表达式是一个利用轻量级语法所写的可以捕获其上下文中变量或常量值的匿名闭包


## 闭包表达式语法
闭包表达式语法有如下的一般形式：
```swift
{ (parameters) -> return type in
    statements
}
```

闭包表达式参数 可以是 in-out 参数，但不能设定默认值。如果你命名了可变参数，也可以使用此可变参数。元组也可以作为参数和返回值。

闭包的函数体部分由关键字 in 引入。该关键字表示闭包的参数和返回值类型定义已经完成，闭包函数体即将开始。

## 根据上下文推断类型
```swift
reversedNames = names.sorted(by: { s1, s2 in return s1 > s2 } )
```

## 单表达式闭包的隐式返回

单行表达式闭包可以通过省略 return 关键字来隐式返回单行表达式的结果，如上版本的例子可以改写为：
```swift
reversedNames = names.sorted(by: { s1, s2 in s1 > s2 } )
```

## 参数名称缩写
Swift 自动为内联闭包提供了参数名称缩写功能，你可以直接通过 $0，$1，$2 来顺序调用闭包的参数，以此类推。

如果你在闭包表达式中使用参数名称缩写，你可以在闭包定义中省略参数列表，并且对应参数名称缩写的类型会通过函数类型进行推断。in 关键字也同样可以被省略，因为此时闭包表达式完全由闭包函数体构成：

```swift
reversedNames = names.sorted(by: { $0 > $1 } )
```

在这个例子中，$0 和 $1 表示闭包中第一个和第二个 String 类型的参数。

## 运算符方法
实际上还有一种更简短的方式来编写上面例子中的闭包表达式。Swift 的 String 类型定义了关于大于号（>）的字符串实现，其作为一个函数接受两个 String 类型的参数并返回 Bool 类型的值。而这正好与 sorted(by:) 方法的参数需要的函数类型相符合。因此，你可以简单地传递一个大于号，Swift 可以自动推断找到系统自带的那个字符串函数的实现：

```swift
reversedNames = names.sorted(by: >)
```

更多关于运算符方法的内容请查看[运算符方法](https://swiftgg.gitbook.io/swift/swift-jiao-cheng/27_advanced_operators#operator-methods)。


## 尾随闭包
如果你需要将一个很长的闭包表达式作为最后一个参数传递给函数，将这个闭包替换成为尾随闭包的形式很有用。尾随闭包是一个书写在函数圆括号之后的闭包表达式，函数支持将其作为最后一个参数调用。在使用尾随闭包时，你不用写出它的参数标签：
```swift
func someFunctionThatTakesAClosure(closure: () -> Void) {
    // 函数体部分
}

// 以下是不使用尾随闭包进行函数调用
someFunctionThatTakesAClosure(closure: {
    // 闭包主体部分
})

// 以下是使用尾随闭包进行函数调用
someFunctionThatTakesAClosure() {
    // 闭包主体部分
}
```

```swift
reversedNames = names.sorted() { $0 > $1 }
```

如果闭包表达式是函数或方法的唯一参数，则当你使用尾随闭包时，你甚至可以把 () 省略掉：

```swift
reversedNames = names.sorted { $0 > $1 }
```
