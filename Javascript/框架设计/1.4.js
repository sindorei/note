// 类型判断
// typeof 只能粗略判断string number boolean function undefined object
// ie下typeof 还会返回unknown的情况

// 判断undefined ,可以与 void(0)比较
// null 与 null比较
// string 、number、boolean、function 用typeof，满足90%
// Object.prototye.toString() [object Array]
// 判断window，ie678，可以 window == document true, document==window false


function isNaN (obj) {
    return obj !== obj;
}

