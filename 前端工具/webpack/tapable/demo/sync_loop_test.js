const { SyncLoopHook } = require('../lib/index')

const hook = new SyncLoopHook(['name'])

hook.tap('go',n => {
  console.log(n + " go")
})
let i = 0
hook.tap('swift',n => {
  console.log(n + " swift, i: " + i)
  if (i < 3) {
    i++
    return i
  }
 
})
hook.tap('rust',n => {
    console.log(n + " rust")
})

hook.call('lang:')