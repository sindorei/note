const { AsyncSeriesBailHook } = require('../lib/index')

const hook = new AsyncSeriesBailHook(['name'])

hook.tap('go',(n, cb) => {
  console.log(n + " go")
//   cb()
})

hook.tapAsync('rust',(n, cb) => {
    setTimeout(() => {
         console.log(n + " rust")
         cb(null, 1)
        //  return cb('rust')
    }, 1000)
 })

hook.tapPromise('swift',n => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(n + " swift")
            resolve(n + " swift")
        }, 10)
    })
})


// hook.callAsync('lang', (err, result) => {
//     console.log('err: %o, result: %o', err, result)
// })

hook.promise('张三').then( res => {
    console.log('promise resolve: %o', res)
}).catch(err => console.log('error: %o', err))

