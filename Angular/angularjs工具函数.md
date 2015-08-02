### angular.forEach()
 * 第一个参数，要遍历的数组或对象
 * 第二个参数，回调函数。回调函数第一个参数为值，第二个参数为键名
 * 第三个参数，操作的对象。回调函数中的this就指向该对象
 ```javascript
        var arr = ['apple','banana','orange'];
        var newArr = [];
        angular.forEach(arr,function(vaule,i){
            if(i == 2)
            {
                this.push(vaule);
            }
        },newArr)
        console.log(newArr); //输出orange
```