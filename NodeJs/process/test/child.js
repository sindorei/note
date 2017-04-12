function fibo(n) {
    return n > 1 ? fibo(n - 1) + fibo(n - 2) : 1
}

process.on('message', function(data) {
    if (typeof data === 'object' && data.type === 'fibo') {
        process.send({ type: 'fibo', result: fibo(data.num) })
    }
})