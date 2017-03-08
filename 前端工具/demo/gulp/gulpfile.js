const gulp = require('gulp')

// 默认任务
gulp.task('default', () => {
    console.log('运行啦~~')
})

// 自定义的任务
gulp.task('hello', () => {
    console.log('hello world')
})

// node-glob : https://github.com/isaacs/node-glob
var test = gulp.src('./*.json')

console.log(typeof test)