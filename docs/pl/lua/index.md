# 基础语法

## 注释

```lua
-- 单行注释


--[[
 多行注释
 多行注释
 --]]
 
```


## 标识符

- 标示符以一个字母 A 到 Z 或 a 到 z 或下划线 _ 开头后加上 0 个或多个字母，下划线，数字（0 到 9）。
- 不能是Lua关键字。
- 最好不要使用下划线加大写字母的标示符，因为Lua的保留字也是这样的。
- 区分大小写。

关键字：
```
 and       break     do        else      elseif    end
 false     for       function  goto      if        in
 local     nil       not       or        repeat    return
 then      true      until     while
```

## 变量申明

BNF格式： `var ::= Name`

```lua
str = 'Hello' -- 全局变量
local str2 = 'World!' -- 局部变量

a, b, c = 1, 2, 2 -- 多个变量同时赋值
print(a,b,c)
```

未申明的变量为`nil`

## 参考
- [官方文档](https://www.lua.org/docs.html)




