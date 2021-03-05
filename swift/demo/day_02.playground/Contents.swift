import UIKit

var arr = [Int]()
var arr1: [Int] = []
var arr2 = Array<Int>()
var arr3 = Array<Int>.init()
var arr4 = Array.init(repeating: 1, count: 5)

// 连接2个数组
var arr5 = Array.init(repeating: 2, count: 3)
print(arr4 + arr5) // [1, 1, 1, 1, 1, 2, 2, 2]
arr5.append(3)
print(arr5)
arr5.insert(4, at: 2)
print(arr5)
// 字面量声明
let arr6 = [
  "str1",
  "str2",
]
// 访问
print(arr6[0]) // str1

// 元组
let lang = ("C", 1)
print("\(lang.0)------\(lang.1)")

let airline = (code: "HO", name: "吉祥航空")
print("code: \(airline.0),name: \(airline.name)")

enum Weekday {
  case monday, tuesday, wednesday
}

// 遍历枚举
enum Test: CaseIterable {
  case test1
  case test2
  case test3
}
for test in Test.allCases {
  print(test)
}
