let cp = require('child_process')
let process = cp.fork('./sub.js')

process.on('message', (data) => {
    console.log('message from sub.js: ' + data)
})

process.send('hello')