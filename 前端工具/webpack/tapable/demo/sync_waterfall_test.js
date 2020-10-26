const { SyncWaterfallHook } = require('../lib/index')

const hook = new SyncWaterfallHook(['name'])

hook.tap('go',n => {
  console.log(n + " go")
  return n + " go"
})
hook.tap('swift',n => {
  console.log(n + " swift")
  return n + " swift"
})
hook.tap('rust',n => {
  console.log(n + " rust")
})

hook.call('lang:')