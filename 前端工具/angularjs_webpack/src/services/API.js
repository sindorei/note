export default ngModule => {
  ngModule.factory("API", ["APIAddress", function (APIAddress) {
    function API() {
      var root = {
        online: 'http://tcmobileapi.17usoft.com/',
        test: 'http://tcmobileapi3.t.17usoft.com/'
      };

      var url = root.fake;


      if (APIAddress.on == 0) {
        url = root.test;
      } else if (APIAddress.on == 1) {
        url = root.online;
      }

      return url;
    }

    return API();
  }])
}

