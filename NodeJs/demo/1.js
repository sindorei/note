var http = require('http');
//var url = require('url');
//http.createServer(function(request,response){
//    response.writeHead(200,{"Content-Type":"text/plain;charset=utf-8"});
//    var oQuery = url.parse(request.url,true).query;
//    var name = oQuery.name ? oQuery.name : '';
//    response.write(JSON.stringify({name:name,age:22}));
//    response.end()
//}).listen(8080);
http.get('http://www.baidu.com',function(res) {
    var html = '';
    res.on('data',function(data) {
        html += data;
    })
    res.on('end',function() {
        console.log(html);
    })
})