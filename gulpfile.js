'use strict';

var gulp = require('gulp');
var shell = require('gulp-shell');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var changed = require('gulp-changed');
var debug = require('gulp-debug');
var rimraf = require( 'rimraf');
var wiredep = require('wiredep').stream;
var sass = require('gulp-sass');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var colors   = require('colors');
var _   = require('lodash');
var atomdownload = require('gulp-download-atom-shell');

var fs = require('fs');
var packagejson = require('./package.json');
var bowerjson = require('./bower.json');
var bowerdependencies = Object.keys(bowerjson.dependencies);
var nodedependencies = Object.keys(packagejson.dependencies);
var isBeta = process.argv.indexOf('--beta') !== -1;
var isVerbose = process.argv.indexOf('--verbose') !== -1;

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
    appFilename: isBeta ? 'Zapzapzap (Beta).app' : 'Zapzapzap.app',
    appName: isBeta ? 'Zapzapzap (Beta)' : 'Zapzapzap',
    name: 'Zapzapzap',
    icon: isBeta ? './res/zapzapzap-beta.icns' : './res/zapzapzap.icns',
    bundle: 'com.zapzapzap.zapzapzap'
};
options.distosx = './dist/osx/' + options.appFilename + '/Contents/Resources/app/build',
    options.dist = options.dev ? options.build : options.distosx
options.distBrowser = options.dist + '/browser'
options.atompath = options.tmp+'/Atom.app/Contents/MacOS/Atom '
options.launch = options.dev ? options.atompath + options.build+' --proxy-server=127.0.0.1:3000 --debug=5858' : options.atompath + options.distosx + ' --proxy-server=127.0.0.1:3000 --debug=5858';

if (isVerbose) {
    console.log(options);
}

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: options.dist,
        },
        open: false,
    });
});

gulp.task('scripts', function() {
    return gulp.src([
        options.src+'/*.js',
        options.src+'/js/**/*.js'
    ], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist));
});

gulp.task('sass', function() {
    return gulp.src(options.src+'/scss/*.scss', {base: options.src})
    .pipe(debug())
    .pipe(sass())
    .pipe(gulp.dest(options.dist))
});

gulp.task('lint', function() {
    gulp.src(options.src+'*.js', {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    return gulp.src(options.src+'/js/**/*.js', {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
});

gulp.task('html', function() {
    return gulp.src([
        options.src+'/*.html',
        options.src+'/views/**/*.html',
    ], {base: options.src})
    .pipe(debug())
    .pipe(wiredep())
    .pipe(gulp.dest(options.dist))
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

gulp.task('copy', function(cb) {
    runSequence(
        ['copy-node', 'copy-bower'/*, 'copy-bower-browser'*/, 'copy-atom', 'copy-root'],
        cb
    );
});
gulp.task('copy-atom', function () {
    return gulp.src('src/*.json', {base: '.'})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
});
gulp.task('copy-root', function () {
    return gulp.src(['./*.js', './*.html'], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
});
gulp.task('copy-bower', function () {
    return gulp.src('./bower_components/**/*', {base: '.'})
    ////.pipe(debug())
    .pipe(gulp.dest(options.dist))
});
gulp.task('copy-bower-browser', function () {
    return gulp.src('./bower_components/**/*', {base: '.'})
    //.pipe(debug())
    .pipe(gulp.dest(options.distBrowser))
});
gulp.task('copy-node', function () {
    return gulp.src('./node_modules/**/*', {base: '.'})
    //.pipe(debug())
    .pipe(gulp.dest(options.dist))
});

gulp.task('copy-all', function(cb) {
    runSequence(
        ['copy-all-node', 'copy-all-atom', 'copy-all-bower'],
        cb
    );
});
gulp.task('copy-all-atom', function () {
    return gulp.src('').pipe(shell([
        'mkdir -p <%= dist %>',
        'mkdir -p <%= dist %>/browser',
        'cp -rf <%= src %>/*.json <%= dist %>',
        'cp -rf <%= src %>/*.js <%= dist %>',
        'cp -rf <%= src %>/*.html <%= dist %>',
        'cp -rf deps <%= dist %>',
        'cp -rf quickstart <%= dist %>',
    ],{templateData: options}));
});
gulp.task('copy-all-bower', function () {
    return gulp.src('').pipe(shell([
        'cp -rf bower_components <%= dist %>',
    ],{templateData: options}));
});
gulp.task('copy-all-bower-browser', function () {
    return gulp.src('').pipe(shell([
        'cp -rf bower_components <%= dist %>/browser',
    ],{templateData: options}));
});
gulp.task('copy-all-node', function () {
    return gulp.src('').pipe(shell([
        'cp -rf node_modules <%= dist %>',
    ],{templateData: options}));
});

gulp.task('clean', function(cb) {
    rimraf('./{build,dist}', cb);
});

gulp.task('init', function(cb) {
    runSequence(
        ['init-atom'],
    cb);
});
gulp.task('init-atom', function(cb) {
    atomdownload({
        version: '0.21.1',
        outputDir: options.tmp
    }, cb);
});


gulp.task('dist', function () {
    var stream = gulp.src('').pipe(shell([
        'rm -Rf dist',
        'mkdir -p ./dist/osx',
        'cp -R ./cache/Atom.app ./dist/osx/<%= filename %>',
        'mv ./dist/osx/<%= filename %>/Contents/MacOS/Atom ./dist/osx/<%= filename %>/Contents/MacOS/<%= name %>',
        'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app',
        'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app/js/bower_components',
        'cp package.json dist/osx/<%= filename %>/Contents/Resources/app/',
        'mkdir -p dist/osx/<%= filename %>/Contents/Resources/app/resources',
        'cp -v res/* dist/osx/<%= filename %>/Contents/Resources/app/resources/ || :',
        'cp <%= icon %> dist/osx/<%= filename %>/Contents/Resources/atom.icns',
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
            icon: options.icon
        }
    }));

    nodedependencies.forEach(function (d) {
        stream = stream.pipe(shell([
            'cp -R node_modules/' + d + ' dist/osx/<%= filename %>/Contents/Resources/app/node_modules/'
        ], {
            templateData: {
                filename: options.appFilename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)')
            }
        }));
    });
    bowerdependencies.forEach(function (d) {
        stream = stream.pipe(shell([
            'cp -R bower_components/' + d + ' dist/osx/<%= filename %>/Contents/Resources/app/bower_components/'
        ], {
            templateData: {
                filename: options.appFilename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)')
            }
        }));
    });

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


gulp.task('init', ['dist', 'init-atom']);

gulp.task('release', function (cb) {
    runSequence(
        'clean',
        'init',
        ['copy-all', 'lint', 'sass', 'scripts', 'html', 'settings'],
        'watch',
        'sign',
        'zip',
        cb
    );
});

gulp.task('default', function(cb) {
    runSequence(
        ['copy-all', 'lint', 'sass', 'scripts', 'html', 'settings'],
        'watch',
        'launch',
        cb
    );
});


