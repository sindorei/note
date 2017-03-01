'use strict'

const net = require('net')

let server = net.createServer()

server.on('connection', (socket) => {
    socket.on('data', (data) => {
        socket.write('hello sindorei!')
    })

    socket.on('end', () => {
        console.log('连接断开...')
    })

    //socket.write('welcome!')
})


server.listen(8124, () => {
    console.log('hi')
})
