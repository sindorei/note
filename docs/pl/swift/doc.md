# 文档

- [swift](https://developer.apple.com/documentation/swift)
- [swift-book](https://docs.swift.org/swift-book/)

# 中文版教程

- [swiftgg](https://swiftgg.gitbook.io/swift/huan-ying-shi-yong-swift)

# 常量和变量

- `let` 申明常量
- `var` 申明变量


## 类型注解

- swfit可根据代码的上下文自行推断变量的类型
- 如果申明变量时不想赋上初始值则可以加上类型注解（type annotation）来让swift知道是什么类型



# 基础数据类型

## 字符串

```swift
var str = "str"
var str2 = String.init()
var str3 = String()
var str4 = String.init(repeating: "a", count: 10)
// 多行
// 多行中增加\来转义换行来表明这段话为同一行
// 如果要使用一个变量可以用：\(变量名)
var str5 = """
这个是
多行
"""
// 拼接字符串
var str6 = "Hello"
var str7 = "World"
var str8 = str6 + str7
str6.append(str7)

```
## 数字
- 整型
  * 8、16、32、64位
  * `Int` 有符号 
  * `UInt` 无符号 
- 浮点型
  * `Float` 单精度 32位
  * `Double` 双精度 64位


## 布尔值
- `Bool`


# 复杂数据类型

## 数组

```swift
var arr = [Int]()
var arr1: [Int] = []
var arr2 = Array<Int>()
var arr3 = Array<Int>.init()
var arr4 = Array.init(repeating: 1, count: 5)

// 连接2个数组
var arr5 = Array.init(repeating: 2, count: 3)
print(arr4 + arr5) // [1, 1, 1, 1, 1, 2, 2, 2]

// 添加新元素 append(_:)
arr5.append(3)
print(arr5) // [2, 2, 2, 3]

// insert(_:at:)
arr5.insert(4, at: 2)
print(arr5) // [2, 2, 4, 2, 3]

// 字面量声明
let arr6 = [
  "str1",
  "str2",
]
// 访问
print(arr6[0]) // str1
```

## 集合
- 按照某种有效的随机顺序存储，非有序
- 元素唯一
- 可进行交集、并集操作

```swift
var fruits = Set<String>()
var colors = Set<String>.init()
fruits.insert("banana")
var animals: Set<String> = []
var plants = Set(["tree", "flower"])
```

## 字典

```swift
var scores = [
  "Bob": 43,
  "Alice": 23,
  "Daisy": 10
]
var heights: [String:Double] = [:]
heights["zs"] = 1.78

```
## 元组
- 初始化完成后无法添加和删除元素、修改元素类型，可修改元素的值
- 可以使用数字位置或命名来访问

```swift
let lang = ("C", 1)
print("\(lang.0)------\(lang.1)") // C------1
let airline = (code: "HO", name: "吉祥航空")
print("code: \(airline.0),name: \(airline.name)") // code: HO,name: 吉祥航空
```

## 枚举
- first-class 类型，采用了很多传统上只被类支持的特性
- 不会被默认赋一个整型值
- 可以设置枚举关联值
- 访问原始值 `rawValue`
```swift
// 申明
enum Fruit {
  case apple
  case orange
}
enum Weekday {
  case monday, tuesday, wednesday
}
// 使用
var today:Weekday = Weekday.monday // 或 .monday 或 var today = Weekday.monday

// 遍历枚举
enum Test: CaseIterable {
  case test1
  case test2
  case test3
}
for test in Test.allCases {
  print(test)
}
```

# 运算符

## 算术运算符
- `+`、`-`、`*`、`/`、`%`
- 不同数据类型不能进行运算
- `isMultiple(of:)`方法可用来判断是否能整除
```swift
var number = 123
let isMultiple = number.isMultiple(of: 7)
```


## 组合复制运算符
- `+=`
- `-=`
- swift 不支持 `++`和`--`


## 比较运算符
- `==`
- `!=`
- `>`
- `<`
- `>=`
- `<=`
- `===` 恒等，用来判断2个对象是否是同一个实例
- `!==`不恒等

## 逻辑运算符
- `!`
- `&&`
- `||`

## 三元运算符
- `? :`

## 区间操作符
- `..<` 半开区间，不包含最后的值
- `...` 闭区间，第一个和最后一个都包含

# 控制流
## 条件语句
- `if`、`elseif`、`else`
- `switch`
  * 不存在隐式的贯穿，即不需要再每个`case`的最后加上`break`
  * 可使用`fallthrough`关键字进行显示贯穿
  * `case` 分支可区间匹配


## 循环

### for-in 循环

```swift
// 遍历数组
let names = ["Anna", "Alex", "Brian", "Jack"]
for name in names {
    print("Hello, \(name)!")
}
// 遍历字典
let numberOfLegs = ["spider": 8, "ant": 6, "cat": 4]
for (animalName, legCount) in numberOfLegs {
    print("\(animalName)s have \(legCount) legs")
}
// 遍历区间
for index in 1...5 {
    print("\(index) times 5 is \(index * 5)")
}
```

### while 循环
- while 循环，每次在循环开始时计算条件是否符合
- repeat-while 循环，每次在循环结束时计算条件是否符合(类似其他语言的do while)
```
while condition {
    statements
}

repeat {
    statements
} while condition
```

# 函数

```swift
// 函数定义
func greet(person: String) -> String {
    let greeting = "Hello, " + person + "!"
    return greeting
}
```

## 多重返回值函数
- 可以用元组（tuple）类型让多个值作为一个复合值从函数中返回

## 函数参数标签和参数名称
每个函数参数都有一个参数标签（argument label）以及一个参数名称（parameter name）。参数标签在调用函数的时候使用；调用的时候需要将函数的参数标签写在对应的参数前面。参数名称在函数的实现中使用。默认情况下，函数参数使用参数名称来作为它们的参数标签。
```swift
func someFunction(firstParameterName: Int, secondParameterName: Int) {
    // 在函数体内，firstParameterName 和 secondParameterName 代表参数中的第一个和第二个参数值
}
someFunction(firstParameterName: 1, secondParameterName: 2)
```
所有的参数都必须有一个独一无二的名字。虽然多个参数拥有同样的参数标签是可能的，但是一个唯一的参数标签能够使你的代码更具可读性。

## 指定参数标签
可以在参数名称前指定它的参数标签，中间以空格分隔：
```swift
func someFunction(argumentLabel parameterName: Int) {
    // 在函数体内，parameterName 代表参数值
}
```
```swift
func greet(person: String, from hometown: String) -> String {
    return "Hello \(person)!  Glad you could visit from \(hometown)."
}
print(greet(person: "Bill", from: "Cupertino"))
```


## 忽略参数标签
如果不希望为某个参数添加一个标签，可以使用一个下划线（_）来代替一个明确的参数标签。
```swift
func someFunction(_ firstParameterName: Int, secondParameterName: Int) {
     // 在函数体内，firstParameterName 和 secondParameterName 代表参数中的第一个和第二个参数值
}
someFunction(1, secondParameterName: 2)
```
如果一个参数有一个标签，那么在调用的时候必须使用标签来标记这个参数。

## 默认参数值
```swift
func someFunction(parameterWithoutDefault: Int, parameterWithDefault: Int = 12) {
    // 如果你在调用时候不传第二个参数，parameterWithDefault 会值为 12 传入到函数体中。
}
someFunction(parameterWithoutDefault: 3, parameterWithDefault: 6) // parameterWithDefault = 6
someFunction(parameterWithoutDefault: 4) // parameterWithDefault = 12
```

## 可变参数
一个可变参数（variadic parameter）可以接受零个或多个值。函数调用时，你可以用可变参数来指定函数参数可以被传入不确定数量的输入值。通过在变量类型名后面加入（...）的方式来定义可变参数。
可变参数的传入值在函数体中变为此类型的一个数组。例如，一个叫做 numbers 的 Double... 型可变参数，在函数体内可以当做一个叫 numbers 的 [Double] 型的数组常量。
```swift
func arithmeticMean(_ numbers: Double...) -> Double {
    var total: Double = 0
    for number in numbers {
        total += number
    }
    return total / Double(numbers.count)
}
arithmeticMean(1, 2, 3, 4, 5)
arithmeticMean(3, 8.25, 18.75)
```
> 注意:
一个函数最多只能拥有一个可变参数。

## 输入输出参数
函数参数默认是常量。试图在函数体中更改参数值将会导致编译错误。这意味着你不能错误地更改参数值。如果你想要一个函数可以修改参数的值，并且想要在这些修改在函数调用结束后仍然存在，那么就应该把这个参数定义为输入输出参数（In-Out Parameters）。
定义一个输入输出参数时，在参数定义前加 inout 关键字。一个 输入输出参数有传入函数的值，这个值被函数修改，然后被传出函数，替换原来的值。想获取更多的关于输入输出参数的细节和相关的编译器优化，请查看 输入输出参数 一节。
你只能传递变量给输入输出参数。你不能传入常量或者字面量，因为这些量是不能被修改的。当传入的参数作为输入输出参数时，需要在参数名前加 & 符，表示这个值可以被函数修改。
注意
输入输出参数不能有默认值，而且可变参数不能用 inout 标记。
下例中，`swapTwoInts(_:_:)` 函数有两个分别叫做 a 和 b 的输入输出参数：
```swift
func swapTwoInts(_ a: inout Int, _ b: inout Int) {
    let temporaryA = a
    a = b
    b = temporaryA
}
```
`swapTwoInts(_:_:)` 函数简单地交换 `a` 与 `b` 的值。该函数先将 `a` 的值存到一个临时常量`temporaryA`中，然后将 `b` 的值赋给 `a`，最后将 `temporaryA` 赋值给 `b`。

你可以用两个 `Int` 型的变量来调用`swapTwoInts(_:_:)`。需要注意的是，`someInt` 和 `anotherInt` 在传入 `swapTwoInts(_:_:)`函数前，都加了 & 的前缀：

```swift
var someInt = 3
var anotherInt = 107
swapTwoInts(&someInt, &anotherInt)
print("someInt is now \(someInt), and anotherInt is now \(anotherInt)")
```

从上面这个例子中，我们可以看到 someInt 和 anotherInt 的原始值在 swapTwoInts(_:_:) 函数中被修改，尽管它们的定义在函数体外。

> 注意
输入输出参数和返回值是不一样的。上面的 `swapTwoInts` 函数并没有定义任何返回值，但仍然修改了 `someInt` 和 `anotherInt` 的值。输入输出参数是函数对函数体外产生影响的另一种方式。

## 函数类型
每个函数都有种特定的函数类型，函数的类型由函数的参数类型和返回类型组成。
例如：
```swift
func addTwoInts(_ a: Int, _ b: Int) -> Int {
    return a + b
}
func multiplyTwoInts(_ a: Int, _ b: Int) -> Int {
    return a * b
}
```
这个例子中定义了两个简单的数学函数：`addTwoInts` 和 `multiplyTwoInts`。这两个函数都接受两个`Int`值， 返回一个`Int`值。
这两个函数的类型是`(Int, Int) -> Int`，可以解读为:
“这个函数类型有两个`Int`型的参数并返回一个`Int`型的值”。
下面是另一个例子，一个没有参数，也没有返回值的函数：
```swift
func printHelloWorld() {
    print("hello, world")
}
```
这个函数的类型是：`() -> Void`，或者叫“没有参数，并返回 Void 类型的函数”。

## 使用函数类型

在 Swift 中，使用函数类型就像使用其他类型一样。例如，你可以定义一个类型为函数的常量或变量，并将适当的函数赋值给它：

`var mathFunction: (Int, Int) -> Int = addTwoInts`

这段代码可以被解读为：

”定义一个叫做`mathFunction`的变量，类型是‘一个有两个`Int`型的参数并返回一个`Int`型的值的函数’，并让这个新变量指向 `addTwoInts`函数”。
`addTwoInts`和 `mathFunction`有同样的类型，所以这个赋值过程在 Swift 类型检查（type-check）中是允许的。
现在，你可以用`mathFunction`来调用被赋值的函数了：

```
print("Result: \(mathFunction(2, 3))")
// Prints "Result: 5"
```

有相同匹配类型的不同函数可以被赋值给同一个变量，就像非函数类型的变量一样：
```
mathFunction = multiplyTwoInts
print("Result: \(mathFunction(2, 3))")
// Prints "Result: 6"
```

就像其他类型一样，当赋值一个函数给常量或变量时，你可以让 Swift 来推断其函数类型：
```
let anotherMathFunction = addTwoInts
// anotherMathFunction 被推断为 (Int, Int) -> Int 类型
```

## 函数类型作为参数类型
你可以用`(Int, Int) -> Int`这样的函数类型作为另一个函数的参数类型。这样你可以将函数的一部分实现留给函数的调用者来提供。

下面是另一个例子，正如上面的函数一样，同样是输出某种数学运算结果：
```
func printMathResult(_ mathFunction: (Int, Int) -> Int, _ a: Int, _ b: Int) {
    print("Result: \(mathFunction(a, b))")
}
printMathResult(addTwoInts, 3, 5)
// 打印“Result: 8”
```

这个例子定义了`printMathResult(_:_:_:)`函数，它有三个参数：第一个参数叫`mathFunction`，类型是`(Int, Int) -> Int`，你可以传入任何这种类型的函数；第二个和第三个参数叫`a`和`b`，它们的类型都是`Int`，这两个值作为已给出的函数的输入值。
当`printMathResult(_:_:_:)`被调用时，它被传入`addTwoInts`函数和整数 `3`和 `5`。它用传入 `3` 和 `5` 调用 `addTwoInts`，并输出结果：`8`。
`printMathResult(_:_:_:)`函数的作用就是输出另一个适当类型的数学函数的调用结果。它不关心传入函数是如何实现的，只关心传入的函数是不是一个正确的类型。这使得`printMathResult(_:_:_:)`能以一种类型安全（type-safe）的方式将一部分功能转给调用者实现。

## 函数类型作为返回类型

```swift
func stepForward(_ input: Int) -> Int {
    return input + 1
}
func stepBackward(_ input: Int) -> Int {
    return input - 1
}
```
```swift
func chooseStepFunction(backward: Bool) -> (Int) -> Int {
    return backward ? stepBackward : stepForward
}
```

```swift
var currentValue = 3
let moveNearerToZero = chooseStepFunction(backward: currentValue > 0)
// moveNearerToZero 现在指向 stepBackward() 函数。
```
```swift
print("Counting to zero:")
// Counting to zero:
while currentValue != 0 {
    print("\(currentValue)... ")
    currentValue = moveNearerToZero(currentValue)
}
print("zero!")
// 3...
// 2...
// 1...
// zero!
```
### 嵌套函数
到目前为止本章中你所见到的所有函数都叫全局函数（global functions），它们定义在全局域中。你也可以把函数定义在别的函数体中，称作 嵌套函数（nested functions）。
默认情况下，嵌套函数是对外界不可见的，但是可以被它们的外围函数（enclosing function）调用。一个外围函数也可以返回它的某一个嵌套函数，使得这个函数可以在其他域中被使用。
你可以用返回嵌套函数的方式重写 `chooseStepFunction(backward:)` 函数：
```swift
func chooseStepFunction(backward: Bool) -> (Int) -> Int {
    func stepForward(input: Int) -> Int { return input + 1 }
    func stepBackward(input: Int) -> Int { return input - 1 }
    return backward ? stepBackward : stepForward
}
var currentValue = -4
let moveNearerToZero = chooseStepFunction(backward: currentValue > 0)
// moveNearerToZero now refers to the nested stepForward() function
while currentValue != 0 {
    print("\(currentValue)... ")
    currentValue = moveNearerToZero(currentValue)
}
print("zero!")
// -4...
// -3...
// -2...
// -1...
// zero!
```

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

