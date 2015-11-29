//var name = '';
//var age = '';
//process.stdout.write("请输入姓名：");
//process.stdin.resume();
//process.stdin.on('data',function(content) {
//    if(!name)
//    {
//        name = content;
//        process.stdout.write("请输入年龄：");
//    }
//    else
//    {
//        age = content;
//        process.stdout.write("你好"+name);
//    }
//})

var fs = require('fs');
fs.readFile('1.txt',function(err , data){
    console.log(data.toString());
})