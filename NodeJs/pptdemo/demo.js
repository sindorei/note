var http = require('http')
var url = require('url')
var app = http.createServer((req, res) => {
    req.cookie = parseCookie(req.headers.cookie)
    res.end(JSON.stringify(req.cookie, null, 4))
    //res.end(JSON.stringify(url.parse(req.url,true), null, 4))
})


app.listen(8010, () => {
    console.log('start...')
})


function parseCookie(cookie) {
    let cookies = {};
    if(!cookie) {
        return cookies
    }
    let list = cookie.split('; ')
    for(let i = 0, len = list.length; i < len; i++) {
        let pairs = list[i].split('=')
        cookies[pairs[0]] = pairs[1]
    }

    return cookies
}