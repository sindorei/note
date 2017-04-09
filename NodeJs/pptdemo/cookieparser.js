var cookie = function (req, res, next) {
    var cookie = req.headers.cookie
    var cookies = {}
    if(cookie) {
        var list = cookie.split('; ')
        for(var i = 0; i<list.length; i++) {
            var pair = list[i].split('=');
            cookies[pair[0]] = pair[1]
        }
    }
    req.cookies = cookies
    next()
}

var server = require('./server2')
var app = server()

app.use('/user', cookie, function (req, res) {
    res.end(JSON.stringify(req.cookies))
})

app.listen(8010, () => {
    console.log('start...')
})