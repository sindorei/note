# 函数

## 语法

```
	functiondef ::= function funcbody
	funcbody ::= ‘(’ [parlist] ‘)’ block end
```

简化定义的语法糖：
```
	stat ::= function funcname funcbody
	stat ::= local function Name funcbody
	funcname ::= Name {‘.’ Name} [‘:’ Name]
```
语句：
```
    function f () body end
```
翻译成：
```
    f = function () body end
```
语句：
```
    function t.a.b.c.f () body end
```
翻译成：
```
    t.a.b.c.f = function () body end
```
语句：
```
    local function f () body end
```
翻译成：
```
    local f; f = function () body end
```
并不是：
```
    local f = function () body end
```

```lua
function max(num1, num2)

   if (num1 > num2) then
      result = num1
   else
      result = num2
   end

   return result
end

print(max(1,2))
```

## 多个返回值
```lua
function test(p1, p2)
	return p1 + 1, p2 + 1
end
local t1, t2 = test(1, 2)
print(t1, t2)
```

## 可变参数

```lua
function average(...)
   result = 0
   local arg = {...}
   for i, v in ipairs(arg) do
      result = result + v
   end
   print("总共传入 " .. select("#",...) .. " 个数")
   return result / select("#",...)
end

print("平均值为",average(10,5,3,4,5,6))
```