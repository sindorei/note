const { AsyncSeriesHook } = require('../lib/index')

const hook = new AsyncSeriesHook(['name'])

hook.tap('go',(n, cb) => {
  console.log(n + " go")
//   cb()
})

hook.tapAsync('rust',(n, cb) => {
    setTimeout(() => {
         console.log(n + " rust")
         cb()
    }, 1000)
 })

hook.tap('swift',(n, cb) => {
  console.log(n + " swift")
})


// hook.callAsync('lang', err => {
//     console.log('err: %o', err)
// })
hook.promise('张三').then(res => {
  console.log('result: %o', res)
}).catch(err => console.log('err: %o', err))


