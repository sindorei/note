# 数据类型


可以使用`type`函数测试给定变量或者字面量的类型

## 8中基本类型
- `nil`
  * 只有值`nil`属于该类型，表示一个无效值（在条件表达式中相当于false）
- `boolean`
  * 包含两个值：`false`和`true`。
  * Lua 把 `false` 和 `nil` 看作是 `false`，其他的都为 `true`，数字 `0` 也是 `true`
- `number`
  * 64-bit integers and double-precision (64-bit) floats, but you can also compile Lua so that it uses 32-bit integers and/or single-precision (32-bit) floats.
- `string`
  * 字符串由一对双引号或单引号来表示
  * 也可以用 2 个方括号 `[[]]`来表示"一块"字符串
  * 使用 `#` 来计算字符串的长度
  * 使用`..`进行字符串连接

```lua
html = [[
<html>
<head></head>
<body>
    <h1>Hello World</h1>
</body>
</html>
]]
print(html)

str = 'Hello'
print(#str)
print(#'World!')
```

- `function`

```lua
function factorial(n)
    if n == 0 then
        return 1
    else
        return n * factorial(n - 1)
    end
end
print(factorial(5))
```

- `table`
  * 其实是一个"关联数组"（associative arrays），数组的索引可以是数字、字符串或表类型。通过"构造表达式"来创建，最简单构造表达式是`{}`，用来创建一个空表。

```lua
local tbl = {"apple", "pear", "orange", "grape"}
local table1 = {key1 = 1, key2 = 2, key3 = 3}
for k ,v in pairs(table1) do
	print(k, v)
end
```

- `userdata`
  * 一种用户自定义数据，用于表示一种由应用程序或 C/C++ 语言库所创建的类型，可以将任意 C/C++ 的任意数据类型的数据（通常是 struct 和 指针）存储到 Lua 变量中调用。
- `thread`
  * 表示执行的独立线路，用于执行协同程序