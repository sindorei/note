var server = require('./server')
var app = server()

var hasBody = function(req) {
    return 'transfer-encoding' in req.headers || 'content-length' in req.headers
}

app.use('/user', function(req, res) {

    if (hasBody(req)) {
        let buffer = []
        req.on('data', (chunk) => {
            buffer.push(chunk)
        })
        req.on('end', () => {
            req.rawBody = Buffer.concat(buffer).toString()
            res.end(req.rawBody)
        })
    }
})

app.use('/news', function(req, res) {
    for (let i = 0; i < 100; i++) {
        console.log(i)
    }
    res.end('hehe')
})

app.listen(8010, () => {
    console.log('start...')
})