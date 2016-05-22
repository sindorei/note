/**
* 最长公共子串查询
* 找出最长的子串，如果有相同长度的,返回最后一个满足的 (最长的为1返回的是第一个)
*/

//两组数据
var data = ['abefe','ebf'];

function findMoreSame(arr) {
    var str1 = arr[0],
        str2 = arr[1],
        count = 0,
        index = 0;
    for (var i = 0; i < str1.length; i++) {
        for (var j = 0; j < str2.length; j++) {
            if(str1.charAt(i) == str2.charAt(j)) {
                var k = 1;
                while ( str1.charAt(i + k) != '' && str1.charAt(i + k) == str2.charAt(j + k)) {
                    k++;

                    if( k > count) {
                        count = k;
                        index = i;
                    }

                }
                //如果最长为1个算的话，要有这段
                if(count == 0) {
                    count = k;
                    index = i;
                }

            }
        }
    }

    return str1.substr(index , count);
}

//console.log(findMoreSame(data));

// 多组数据
var data2 = ['codeischeap' , 'showyourcode' , 'yourcodeischeap'];

//将数组按字符长度排序，取最短的，以便节省比较次数
sortData(data2);
console.log(findSame(data2));

function findSame(arr) {
    var first = arr[0];
    var newArr = [];
    var count = 0;
    var result = '';

    //将最短的数组成员中的字符组合都列出来
    for (var i = 0; i < first.length; i++) {
        for (var j = i + 1; j <= first.length; j++) {
            newArr.push(first.substring(i,j));
        }
    }

    //遍历所有的字符组合
    for (var i = 0; i < newArr.length; i++) {
        var wholeArr = [];
        var reg = new RegExp(newArr[i]); // 用字符组合的元素申明一个正则

        //遍历原数据数组，将正则匹配到的字符串添加到一个数组中
        for (var j = 0; j < arr.length; j++) {
            var resArr = arr[j].match(reg);
            if(resArr) {
                wholeArr = wholeArr.concat(resArr);
            }
        }

        //如果匹配到的字符组成的数组长度为原数组长度，说明此字符串原数组元素中都含有
        if(wholeArr.length == arr.length) {
            //取长度大的
            if(wholeArr[0].length > count) {
                count = wholeArr[0].length;
                result = wholeArr[0];
            }
        }

    }

    return result;
}

function sortData(arr) {
    arr.sort(function(str1 , str2) {
        return str1.length - str2.length;
    })
}
