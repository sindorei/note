/*
* a 个数中选出b个
* 返回有多少种排列组合
*/
function m(a,b) {
    return f(a)/f(a-b);
}

function f(m) {
    if(m < 1)
    {
        return 1;
    }
    return m*f(m-1);
}
//
// console.log(m(4,3));
// console.log(m(4,2));
// console.log(m(4,4));


var aSelect = ['a','b','c','d'];
/*
*数组中选出指定的个数，返回有多少总排列组合
*/
function show(arr , num) {
    var resNum = 0,
        iNow = 1,
        resArr = [];
    if(num == 1) {
        return arr;
    }

    function change(arr , iNow ,str) {
        for (var i = 0; i < arr.length; i++) {
            var result = arr.concat();
            var str2 = str;
            str2 += result.splice(i,1);
            if(iNow == num) {
                resNum += result.length;
                for (var j = 0; j < result.length; j++) {
                    resArr.push(str2 + result[j]);
                }
            } else {
                change(result , iNow + 1 , str2);
            }

        }
    }
    change(arr, iNow + 1 , '');
    resArr = combine(resArr);
    resArr.push(resArr.length);
    return resArr;
}

function combine(arr) {
    var obj = {};
    var resArr = [];
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].split('').sort().join('');
    }

    for (var i = 0; i < arr.length; i++) {
        if(!obj[arr[i]]) {
            resArr.push(arr[i]);
            obj[arr[i]] = 1;
        }
    }

    return resArr;
}
