module.exports = function (ngModule) {
  ngModule.controller("page1Ctrl", [
    "$rootScope",
    "$scope",
    '$q',
    "$stateParams",
    'API',
    function ($rootScope, $scope, $q, $stateParams,API) {
      console.log($rootScope);
      console.log($scope);
      console.log($q);
      console.log($stateParams);
      console.log(API)


      $scope.show = false;

      $scope.jump = function(){
        console.log("scope点我了");
        console.log(location.href.split("#")[0] + '#/page2/');

        location.href = location.href.split("#")[0] + '#/page2/';
      }

      window._tc_bridge_bar.set_navbar({
        param:{
          left:[{tagname:"tag_click_back"}],
          center:[{tagname: "tag_click_title",value: "深夜惠•苏州"}],
          right:[{tagname: "tag_click_share",value: "分享",icon:"i_share"}]
        },
        CBPluginName:'custom',
        CBTagName:'customFn'
      })

      window._tc_bridge_bar.set_navbar({
        param:{
          left:[{tagname:"tag_click_back"}],
          center:[{tagname: "tag_click_title",value: "深夜惠•苏州"}],
          right:[{tagname: "tag_click_share",value: "分享",icon:"i_share"}]
        },
        CBPluginName:'custom',
        CBTagName:'customFn1'
      })



      //回调
      window.custom = {
        customFn:function (data) {
          console.log("回调");

        },
        customFn1:function (data) {
          console.log("回调");

        }
      }
    }
  ]);

}