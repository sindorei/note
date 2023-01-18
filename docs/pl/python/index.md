
# 基础语法

```python
# 注释以#开头。变量直接赋值，无需类型声明。
x = int(input("Please enter an integer: "))
# 每一行都是一个语句，当语句以冒号:结尾时，缩进的语句视为代码块。必须包含相同的缩进空白数量，不然会报`IndentationError`错误。
if x < 0:
    x = 0
    print('Negative changed to zero')
elif x == 0:
    print('Zero')
elif x == 1:
    print('Single')
else:
    print('More')

a, b, c = 1, 2, 2 # 多个变量同时赋值
print(a,b,c)
```



## 数据类型
- Numeric Types 数字类型
    * `int`（有符号整型）
        * Python2.X 版本中，在 2.2 以后的版本中还有`long` 类型。在 Python3.X 版本中 `long` 类型被移除，使用 `int` 替代。
    * `float`（浮点型）
    * `complex`（复数）
- Text Sequence Type  文本序列类型（字符串）
  * `str`
- 布尔 `bool`
  * `True` 、`False` 注意是大写开头
- The Null Object `NoneType`
  * `None`
- Sequence Types 序列类型
  * `list`
  * `tuple`
  * `range`
- Set Types集合类型
  * `set`,
  * `frozenset`
- Mapping Types 映射类型 
  * `dict`
- Binary Sequence Types 二进制序列类型
  * `bytes`
  * `bytearray`
  * `memoryview`
- [...](https://docs.python.org/zh-cn/3.11/library/stdtypes.html)


## 运算符

### 算术运算符
- `+` 加
- `-` 减
- `*` 乘
- `/` 除
- `//` 整除
- `**` 幂 - 返回x的y次幂
- `%` 取模 - 返回除法的余数
- `@` 矩阵乘


### 位运算符
- `<<` 左移
- `>>` 右移
- `&` 按位与 
- `|` 按位或 
-  `^ ` 按位异或
- `~` 按位取反运算

### 赋值运算符
- `:=`
   * `+=`
   * `-=`
   * `*=`
   * `/=`
   * `%=`
   * `**=`
   * `//=`

### 比较运算符
- `<` 小于
- `>` 大于
- `<=` 小于等于
- `>=` 大于等于
- `==` 等于
- `!=` 不等于

### 逻辑运算符
- `and`
- `or`
- `not`

### 成员运算符(成员检测)
- `in`
- `not in`

### 身份运算符
- `is` 判断两个标识符是不是引用自一个对象
- `is not`判断两个标识符是不是引用自不同对象


## 语法描述格式

采用经过改进的 BNF (巴科斯范式)语法标注。样式如下：
```
name      ::=  lc_letter (lc_letter | "_")*
lc_letter ::=  "a"..."z"
```
以上标注的解释：第一行表示 `name` 是 `lc_letter` 之后跟零个或多个 `lc_letter` 和下划线。而 `lc_letter` 则是任意单个 `'a'` 至 `'z'`字符。

标注格式的解释：每条规则的开头是一个名称 (即该规则所定义的名称) 加上 `::=`。 竖线 (`|`) 被用来分隔可选项，它是此标注中绑定程度最低的操作符。 星号 (`*`) 表示前一项的零次或多次重复，类似地，加号 (`+`) 表示一次或多次重复，而由方括号括起的内容 (`[ ]`) 表示出现零次或一次 (或者说，这部分内容是可选的)。 `*` 和 `+` 操作符的绑定是最紧密的，圆括号用于分组。 字符串字面值包含在引号内。 空格的作用仅限于分隔形符。 每条规则通常为一行，有许多个可选项的规则可能会以竖线为界分为多行。

在词法定义中 (如上述示例)，还额外使用了两个约定: 由三个点号分隔的两个字符字面值表示在指定 (闭) 区间范围内的任意单个 ASCII 字符。由尖括号 (`<...>`) 括起来的内容是对于所定义符号的非正式描述；即可以在必要时用来说明 '控制字符' 的意图。

词法定义和句法定义都是采用此格式，区别在: 词法（lexical）定义作用于源代码中单独的字符，而句法（syntactic）定义则作用于由词法分析所生成的token流。



## 参考
- [官方文档](https://docs.python.org/)
