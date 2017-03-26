var http = require('http')
var app = http.createServer((req, res) => {
    
    res.writeHead(200, {
        'Content-Type':'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
    })
    setInterval(() => {
        res.write('data:' + Math.random() + '\n\n')
    }, 1000)
})


app.listen(8001, () => {
    console.log('starting...')
})