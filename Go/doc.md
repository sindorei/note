# 安装
- [download](https://golang.org/dl/)



# 基本结构
```go
package main

import "fmt"

func main() {
	fmt.Println("Hello World!")
}
```


# 应用程序入口
- 必须是main包 `package main`
- 必须是main方法 `func main()`
- 文件名不一定是 `main.go`


# 编写测试程序
- 源码文件以`_test`结尾：`xxx_test.go`
- 引入测试包`import "testing"`
- 测试方法以`Test`开头：`func TestXXX(t *testing.T) { ... }`
- 运行测试 `go test -v`

# 与其他主要编程语言差异

## 退出返回值

- go中`main`函数不支持任何返回值
- 通过`os.Exit`来返回状态

## 获取命令行参数
- 程序中通过`os.Args`获取命令行参数

## 变量赋值
- 赋值可以进行自动类型推断
- 在一个赋值语句中可以对多个变量进行同时赋值

## 常量设置
- 快速设置连续值
```go
const (
    Monday = iota + 1
    Tuesday
    Wednesday
)

const (
    Open = 1 << iota
    Close
    Pending
)
```

## 类型转换
- Go语言不允许隐式类型转换
- 别名和原有类型也不能进行隐式类型转换


# 基本数据类型
- bool
- string
- int int8 int16 int32 int64
- uint uint8 uint16 uint32 uint64 uintptr
- byte // alias for uint8
- rune // alias for int32, represents a Unicode code point
- float32 float64
- complex64 complex128



# 类型的预定义值
- `math.MaxInt64`
- `math.MaxFloat64`
- `math.MaxUint32`

# 指针类型
- 不支持指针运算
- `string`是值类型，其默认的初始值为空字符串，而不是`nil`


# 运算符

## 算术运算符
- 没有前置 `++`、 `--`

## 比较运算符
- 用`==`比较数组
  * 相同维数且含有相同个数元素的数组才可以比较
  * 每个元素都相同的才相等


## 位运算符
- `&^` 按位置零


# 循环
- Go语言仅支持循环关键字`for`
```go
n := 5
for n < 5 {
    n++
}
```

# if 条件
- condition 表达式结果必须为布尔值
- 支持变量赋值
```go
if condition1 {

} else if condition2 {

} else {

}

if var declaration; condition {

}
```

# switch条件
- 条件表达式不限制为常量或整数
- 单个case中可以出现多个结果选项，使用逗号分隔 `case 1,2:`
- 与C语言等规则相反，Go语言不需要break来明确退出一个case
- 可以不设定switch之后的条件表达式，在此种情况下，整个switch结构与多个if... else...的逻辑作用等同


# 数组

## 数组的声明
```go
var a [3]int
b := [3]int{1, 2, 3}
c := [2][2]int{{1, 2}, {3, 4}}
```

## 数组的遍历
```go
```

## 数组截取
- `a[开始索引（包含）:结束索引(不包含)]`
- `a[1:3]`