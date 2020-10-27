const { SyncHook } = require('../lib/index')

const hook = new SyncHook(['name'])

hook.tap('go',n => {
  console.log(n + " go")
})
hook.tap({
  name: 'swift',
}, n => {
  console.log(n + " swift")
})
hook.tap('rust',n => {
  console.log(n + " rust")
})
hook.intercept({
  context: true,
  call(n) {
    console.log('call...: %s', n)
  },
  tap(context, t) {
    console.log('tap...: %o', t)
  },
  register(t) {
    console.log('register...: %o', t)
    return t
  }
})

// hook.call('李四')
hook.call('张三')