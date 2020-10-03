# 安装
- [download](https://golang.org/dl/)



# 基本结构
```
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
- 测试方法以`Test`开头：`func TestXXX(t *testing.T) { ... }`

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
```
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