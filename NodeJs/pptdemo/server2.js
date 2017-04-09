var http = require('http')
var url = require('url')

var routes = []
var handle = function (req, res, stack) {
    var next = function () {
        var middleware = stack.shift()
        if(middleware) {
            middleware(req, res, next)
        }
    }
    next()
}
var server = http.createServer((req, res) => {
    var pathname = url.parse(req.url).pathname
    for(let i = 0; i< routes.length; i++) {
        let route = routes[i]
        if(pathname === route.path) {
            handle(req, res, route.stack)
        }
    }
});

module.exports = function () {
    server.use = function (path) {
        if(typeof path === 'string') {
            routes.push({
                path: path,
                stack: [].slice.call(arguments, 1)
            })
        } else {
                routes.push({
                path: path,
                stack: [].slice.call(arguments, 0)
            })
        }
    }
    return server;
}

