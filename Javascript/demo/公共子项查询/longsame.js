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

console.log(findMoreSame(data));
