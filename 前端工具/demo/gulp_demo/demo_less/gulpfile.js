const gulp = require('gulp')

let less = require('gulp-less')

let cssclean = require('gulp-clean-css')


// less 编译
gulp.task('less', function () {
    gulp.src('./src/less/*.less')
    .pipe(less())
    //.pipe(cssclean())
    .pipe(gulp.dest('./dist/css'))
})