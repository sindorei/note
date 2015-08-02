# AngularJs
优势：
* 构建一个CRUD应用可能用到的全部内容包括：数据绑定、基本模板标识符、表单验证、路由、深度链接、组件重用、依赖注入。
* 测试方面包括：单元测试、端对端测试、模拟和自动化测试框架。
* 具有目录布局和测试脚本的种子应用作为起点。
并不是所有的应用都适合用AngularJS来做。AngularJS主要考虑的是构建CRUD应用

### ng-app
 开始启用AngularJS，标记ANgularJS的作用域
### angularjs中的mvc模式
 1. 作用域
   $scope对象是模板的域模型（domain model），也称为作用域实例。
   通过为其属性赋值，可以传递数据给模板渲染。
 从概念上，angularjs的作用域与MVVM模式的视图模型非常相似
 2. 控制器
   controller 主要负责初始化作用域实例
   在实践中，初始化逻辑分为：
     * 提供模型的初始值
     * 增加UI相关的行为（函数）以扩展$scope对象。
   注：设定模型初始化值时，控制器和ng-init指令做同样的工作。
   控制器可以让你在JavaScript代码中表达初始化逻辑，而不污染HTML模板。
 3. 模型
 普通的JavaScript对象。任何有效的对象或数组都可以。
 只需将模型指派给$scope
 ### 深入作用域
 每个$scope都是Scope类的实例。Scope类拥有很多方法，用于控制作用域的生命周期、提供事件传播功能，以及支持模板的渲染等。
 ##### 作用域层级
 ```javascript
 var HelloCtrl = function($scope){
    $scope.name = 'World';
 }
 ```
 $scope参数从何而来？
   ng-controller 指令会调用scope对象的`$new()` 方法创建新的作用域$scope。
   $rootScope 是其他所有作用域的父作用域，将在新应用启动时自动创建。
   
   ng-controller指令时作用域创建指令。当在DOM树种遇到作用域创建指令时，angularjs都会创建Scope类的心实例$scope。
   新创建的作用域实例$scope会拥有$parent属性，并指向它的父作用域。
   
##### 作用域层级和继承
作用域中定义的属性对所有子作用域是可见的，只要子作用域没有定义同名的属性。
angularjs中的作用域继承和javascript中的原型继承遵循同样的规则。（沿继承树向上查找，直到找到为止。）
##### 在作用域层级中继承的风险
避免直接绑定变量给作用域属性
对象属性的双向数据绑定是更好的方案
##### 作用域层级与事件系统
angularjs允许跨越作用域层级，传播带有信息的命名事件。
事件可以从任何作用域开始分发，然后向上分发或向下传播。
每个作用域实例都有 `$on` 方法，用于注册作用域事件的处理器。被分发的 event对象会作为第一个参数传入。
event对象有 preventDefault() 和 stopPropagation()方法
stopPropagation() 阻止事件通过作用域层级冒泡，即它仅在事件向上分发时有效

*angularjs事件系统模仿DOM的事件系统，但他们传播机制完全独立，没有共通之处*

三个事件可以被向上分发：
 * $includeContentRequested
 * $includeContentLoaded
 * viewContentLoaded
七个事件可以被向下广播：
 * $locationChangeStart
 * $locationChangeSuccess
 * $routeUpdate
 * $routeChangeStart
 * $routeChangeSuccess
 * $routeChangeError
 * $destroy

**不要再angularjs中试图模仿DOM的基于事件的编程模型，大部分情况下，最好使用双向数据绑定**
