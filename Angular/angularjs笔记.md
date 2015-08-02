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