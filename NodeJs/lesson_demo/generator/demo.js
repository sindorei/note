function* test () {
    yield 1
    var a = yield 2
    console.log('a的值是：' + a)
    return 4
}

var gen = test()

console.log(gen.next())
console.log(gen.next())
console.log(gen.next('hahaha'))
console.log(gen.next())