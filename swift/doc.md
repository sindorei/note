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