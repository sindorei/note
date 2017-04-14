var cp = require('child_process')
var server = require('net').createServer()
var cpuNum = require('os').cpus().length
var child = []

for (let i = 0; i < cpuNum; i++) {
    child.push(cp.fork('./child.js'))
    console.log(i)
}

server.listen(8010, () => {
    for (let i = 0; i < child.length; i++) {
        child[i].send('server', server)
    }
    server.close()
})