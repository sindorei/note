const gulp = require('gulp')

let through = require('through2')

var test = function () {
	return through.obj(function (file) {
		var buffer = new Buffer('哈哈')
		
		file.contents = Buffer.concat([file.contents, buffer])

		this.push(file)
	})
}
gulp.task('default', function () {
	//gulp.src('test.txt').pipe(test()).pipe(gulp.dest('./dist'))
	console.log(gulp.src('test.txt'))
})
