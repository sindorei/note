function mySlice(nodes , start , end) {
    var ret = [],
        n = nodes.length;
    start = parseInt(start , 10) || 0;
    end = end ? parseInt(end , 10) : n;
    if(start < 0) {
        start += n;
    }

    if(end < 0) {
        end += n;
    }

    if(end > n) {
        end = n;
    }
    for(var i = start; i < end ; i++)
    {
        ret[i-start] = nodes[i];
    }

    return ret;

}

var test = ['大家好','hello world' , '我来了' , '该吃饭了'];
console.log(mySlice(test));
console.log(mySlice(test,0));
console.log(mySlice(test,1,3));
console.log(mySlice(test,2,4));
console.log(mySlice(test,-3,-1));
