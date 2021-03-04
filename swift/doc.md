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


## 字典


## 元组


## 枚举