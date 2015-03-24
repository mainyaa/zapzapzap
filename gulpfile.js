'use strict';

var gulp    = require('gulp');
var shell   = require('gulp-shell');
var gutil   = require('gulp-util');
var gulpif  = require('gulp-if');
var changed = require('gulp-changed');
var debug   = require('gulp-debug');
var wiredep = require('wiredep').stream;
var sass    = require('gulp-sass');
var jshint  = require('gulp-jshint');
var rename  = require('gulp-rename');
var Promise = require('bluebird');
var rimraf  = Promise.promisify( require('rimraf'));
var cprf    = Promise.promisify( require('cprf'));
var mkdirp  = Promise.promisify( require('mkdirp'));
var colors  = require('colors');
var _       = require('lodash');
var asar    = require('asar');
var runSequence  = require('run-sequence');
var atomdownload = require('gulp-download-atom-shell');

var fs                = require('fs');
var packagejson       = require('./package.json');
var bowerjson         = require('./bower.json');
var bowerdependencies = Object.keys(bowerjson.dependencies);
var nodedependencies  = Object.keys(packagejson.dependencies);
var isBeta            = process.argv.indexOf('--beta') !== -1;
var isVerbose         = process.argv.indexOf('--verbose') !== -1;

var settings;
try {
    settings = require('./settings.json');
} catch (err) {
    settings = {};
}
settings.beta = isBeta;

var options = {
    dev: process.argv.indexOf('release') === -1,
    beta: isBeta,
    src: './src',
    srcBrowser: './src/browser',
    build: './build',
    dist: './dist',
    tmp: './cache',
    e2e: './e2e',
    errorHandler: function(title) {
        return function(err) {
            gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
            this.emit('end');
        };
    },
    appFilename: isBeta ? 'Zapzapzap-Beta.app' : 'Zapzapzap.app',
    appName: isBeta ? 'Zapzapzap-Beta' : 'Zapzapzap',
    name: 'Zapzapzap',
    icon: (isBeta) ? './res/zapzapzap-beta.icns' : './res/zapzapzap.icns',
    bundle: 'com.zapzapzap.zapzapzap'
};
options.flag = isVerbose ? '-rfv' : '-rf';
options.distRelease = './dist/osx/' + options.appFilename + '/Contents/Resources/app';
options.dist = options.dev ? options.build : options.distRelease;
options.distBrowser = options.dist + '/browser';
options.atompath = options.tmp+'/Atom.app/Contents/MacOS/Atom ';
options.launch = options.dev ? options.atompath + options.build+' --debug=5858' : options.atompath + options.distRelease+' --debug=5858';
var dist = options.dist;
var src = options.src;
var srcBrowser = options.srcBrowser;
var distBrowser = options.distBrowser;
gutil.log('launch', options.launch);

if (isVerbose) {
    console.log(options);
}

gulp.task('scripts', function() {
    return gulp.src([
        options.src+'/*.js',
        options.src+'/js/**/*.js',
        options.srcBrowser+'/*.js',
    ], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist));
});

gulp.task('sass', function() {
    return gulp.src(options.src+'/scss/*.scss', {base: options.src})
    .pipe(debug())
    .pipe(sass())
    .pipe(gulp.dest(options.dist));
});

gulp.task('lint', function() {
    return gulp.src([options.src+'*.js', options.src+'/js/**/*.js'], {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('html', function() {
    return gulp.src([
        options.src+'/*.html',
        options.srcBrowser+'/*.html',
    ], {base: options.src})
    .pipe(debug())
    .pipe(wiredep())
    .pipe(gulp.dest(options.dist));
});

gulp.task('watch', function() {
    gulp.watch(options.src+'/**/*.html', ['html']);
    gulp.watch(options.src+'/**/*.js', ['lint', 'scripts']);
    gulp.watch(options.src+'/**/*.scss', ['sass']);
});

gulp.task('launch', shell.task([
    options.launch,
    //'open http://127.0.0.1:8080/debug?port=5858'
]));

gulp.task('copy-packagejson', function () {
    return gulp.src('src/*.json', {base: 'src'})
    .pipe(debug())
    .pipe(gulp.dest(options.dist));
});
gulp.task('copy-root', function () {
    return gulp.src(['./*.js', './*.html'], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist));
});

gulp.task('mkdir-dist', function () {
    return new Promise(function(fulfill, reject) {
        mkdirp(dist).then(function(){
            return mkdirp(dist+'/node_modules');
        }).then(function(){
            return mkdirp(dist+'/bower_components');
        }).then(function(){
            return mkdirp(dist+'/browser');
        }).then(function(){
            return mkdirp(dist+'/browser/images');
        }).then(function(){
            return mkdirp(dist+'/browser/bower_components');
        }).done(fulfill,reject);
    });
});

gulp.task('dist-copy-deps', function () {
    return new Promise(function(fulfill, reject) {
        cprf(srcBrowser+'/images', distBrowser+'/images').then(function(){
            return cprf('./deps', distBrowser+'/deps');
        }).then(function(){
            return cprf('./quickstart', distBrowser+'/quickstart');
        }).done(fulfill,reject);
    });
});

gulp.task('dist-copy-dependencies', function () {
    return new Promise(function(fulfill, reject) {
        var promiselist = [];
        _.each(nodedependencies, function (d) {
            gutil.log('Coping ', gutil.colors.cyan(d));
            promiselist.push(cprf('./node_modules/'+d, dist+'/node_modules/'+d));
        });
        _.each(bowerdependencies, function (d) {
            gutil.log('Coping ', gutil.colors.cyan(d));
            promiselist.push(cprf('./bower_components/'+d, dist+'/bower_components/'+d));
            promiselist.push(cprf('./bower_components/'+d, distBrowser+'/bower_components/'+d));
        });
        Promise.all(promiselist).done(fulfill,reject);
    });
});

gulp.task('clean', function() {
    rimraf('./build');
});

gulp.task('init-atom', function(cb) {
    atomdownload({
        version: '0.21.1',
        outputDir: options.tmp,
        downlaodDir: "download",
        symbols:true,
    }, cb);
});


gulp.task('dist-release', function () {
    var name = options.appName;
    var distatom = 'dist/osx/'+options.appFilename;
    var distapp = distatom+'/Contents/Resources/app';
    return new Promise(function(fulfill, reject) {
        rimraf('dist').then(function() {
            return mkdirp('dist');
        }).then(function() {
            return mkdirp('dist/osx');
        }).then(function() {
            return cprf(options.tmp+'/Atom.app/', distatom);
        }).then(function() {
            return cprf(distatom+'/Contents/MacOS/Atom', distatom+'/Contents/MacOS/'+name);
        }).then(function() {
            return rimraf(distatom+'/Contents/MacOS/Atom');
        }).then(function() {
            return mkdirp(distapp);
        }).then(function() {
            return mkdirp(distapp+'/js');
        }).then(function() {
            return mkdirp(distapp+'/js/bower_components');
        }).then(function() {
            return cprf('res/bin', distapp+'/resources');
        }).then(function() {
            return cprf(options.icon, distatom+'/Contents/Resources/atom.icns');
        }).done(fulfill,reject);
    });
});

gulp.task('dist-plist', function () {
    var stream = gulp.src('').pipe(shell([
        '/usr/libexec/PlistBuddy -c "Set :CFBundleVersion <%= version %>" dist/osx/<%= filename %>/Contents/Info.plist',
        '/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist',
        '/usr/libexec/PlistBuddy -c "Set :CFBundleName <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist',
        '/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier <%= bundle %>" dist/osx/<%= filename %>/Contents/Info.plist',
        '/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist'
    ], {
        templateData: {
            filename: options.appFilename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)'),
            name: options.appName.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)'),
            version: packagejson.version,
            bundle: options.bundle,
            icon: options.icon,
            dist: options.dist,
            flag: options.flag,
        }
    }));

    return stream;
});

gulp.task('sign', function () {
    try {
        var signingIdentity = fs.readFileSync('./identity', 'utf8').trim();
        return gulp.src('').pipe(shell([
            'codesign --deep --force --verbose --sign "' + signingIdentity + '" ' + options.appFilename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)')
        ], {
            cwd: './dist/osx/'
        }));
    } catch (error) {
        gutil.log(gutil.colors.red('Error: ' + error.message));
    }
});

gulp.task('zip', function () {
    return gulp.src('').pipe(shell([
        'ditto -c -k --sequesterRsrc --keepParent ' +  options.appFilename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)') + ' ' +  options.name.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)') + '-' + packagejson.version + '.zip'
    ], {
        cwd: './dist/osx/'
    }));
});

gulp.task('settings', function () {
    var stringsrc = function (filename, string) {
        var src = require('stream').Readable({ objectMode: true });
        src._read = function () {
            this.push(new gutil.File({ cwd: '', base: '', path: filename, contents: new Buffer(string) }));
            this.push(null);
        };
        return src;
    };
    return stringsrc('settings.json', JSON.stringify(settings)).pipe(gulp.dest('dist/osx/' + options.appFilename.replace(' ', '\ ').replace('(','\(').replace(')','\)') + '/Contents/Resources/app'));
});

gulp.task('patch', function () {
    return gulp.src('').pipe(shell([
        'cp -rf ./bower_components/zone.js/zone.js deps/zone.js/zone.js',
        'cp -rf ./quickstart/dist/es6-shim.js deps/es6-shim/es6-shim.js',
        'cd deps/zone.js/ && patch -c zone.js < zone.js.patch',
        'cd deps/es6-shim/ && patch -c es6-shim.js < es6-shim.js.patch',
    ],{templateData: options}));
});
gulp.task('unpatch', function () {
    return gulp.src('').pipe(shell([
        'cp -rf ./bower_components/zone.js/zone.js deps/zone.js/zone.js',
        'cp -rf ./quickstart/dist/es6-shim.js deps/es6-shim/es6-shim.js',
    ],{templateData: options}));
});

gulp.task('init', function(cb) {
    runSequence(
        ['patch', 'init-atom'],
        cb
    );
});

gulp.task('release', function (cb) {
    runSequence(
        'clean',
        'init',
        'dist-release', 
        'dist-plist',
        'build',
        'sign',
        'zip',
        //'watch', 'launch',
        cb
    );
});

gulp.task('build', function(cb) {
    runSequence(
        'mkdir-dist',
        ['dist-copy-deps', 'dist-copy-dependencies', 'copy-packagejson'],
        ['lint', 'sass', 'scripts', 'html', 'settings'],
        cb
    );
});
gulp.task('default', function(cb) {
    runSequence(
        'clean',
        'build',
        'watch', 'launch',
        cb);
});



