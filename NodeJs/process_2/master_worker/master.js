var fork = require('child_process').fork

var cpuNum = require('os').cpus().length

for (let i = 0; i < cpuNum; i++) {
    fork('./worker.js')
}