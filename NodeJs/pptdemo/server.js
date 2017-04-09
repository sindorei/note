var http = require('http')
var url = require('url')



var routes = []
var server = http.createServer((req, res) => {
    var pathname = url.parse(req.url).pathname
    for(let i = 0; i< routes.length; i++) {
        let route = routes[i]
        if(pathname === route[0]) {
            let action = route[1]
            action(req,res)
        }
    }
});


module.exports = function () {
    server.use = function (path, action) {
        routes.push([path, action])
    }
    return server;
}