# 控制结构

## if语句

```
stat ::= if exp then block {elseif exp then block} [else block] end
```
示例：
```lua
a = 100
if a == 10
then
   print("a 的值为 10" )
elseif( a == 20 )
then  
   print("a 的值为 20" )
else
   print("没有匹配 a 的值" )
end
print("a 的真实值为: ", a )
```

## while循环

```
stat ::= while exp do block end
```

示例：
```lua
a = 10
while a < 20
do
   print("a 的值为:", a)
   a = a + 1
end
```

## for循环


### 数字for循环
```
stat ::= for Name ‘=’ exp ‘,’ exp [‘,’ exp] do block end
```

```
for var=start,end,step do  
    <执行体>  
end 
```

`var` 从 `start` 变化到 `end`，每次变化以 `step` 为步长递增 `var`，并执行一次 "执行体"。`step` 是可选的，如果不指定，默认为`1`。

```lua
for i = 10, 1, -1 do
    print(i)
end
```

### 泛型for循环

```
stat ::= for namelist in explist do block end
namelist ::= Name {‘,’ Name}
```

```
for var_1, ···, var_n in explist do body end
```


```lua
a = {"one", "two", "three"}
for k, v in ipairs(a) do
    print(k, v)
end 
```


### repeat...until 循环


```
stat ::= repeat block until exp
```

```lua
a = 1
repeat
   print("a的值为:", a)
   a = a + 1
until a > 5
```