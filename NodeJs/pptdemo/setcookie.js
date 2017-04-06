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


function setCookie(name, val, option) {
    let pairs = []
    option = option || {}

    pairs.push(name + '=' + encodeURIComponent(val))

    if(option.maxAge) {
        pairs.push('Max-Age=' + option.maxAge)
    }
    if(option.domain) {
        pairs.push('Domain=' + option.domain)
    }
    if(option.path) {
        pairs.push('Path=' + option.path)
    }
    if(option.expires) {
        pairs.push('Expires=' + option.expires.toUTCString())

    }

    if(option.httpOnly) {
        pairs.push('HttpOnly')
    }

    if(option.secure) {
        pairs.push('Secure')
    }

    return pairs.join('; ')
}