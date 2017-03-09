const gulp = require('gulp');

gulp.task('default',['hello', 'world'] ,function () {
	console.log('默认任务执行~\(≧▽≦)/~啦啦啦！')
})


gulp.task('hello', function () {
	console.log('这个是hello任务！！！')
})

gulp.task('world', function () {
	console.log('这个是world任务！！！')
})

