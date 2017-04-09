var server = require('./server')
var app = server()

app.use('/user', function (req, res) {
    res.end('123')
})

app.listen(8010, () => {
    console.log('start...')
})