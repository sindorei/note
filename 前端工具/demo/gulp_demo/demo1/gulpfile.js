var gulp = require('gulp');

/**
* css 插件
*/

var less = require('gulp-less'); // less 编译
var cssclean = require('gulp-clean-css'); // css压缩清理
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer'); // 自动前缀
var csscomb = require('gulp-csscomb'); // css排序
var csslint = require('gulp-csslint');

/**
* js 插件
*/

var uglify = require('gulp-uglify'); // js 压缩混淆

/**
* 图片 插件
*/
var imageisux = require('gulp-imageisux'); // 智图

/**
* 其他插件
*/

var clean = require('gulp-clean');
var copy = require('gulp-copy');
var concat = require('gulp-concat');
var minimist = require('minimist'); // 命令行参数转换插件
var inlinesource = require('gulp-inline-source'); // 把js 和 css 内联的插件
var webserver = require('gulp-webserver');
var replace = require('gulp-replace');


var options = minimist(process.argv.slice(2)); // 读取参数

var config = {
    bulidPath: './dist',
    srcPath: './src',
    port: Math.ceil(Math.random()*(9999-6000)+6000),
    proPort: Math.ceil(Math.random()*(9999-6000)+6000),
    defaultIndex: 'index.html'
}


gulp.task('clean', function() {
    return gulp.src(config.bulidPath + '/', { read: false })
          .pipe(clean({force: true}));
});

gulp.task('image', function(){
    return gulp.src(config.srcPath + '/images/*.+(jpeg|jpg|png)')
          .pipe(imageisux(config.bulidPath + '/images',false));
});

gulp.task('buildcss',function() {
	return gulp.src(config.srcPath +'/less/*.less')
        .pipe(less())
        .pipe(postcss([autoprefixer([
            'Android 2.3',
            'Android >= 4',
            'iOS >= 6',
          //  'Opera >= 12',
            'Safari >= 6',
      //      'Chrome >= 20',
      //      'Firefox >= 24', // Firefox 24 is the latest ESR
      //      'Explorer >= 8',
    ])]))
    //.pipe(csscomb())
        .pipe(cssclean())
        .pipe(gulp.dest(config.bulidPath + '/css'));
});


gulp.task('css',function() {
	return gulp.src(config.srcPath + '/css/*.css')
        .pipe(postcss([autoprefixer]))
        .pipe(cssclean())
        .pipe(gulp.dest( config.bulidPath + '/css' ));
});


gulp.task('inline', function() {
  var options = {
    compress: true,
   // pretty: true
  };

  return gulp.src(config.srcPath + '/html/*.html')
        .pipe(inlinesource(options))
        .pipe(replace(/\.\.\/img/g,'//img1.40017.cn/cn/f/zhuanti/' + new Date().getFullYear()))
        .pipe(gulp.dest(config.bulidPath + '/html'));
});

gulp.task('webserverDev' , function() {
    gulp.src(config.srcPath) // web服务器的根目录
        .pipe(webserver({
            livereload: true, // 自动刷新
            open: 'html', // 浏览器中打开的目录（不包含服务器地址）
            directoryListing: true,
            port: config.port,
            fallback: config.defaultIndex
        }));
});

// gulp.task('webserverPro' , function() {
//     gulp.src(config.buildPath) // web服务器的根目录
//         .pipe(webserver({
//             livereload: true, // 自动刷新
//             open: 'html', // 浏览器中打开的目录（不包含服务器地址）
//             directoryListing: true,
//             port: config.proPort,
//             fallback: config.defaultIndex
//         }));
// });

// gulp.task('default', ['clean'], function() {
//     gulp.start('buildcss');
// });

//开发阶段直接运行 gulp
gulp.task('default', function() {
    gulp.start('webserverDev');
});

//开发完成后运行 gulp build
gulp.task('build' , ['inline'] , function() {
   // gulp.start('webserverPro');
});