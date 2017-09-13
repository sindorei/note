export default ngModule => {
  ngModule.controller("page2Ctrl", [
    "$rootScope",
    "$scope",
    '$q',
    "$stateParams",
    function ($rootScope, $scope, $q, $stateParams) {
      console.log($rootScope);
      console.log($scope);
      console.log($q);
      console.log('123');
    }
  ])
}