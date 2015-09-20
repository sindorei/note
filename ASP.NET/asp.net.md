# ASP.NET 内部对象

* Server HttpServerUtility
* Request HttpRequest
* Response HttpResponse
* Application HttpAplicationState
* Session  HttpSessionState
* Context HttpContext
* Trace TraceContext

# ASP.NET 页面事件

* Page_PreInit 检查IsPostBack属性来确定页面是否首次处理。创建或重新创建动态对象，比如控件或母版页。

* Page_Init 读取或初始化控件属性
* Page_PreLoad 在加载事件之前执行页面上的命令
* Page_Load 设置控件属性并配置数据库连接
* Page_Unload 执行控件和页面本身的清理任务，比如关闭某个数据库连接

页面事件处理程序参数:
* sender 该参数提供了到引起事件的对象的引用
* e 该参数包含了针对某类事件的特定信息