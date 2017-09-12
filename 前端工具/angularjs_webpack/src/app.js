
var angular = require('angular')
require('@uirouter/angularjs')
var app = angular.module('app', ['ui.router'])

// require('./directive/aLink.js')
// require('./services/API.js')
// require('./filter/filter.js')

require('oclazyload')

var ngModule = angular.module('app', ['ui.router', 'oc.lazyLoad'])

require('./views/page2')(ngModule)
require('./router/route')(ngModule, angular)

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




