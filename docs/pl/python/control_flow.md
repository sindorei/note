# 控制结构


## 条件语句

Python程序语言指定任何非`0`和非`None`值为`True`，`0` 或者 `None`为`False`

```python
num = 5 
if num == 1:
    # 执行语句……
elif num == 2:
    # 执行语句……
else:
    # 执行语句……
```


Python中没有`switch`语句

## 循环语句

### while 循环

没有 do..while 循环

```python
count = 0
while (count < 9):
   print('The count is:', count)
   count = count + 1

print('Bye!')
```



### for 循环

```python
for iterating_var in sequence:
   statements(s)
```

### 循环控制语句
- `break`
- `continue`
- `pass` 空语句，是为了保持程序结构的完整性。