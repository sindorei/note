var http = require('http')
var fork = require('child_process').fork

var app = http.createServer((req, res) => {
    var worker = fork('./child.js')
    worker.on('message', function(data) {
        if (typeof data === 'object' && data.type === 'fibo') {
            worker.kill()
            res.end(data.result.toString())
        }
    })

    worker.send({ type: 'fibo', num: 35 })
})


app.listen(8010, () => {
    console.log('start...')
})