# 函数


```
def 函数名（参数列表）:
    函数体
```

```python
 
def max(a, b):
    if a > b:
        return a
    else:
        return b
```


## 关键字参数

```python
def printinfo( name, age ):
   "打印任何传入的字符串"
   print ("名字: ", name)
   print ("年龄: ", age)
   return
 
printinfo( age=18, name="hello" )
```


## 默认参数

```python
def printinfo( name, age = 35 ):
   "打印任何传入的字符串"
   print ("名字: ", name)
   print ("年龄: ", age)
   return
 
printinfo( age=18, name="hello" )
print ("------------------------")
printinfo( name="world" )
```

## 不定长参数

```
def functionname([formal_args,] *var_args_tuple ):
   "函数_文档字符串"
   function_suite
   return [expression]
```

```python
def printinfo( arg1, *vartuple ):
   "打印任何传入的参数"
   print ("输出: ")
   print (arg1)
   print (vartuple) # 以元组(tuple)的形式存放剩余参数, 还可以加两个星号 ** 会以字典的形式存入剩余参数
 
printinfo( 70, 60, 50 )
```

## lambda

```
lambda [arg1 [,arg2,.....argn]]:expression
```