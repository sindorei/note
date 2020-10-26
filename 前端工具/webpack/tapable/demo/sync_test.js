const { SyncHook } = require('../lib/index')

const hook = new SyncHook(['name'])

hook.tap('go',n => {
  console.log(n + " go")
})
hook.tap('swift',n => {
  console.log(n + " swift")
})
hook.tap('rust',n => {
  console.log(n + " rust")
})

hook.call('张三')