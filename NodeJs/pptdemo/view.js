var server = require('./server3')
var app = server()

app.use('/user', function (req, res) {
    res.render({user: {name: '小明', age: 20}})
})

app.listen(8010, () => {
    console.log('start...')
})