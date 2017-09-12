var angular = require('angular')
angular.module('app').filter("change", function() {
    function intParser(val) {
		if(val){
			return val.replace(/1/g, '替换');
		}
		
    }

    return intParser;
})