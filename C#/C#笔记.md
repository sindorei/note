标准的System名称空间包含了最常用的.NET类型

在C#中做的所有工作都依赖于.NET基类

几乎所有的C#程序都使用System命名空间中的类

# 变量

用 var 声明变量：
- 变量必须初始化
- 初始化器不能为空
- 初始化器必须放在表达式中
- 不能把初始化器设置为一个对象，除非在初始化器中创建了一个对象

### 变量的作用域
- 局部变量存在于表明该变量的块语句或方法结束的右花括号之前的作用域内
- 在for、while或类似语句中声明的局部变量存在于该循环体内

### 常量
```C#
const int a = 100;
```

- 常量必须在声明时初始化。指定了值后，就不能再更改。
- 常量的值必须能在编译时用于计算。因此，不能用从一个变量中提取的值来初始化常量。如果需要这么做，应使用只读字段。
- 常量总是静态的。但注意，不必在常量声明中包含修饰符static

程序中使用常量的好处：

- 由于使用易于读取的名称替代了较难读取的数字或字符串，常量使程序变得更易于阅读
- 常量使程序更易于修改
- 常量更容易避免程序出现错误

# 数据类型
- 值类型 存储在堆栈中
- 引用类型 存储在托管堆上

如果变量是一个引用类型，可以把其值设为null，表示不引用任何对象

如果将引用设置为null，就不可能对它调用任何非静态的成员函数或字段，这么做会在运行期间抛出一个异常

# CTS类型
c#认可的基本预定义类型并没有内置于C#语言中，而是内置于.NET Framework中

在语法上，可以把所以的基本数据类型看作是支持某些方法的类

C#中声明一个int类型的数据，实际上是.NET结构System.Int32的一个实例

C#有15个预定义类型，其中13个是值类型，2个是引用类型（string和Object）
# 预定义的值类型
### 整型
- sbyte  System.SByte 8位有符号的整数
- short System.Int16 16位有符号的整数
- int 32位
- long 64位
- byte 8位无符号整数
- unshort System.UInt16 16位无符号整数
- uint
- ulong

如果对一个整数是int、uint、long或者是ulong没有任何显示的声明，则该变量默认为int类型

为了把输入的值指定为其他整数类型，需在数字后加字符，不区分大小写。推荐大写
```C#
uint ui = 123U;
long l = 1234L;
ulong ul = 1234UL;
```

### 浮点类型
- float System.Single 32位单精度浮点数  位数7
- double System.Double 64位双精度浮点数 位数15/16

如果代码中没有对某个非整数值硬编码，则编译器一般假定该变量是double。如果要指定为float，需在值后加上F（或f）：
```C#
float f = 12.3F;
```
### decimal类型
decimal System.Decimal 128位高精度十进制表示法  位数 28 

要把数字指定为decimal类型，而不是double、float或整型，可在数字后面加上M

decimal类型不是基本类型，在计算时使用此类型会有性能损失

### bool类型
bool System.Boolean true、false

bool值和整数值不能相互隐式转换

### 字符类型
char System.Char 表示一个16位的Unicode字符

char类型的字面量是用单引号括起来的，如`'a'`。如果把字符放在双引号中，编译器会把它看做字符串，从而产生错误。

还可以用4位十六进制的Unicode值如：`'\u0041'`，带有数据类型转换的整数值`(char)65`或十六进制数`'\x0041'`， 转义序列表示它们

# 预定义的引用类型
- object System.Object 根类型，CTS中的其他类型都是从它派生出来的，包括值类型
- string System.String Unicode字符串

字符串是不可改变的

# 流控制
### 条件语句
- if
- switch
### 循环
- for循环
- while循环
- do while循环
- foreach循环
### 跳转语句
- goto 
```C#
goto label;
label:
     int i = 0;
```
- break

switch，while、do while、for循环中使用

- continue
- return

# 枚举
枚举是用户定义的整数类型。在声明一个枚举时，要指定该枚举的实例可以包含的一组可接受的值。

使用枚举比使用无格式的整数至少有如下3个优势：
- 枚举可以使代码更易于维护，有助于确保给变量指定合法的、期望的值
- 枚举使代码更清晰，允许用描述性的名称表示整数值。而不是用含义模糊、变化多端的数来表示。
- 枚举也使代码更易于键入。
```C#
public enum TimeOfDay
{
    Morning = 0,
    Afternoon = 1,
    Evening = 2
}
```

枚举的真正强大之处是它们在后台会实例化为派生与基类System.Enum的结构。一旦编译好，枚举就成为基本类型，与int和float类似。

从字符串中获取枚举值 `Enum.Parse()`

# 名称空间
可以给名称空间指定一个别名
```c#
using alias = NamespaceName;
```

 别名修饰符 `::`，`Introduction::NamespaceExample NSEX = new Introduction::NamespaceExample`
 
 # Main()方法
 
 多个Main()方法会报错，可以用`/main`选项，其后跟Main()方法所属类的全名（包括名称空间），明确告诉编译器把哪个方法作为程序的入口点：
 ```C#
 csc DoubleMain.cs /main:Wrox.MathExample
 ```
 
 Main()方法可以传递参数，此参数为字符串数组
 
 在启动程序时，程序可以使用这个数组，访问通过命令行传送过来的选项
 
 # 控制台 I/O
 
 - Console.ReadLine() 从控制台窗口读取一行文本
 - Console.Write()  将制定的值写入控制台窗口
 - Console.WriteLine() 和Console.Write() 类似，但在输出结果最后添加一个换行
 
 # C#预处理器指令
 
 # Attribute
 特性
 
 方括号括起来
 
 内置Attribute
 
  - Conditional("DEBUG") 
  - Obsolete 废弃的
  
  自定义Attribute
 
定义一个类继承 Attribute

AttributeUsage 适用条件

# 反射
 - GetType()
 - Type.GetType('类型名称',是否报异常,是否忽略大小写)
 - typeof(string)
 
 方法、属性的放射
 
 GetMethod()
 
 GetFields() GetProperites()
 
 ### 动态加载 推迟绑定
 Assembly
 
 # Linq
 
 查询表达式必须以from子句开头，以select或group子句结束
 
 在这两个句子之间可以使用where、orderby、join、let和其他from子句
 
 定义LINQ扩展方法的磊哥类是System.Linq名称空间中的Enumerable。
 
 导入此命名空间，就打开了这个类的扩展方法的作用域
 
 迭代在Linq查询定义时不会执行，而是在执行每个foreach语句时进行
 
 注意调用扩展方法ToArray()、ToEnumerable()、ToList() 。
 
 ### LINQ定义的标准查询操作符
 - `Where OfType<TResult>`
 
筛选操作符，定义了返回元素的条件。在Where查询操作符中可以使用谓词，例如lamda表达式中的谓词，来返布尔值。`OfType<TResult>` 根据类型筛选元素，只返回TResult类型的元素。


- Select 和 SelectMany


投射操作符，用于把对象转换为另一个类型的新对象。Select和SelectMany定义了根据选择器函数选择结果值的投射


- OrderBy、ThenBy、OrderByDescending、ThenByDescending、Reverse
 
 排序操作符。 OrderBy升序 OrderByDescending 降序  ThenBy 进行第二次排序 Reverse反转
 
- Join、GroupJoin
 
 连接运算符
 
- GroupBy、ToLookup
 
 组合运算符，把数据放在组中。GroupBy操作符组合所以公共键的元素。ToLookup通过创建一个一对多字典，来组合元素。
 
- Any、All、Contains
 
 限定操作符
 
- Take、Skip、TakeWhile、SkipWhile

分区操作符
 
- Distinct、Union、Intersect、Except、Zip
- First、FirstOrDefault、Last、LastOrDefault、ElementAt、ElementAtOrDefault、Single、SingleOrDefault
 
 返回一个满足条件的元素 指定返回的默认值
 
- Count、Sum、Min、Max、Average、Aggregate
 
 聚合操作符
 
- ToArray、ToEnumerable、ToList、ToDictionary、`Cast<TResult>`
 
 将集合转换为数组等
 
- Empty、Range、Repeat

返回一个新集合。Empty集合是空的。Range返回一系列数字。Repeat返回一个始终重复一个值的集合