var http = require('http');
var url = require('url');
http.createServer(function(request,response){
    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
    response.write(JSON.stringify(url.parse(request.url,true).query));
    response.end()
}).listen(8080);