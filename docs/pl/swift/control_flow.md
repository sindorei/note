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