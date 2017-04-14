var cp = require('child_process')

cp.spawn('node', ['worker.js'])

cp.exec('node worker.js', (err, stdout, stderr) => {

    })
    //cp.execFile('./worker.js')

cp.fork('./worker.js')