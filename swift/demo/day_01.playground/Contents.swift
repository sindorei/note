import UIKit


var str = "str"
var str2 = String.init()
var str3 = String()
var str4 = String.init(repeating: "a", count: 10)
// 多行
var str5 = """
声明多行字符串
多行中增加\\来转义换行来表明这段话为同一行
如果要使用一个变量可以用：\\(变量名)"
"""
// 拼接字符串
var str6 = "Hello"
var str7 = "World"
var str8 = str6 + str7
str6.append(str7)

print(str5)
