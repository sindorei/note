/**
 * angular 和 uirouter 都在页面中用script方式引入了文件
 *
 */
import angular from 'angular'
let app = angular.module('app', ['ui.router'])
let ngModule = angular.module('app', ['ui.router'])

import filter from './filter/filter'
import directive from './directive/aLink.js'
import service from './services/API.js'
import page2 from './views/page2'
import router from './router/route'

filter(ngModule)
directive(ngModule)
service(ngModule)
page2(ngModule)
router(ngModule, angular)

app.run([
    '$rootScope',
    '$stateParams',
    '$location',
    'statusCode',
    '$sce',
    function ($rootScope) {
      $rootScope.jump = function(){
			  console.log("rootScope点我了");
		  }
    }
])




