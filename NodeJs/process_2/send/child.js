var http = require('http')

var app = http.createServer((req, res) => {
    res.end('child pid: ' + process.pid)
})

process.on('message', (msg, tcp) => {
    if (msg === 'server') {
        tcp.on('connection', (socket) => {
            app.emit('connection', socket)
        })
    }
})