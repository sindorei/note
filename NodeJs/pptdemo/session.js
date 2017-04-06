var http = require('http')
var url = require('url')
var app = http.createServer((req, res) => {
    res.setHeader('Set-Cookie', setCookie('xixiha', 'yes'))
    res.end('Hello Cookie')
    
})

// Set-Cookie: name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com

app.listen(8010, () => {
    console.log('start...')
})

var session = {}

var key = 'session_id'

var Expires = 30 * 60 * 1000


var genSession =  function () {
    let session = {}
    session.id = new Date().getTime() + Math.random()
    session.cookie = {
        expire: new Date().getTime() + Expires
    }

    sessions[session.id] = session
    return session
}