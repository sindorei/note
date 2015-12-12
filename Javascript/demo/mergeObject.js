/**
* 合并对象
* @param targget 目标对象
* @param source 数据源对象
*/
function mix(target,source) {
    var args = Array.prototype.slice.call(arguments),
        i = 1,
        k,
        isCover = typeof (args[args.length - 1]) === 'boolean' ? args.pop() : true; // 根据最后的bool值参数判断是否覆盖同名属性，默认为true覆盖

        if(args.length === 1)
        {
            target = !this.window ? this : {};
            i = 0;
        }

        while( source = args[i++] )
        {
            for(key in source)
            {
                if(isCover || !(key in target))
                {
                    target[key] = source[key];
                }
            }
        }

        return target;
}

var o1 = { name:'小明',age:12 };
var o2 = { hobby:'睡觉',age:24 };
var o3 = { weight:60  };
var newObj = mix(o1,o2,o3);
//var new2 = mix(o1,o2,o3);
//console.log(newObj);
console.log(newObj);
