var http = require('http')
var url = require('url')

var app = http.createServer((req, res) => {
    res.end('Hello World!')
})

var port = Math.round((Math.random() + 1) * 1000)

app.listen(port, () => {
    console.log('start...' + port)
})