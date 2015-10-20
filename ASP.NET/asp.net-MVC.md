# ViewData 和 ViewBag
数据从控制器传送到视图 通过 ViewData（ViewDataDictionary字典类）

`ViewData["CurrentTime"] = DateTime.Now;`

ViewBag 是 ViewData的动态封装器

ViewBag.CurrentTime 等同于 ViewData["CurrentTime"]

差异：
- 当要访问的关键字是一个有效的C#标识符时，ViewBag才起作用
- 动态值不能作为参数传递给扩展方法（C#编译器为了选择正确的扩展方法，在编译时必须知道每个参数的真正类型） 使用ViewData或把ViewBag转成具体的类型 如 (string)ViewBag.Name

# 强类型视图

告知视图哪种类型的模型正在使用 @model声明  

需输入模型类型的完全限定类型名（名称空间和类型名称）

如果不想输入模型的完全限定类型名，可使用@using关键字声明
对于视图中经常用的命名空间，可在Views目录下的web.config文件中声明

`@Ajax.JavaScriptStringEncode`