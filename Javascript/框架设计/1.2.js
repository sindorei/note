function extend(dest, source) {
    for(var property in source) {
        dest[property] = source[property]
    }

    return dest
}

 var a = {name: '小米', age: 21 }
 var b = { height: 178 }

// var c = extend(a, b)
//console.log(c)


function keys(obj) {
    var a = [];
    for(a[a.length] in obj);
    return a;
}
//console.log(keys(a))


function mix(target, source) {
    var args = [].slice.call(arguments),
        i = 1,
        key,
        ride = typeof args[args.length - 1] === 'boolean' ? args.pop() : true

    if(args.length === 1) {
        target = !this.window ? this : {}
        i = 0
    }

    while((source = args[i++])) {
        for(key in source) {
            if(ride || !(key in target)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

console.log(mix(a, b))
console.log(mix({}))
