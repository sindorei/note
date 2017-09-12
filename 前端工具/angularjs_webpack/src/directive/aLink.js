var angular = require('angular')
angular.module('app').directive('aLink',function(){
	return {
        restrict : "EACM",
        template : "<h1>自定义指令!</h1>",
        replace:true
    };
})
// restrict 值可以是以下几种:
// E 作为元素名使用
// A 作为属性使用
// C 作为类名使用
// M 作为注释使用