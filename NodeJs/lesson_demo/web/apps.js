'use strict'
const http = require('http')
let querystring = require('querystring')
let url = require('url')

http.createServer(function(req, res) {
    //console.log(req.header)
    //console.log(req.url)

    console.log(querystring.parse(req.url))
    //console.log(url.parse(req.url, true))
    res.writeHead(200, {'Content-Type': 'text/plain' })
    res.end('Hello World!')
}).listen(8089)

console.log('start ...')