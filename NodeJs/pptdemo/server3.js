var http = require('http')
var url = require('url')
var _ = require('./underscore')
var fs = require('fs')



var routes = []

var server = http.createServer((req, res) => {
    var pathname = url.parse(req.url).pathname
    res.render = function (data) {
        res.setHeader('Content-Type', 'text/html')
        res.writeHead(200)
        
        var view = fs.readFileSync('./view.html')
        
        var html = _.template(view.toString())(data)
        res.end(html)
    }
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