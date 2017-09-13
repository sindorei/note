
export default ngModule => {
  ngModule.config([
      '$stateProvider',
      "$urlRouterProvider",
      '$controllerProvider',
      function ($stateProvider, $urlRouterProvider, $controllerProvider) {
        $urlRouterProvider.otherwise("/page1/226");
        $stateProvider
          .state({
            name: 'page1',
            url: '/page1/:cityId',
            templateProvider: ['$q', function ($q) {
              var deferred = $q.defer()
              require.ensure([], function () {
                var template = require('../views/page1/page1.html')
                deferred.resolve(template)
              });
              return deferred.promise
            }],
            controller: 'page1Ctrl',
            resolve: {
              foo: ['$q', function ($q) {
                console.log($controllerProvider)
                var deferred = $q.defer()
                import('../views/page1').then((data) => {
                  $controllerProvider.register('page1Ctrl', data.default)
                  deferred.resolve()
                })

                return deferred.promise
              }]
            }
          })
          .state('page2', { //page2
            url: "/page2/",
            template: require('../views/page2/page2.html'),
            controller: 'page2Ctrl',
            onEnter: function () {
              console.log('page2进入');

            },
            onExit: function () {
              console.log('page2退出');
            }
          })
      }
    ])
    .value('APIAddress', {
      /*
       * 0:测试地址,
       * 1:正式地址,
       * 2或其它值:fake地址
       * */
      on: 0
    }).value("statusCode", {
    NETWORKNOTON: 77,
    NETWORKERROR: 55,
    SERVERCRASH: 88
  })
}