var http = require('http')
var tagg = require('threads_a_gogo')

function fibo(n) {
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1
}

var app = http.createServer((req, res) => {
    tagg.create().eval(fibo).eval('fibo(35)', (err, result) => {
        if (err) throw err;
        res.end(result)
    })
})

app.listen(8010, () => {
    console.log('start...')
})