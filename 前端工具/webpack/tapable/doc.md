# tapable
- [github地址](https://github.com/webpack/tapable)


# 用法
- 所有的Hook构造函数都采用一个可选参数，该参数是字符串形式的参数名称的列表。
- 根据Hook Type不同它们的实例有`tap`、`tapAsync`、`tapPromise`、`intercept`、`call`、`callAsync`、`promise`等方法

```javascript
const { SyncHook } = require('tapable')

const syncHookTest = new SyncHook(['name'])

syncHookTest.tap('go',n => {
  console.log(n + " go")
})
syncHookTest.tap('swift',n => {
  console.log(n + " swift")
})

syncHookTest.call('张三')
```

# 钩子类型（Hook Types）

## 按被注册插件的执行逻辑来分类

- Basic hook
  * 名字中没有“Waterfall”, “Bail” 或 “Loop” 的Hook，触发时按照注册的插件顺序执行
  * 如`SyncHook`、`AsyncParallelHook`、`AsyncSeriesHook`
- Waterfall
  * 触发时按照注册的插件顺序执行， 且前一个插件的返回值，是后一个插件的入参
  * 如`SyncWaterfallHook`，`AsyncSeriesWaterfallHook`
- Bail
  * 触发时按照注册的插件顺序执行，当某个插件返回非`undefined`的值时，就不继续执行后续的插件
  * 如：`SyncBailHook`，`AsyncSeriesBailHook`
- Loop
  * 循环调用插件，直到所有的插件的返回值都是`undefined`。当某个插件返回非`undefined`时，从第一个开始重新调用。
  * 如`SyncLoopHook`


## 按是否异步区分
- Sync
  * 以`Sync`开头的
  * 只能通过`tap(）`方法注册同步插件
  * `call: (...args) => Result`方法触发
- Async
    -  可以通过`tap()`方法注册同步插件, `tapAsync(name: string | Tap, fn: (context?, ...args, callback: (err, result: Result) => void) => void) => void`注册callback-based的插件 以及`tapPromise()`注册promise-based 的插件(插件返回`Promise`)。
    - 通过`callAsync: (...args, callback: (err, Result) => void) => void`方法触发，或者 `promise: (...args) => Promise<Result>` 触发
    - AsyncSeries
        * `AsyncSeries`开头
        * 各插件按照注册顺序串行执行。会等待异步插件完成后再执行下一个。`tapAsync`注册的某个插件调用`callback`的第一个参数为[Truthy](https://developer.mozilla.org/zh-CN/docs/Glossary/Truthy)或promise`reject`则执行结束,不再继续执行后面的插件
        * `AsyncSeriesBailHook` 按顺序某个插件 `callback`第一个参数Falsy第二个参数Truthy或promise`resolve` 则后面插件不再执行，结束
        * 结束后调用`callAsync`的回调或promise的`then`
        * `tapAsync` 别忘记调用回调否则不知道异步是否结束
    - AsyncParallel
        * 使用方式基本跟`AsyncSeries`类似，但是各插件是按注册顺序平行执行，不相互依赖（不会按注册顺序等待上一个异步插件完成后再执行下一个插件），某个插件抛出错误后不会影响下一个插件，所以没有Waterfall、Loop钩子
        * `AsyncParallelBailHook` 都执行完成后，调用通知结束的回调，并按顺序将第一个有返回值（或失败的错误信息）通知到结果（`callAsync`的回调或promise的`then`）

# interception API
  - call:`(...args) => void` 
    * hook被调用时被调用(调`call()`,`callAsync()`,`promise()`时)
  - tap: `(tap: Tap) => void`
    * hook的插件被调用时被调用
    * 参数会拿到`Tap`对象，此对象不能被改变
  - loop: `(...args) => void`
    * loop hook的插件被调用时被调用
  - register: `(tap: Tap) => Tap | undefined `
    * 插件用tap方法注册时被调用，参数中拿到的`Tap`对象可以被修改


# Context
  - 插件和拦截器都可以往里面传一个上下文对象的参数，该对象可用于向后续插件和拦截器传递任意值。

# HookMap

# Hook/HookMap interface

# MultiHook