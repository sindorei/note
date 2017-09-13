var gulp = require('gulp'),
    yargs = require('yargs'),
    plugins = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'imagemin-pngquant', 'browser-sync'],
        replaceString: /\bgulp[\-.]/,
        lazy: true,
        camelize: true
    }),
    isRelease = yargs.argv.r || 0,
    watchTasks = [],
    releaseTasks = [],
    option = {
        buildFilePath: "build/profile",
        buildZipPath: "build/zip",
        pkgName: "tourguide",
        // serverprefix: "http://61.155.197.220:5013/hc/1"
        serverprefix: "http://appnew.ly.com/hc/1"
    },
    taskHandler = {
        //构建目录清理
        clean: function (settings) {
            return gulp.src(settings.src)
                .pipe(plugins.clean({
                    read: false,
                    force: true
                }))
        },
        //图片压缩
        imgmin: function (settings) {
            return gulp.src(settings.src)
                .pipe(plugins.if(!!settings.compress, plugins.cache(plugins.imagemin({
                    optimizationLevel: 3, //类型：Number  默认：3  取值范围：0-7（优化等级）
                    progressive: true,//类型：Boolean 默认：false 无损压缩jpg图片
                    interlaced: true,//类型：Boolean 默认：false 隔行扫描gif进行渲染
                    multipass: true,//类型：Boolean 默认：false 多次优化svg直到完全优化
                    svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
                    use: [plugins.imageminPngquant()]//可以压缩70% //使用pngquant深度压缩png图片的imagemin插件
                }))))
                .pipe(gulp.dest(settings.dest))
        },
        //js压缩
        jsmin: function (settings) {
            return gulp.src(settings.src)
                .pipe(plugins.if(isRelease, plugins.uglify()))
                .pipe(setServerPrefix())
                .pipe(gulp.dest(settings.dest))
        },
        //入口文件里的变量替换和压缩
        processhtml: function (settings) {
            return gulp.src(settings.src)
                .pipe(setServerPrefix())
                .pipe(plugins.replace(/_VERSION_/gi, getReplacedStr()))
                .pipe(plugins.processhtml())
                .pipe(plugins.if(isRelease, plugins.htmlmin({
                    collapseWhitespace: true
                })))
                .pipe(gulp.dest(settings.dest))
        },
        //css压缩
        cssmin: function (settings) {
            return gulp.src(settings.src)
                .pipe(setServerPrefix())
                .pipe(plugins.if(isRelease, plugins.minifyCss()))
                .pipe(gulp.dest(settings.dest))
        },
        //html压缩
        htmlmin: function (settings) {
            return gulp.src(settings.src)
                .pipe(setServerPrefix())
                .pipe(plugins.if(isRelease, plugins.htmlmin({
                    collapseWhitespace: true
                })))
                .pipe(gulp.dest(settings.dest))
        }
    },
    taskConfigs = {
        clean: {
            watch: 0,
            handler: 'clean',
            src: [option.buildFilePath]
        },
        imgmin: {
            watch: 1,
            handler: 'imgmin',
            src: ["img/*"],
            dest: option.buildFilePath + "/img/",
            compress: 1
        },
        jsmin: {
            watch: 1,
            handler: 'jsmin',
            src: ["js/**/*.js"],
            dest: option.buildFilePath + "/js/"
        },
        processhtml: {
            watch: 1,
            handler: 'processhtml',
            src: ['main.html'],
            dest: option.buildFilePath + "/"
        },
        cssmin: {
            watch: 1,
            handler: 'cssmin',
            src: ["style/*.css"],
            dest: option.buildFilePath + "/style/"
        },
        htmlmin: {
            watch: 1,
            handler: 'htmlmin',
            src: ['views/*.html'],
            dest: option.buildFilePath + "/views/"
        }
    };


function setServerPrefix() {
    return plugins.replace(/_SERVERPREFIX_/gi, option.serverprefix)
}


function getReplacedStr() {//生成替代字符串
    var time = new Date(),
        year = time.getFullYear(),
        month = time.getMonth() + 1 < 10 ? "0" + (time.getMonth() + 1) : time.getMonth() + 1,
        day = time.getDate() < 10 ? "0" + time.getDate() : time.getDate(),
        hour = time.getHours() < 10 ? "0" + time.getHours() : time.getHours(),
        minute = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes(),
        second = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
    return year + month + day + hour + minute + second;
};

gulp.task('server', function () {
    //静态服务器
    plugins.browserSync({
        server: {
            baseDir: option.buildFilePath,
            index: "main.html"
        },
        open: "external",
        logConnections: true
        //directory: true
    });
})

//生成压缩包
gulp.task('zip', function () {
    return gulp.src(option.buildFilePath + '/**/**/*')
        .pipe(plugins.zip(option.pkgName + getReplacedStr() + '.zip'))
        .pipe(gulp.dest(option.buildZipPath))
})

// 注册任务
for (var taskName in taskConfigs) {
    (function (settings) {
        gulp.task(taskName, function () {
            return taskHandler[settings.handler](settings);
        });

        if (settings.watch) {
            watchTasks.push(taskName);
        }

        releaseTasks.push(taskName);

    })(taskConfigs[taskName]);
}

// watch dev
gulp.task('watch', function () {
    var i, taskName;

    // 实时监听执行的任务
    for (i in watchTasks) {
        taskName = watchTasks[i];
        var wathcer = gulp.watch(taskConfigs[taskName].src, [taskName]);
        wathcer.on('change', function (path) {
            console.log(path)
            plugins.browserSync.reload();
        })
    }
});

//用于图片缓存清除
gulp.task('clearCache', function () {
    return plugins.cache.clearAll();
})

if (isRelease) {// release
    gulp.task('default', plugins.sequence(['clean'], ['imgmin'], ['jsmin'], ['cssmin'], ['processhtml'], ["htmlmin"], ['zip']));
}
else {// development
    gulp.task('default', watchTasks.concat(['watch', 'server']));
}