// 安全模式创建的工厂类
const Factory = function(type, content) {
    if (this instanceof Factory) {
        return new this[type](content)
    }
    return new Factory(type, content)
}

// 工厂原型中设置创建所有类型数据对象的基类
Factory.prototype = {
    Java: function(content) {

    },
    Javascript: function(content) {
        
    }
}