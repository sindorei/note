const http = require('http');

function fibo(n) {
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1
}

var app = http.createServer((req, res) => {
    res.end(fibo(35).toString())
})

app.listen(8010, () => {
    console.log('start...')
})