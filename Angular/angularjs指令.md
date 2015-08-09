# 过滤器
## 模板中使用过滤器

| currentcy:'&yen;'

## 控制器中使用过滤器

用$filter服务
```javascript
$filter('uppercase')('hello')
```
## 自定义过滤器
模块下的`filter()`方法
```javascript
 angular.module('myTest',[]).filter('firstUpper',function(){
            return function(str,param){
              return str.charAt(0).toUpperCase()+str.substring(1);
            }
        }).controller('hehe',['$scope','$filter',function($scope,$filter){
            $scope.name = 'hello';
            $scope.name2 = 'world';
            $scope.name=$filter('firstUpper')($scope.name);
        }])
```

# ng-repeat 指令
## 扩展部分
* $index 索引
* $first 第一个返回true
* $middle 除了首尾都为true
* $last 
* $even
* $odd
* ng-repeat-start  用于兄弟节点重复指令
* ng-repeat-end

# 事件指令
* ng-click/dbclick
* ng-mousedown/up
* ng-mouseenter/leave
* ng-mousemove/over/out
* ng-keydown/up/press
* ng-focus/blur
* ng-submit
* ng-selected 下拉框被选中时，触发
* ng-change 输入框中数据发生改变时触发  配合`ng-model`
* ng-copy 
* ng-cut
* ng-paste

# input相关指令
* ng-disabled  为true 禁用
* ng-readonly 
* ng-checked  true选中状态 false 为选中状态
* ng-value 和原生value类似，但是在angularjs未解析前不显示

# 数据显示指令
* ng-bind
* ng-bind-template 支持多表达式
* ng-bind-html 需要引入ngSanitize模块
* ng-cloak 没解析完成display为none，解析完成变成block
* ng-non-bindable 不解析表达式

# 样式相关指令
* ng-class 
  
  `ng-class="{red:true,yellow:true}"`
  
* ng-style  `ng-style="{{mystyle}}"` `ng-style="{color:red,background:yellow}"`
* ng-href
* ng-src
* ng-attr-(suffix) 如：ng-attr-title

# DOM相关指令
* ng-show  true显示 false隐藏 实际就是设置css 的 display属性
* ng-hide
* ng-if   true添加标签，false删除标签
* ng-switch 
  * on
  * ng-switch-default
  * ng-switch-when
* ng-open  `<details></details>`默认打开状态

# 指令扩展
* ng-init 初始化操作指令  嵌套循环时，定义初始变量
* ng-include 引入模板
* ng-model
 * ng-model-options updateOn
* ng-controller
 * as 将构造函数实例化对象
 
 # 标签指令
 angular对一些原有html标签进行了扩展
* a 标签 阻止默认行为
* select  配合 ng-options、ng-model 指令填写下拉项 
 * ng-options  for in

# 表单验证
* $valid 
* $invalid
* $pristine 原始值没修改过，true 
* $dirty 修改过，true
* $error

* type
 * email
 * number
 * url
* required 为空 true 


注意点：表单元素以 name的方式进行查找，且要写ng-model

# 服务
* $scope
  * $watch
  * $apply
* $rootScope
* $timeout
* $interval
  * $interval.cancel()  清除定时器
* $filter
* $http
  * method
  * url
  * success
  * error