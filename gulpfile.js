'use strict';

var gulp = require('gulp');
var shell = require('gulp-shell');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var changed = require('gulp-changed');
var debug = require('gulp-debug');
var wiredep = require('wiredep').stream;
var sass = require('gulp-sass');
var jshint = require('gulp-jshint');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var colors   = require('colors');
var _   = require('lodash');
var reload = browserSync.reload;
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

gulp.task('atom-download', function(cb) {
    atomdownload({
        version: '0.21.1',
        outputDir: options.tmp
    }, cb);
});

gulp.task('atom-prep', function() {
    return gulp.src([options.src+'/main.js', options.src+'/package.json'], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: options.dist
        }
    });
});

gulp.task('scripts', function() {
    gulp.src([
        options.src+'/*.js',
        options.src+'/js/**/*.js'
    ], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
    .pipe(reload({
        stream: true
    }));
    gulp.src([
        options.srcBrowser+'/*.js',
        options.srcBrowser+'/js/**/*.js'
    ], {base: options.srcBrowser})
    .pipe(debug())
    .pipe(gulp.dest(options.distBrowser))
    .pipe(reload({
        stream: true
    }));
    gulp.src('./build/**/*', {base: '.'})
    .pipe(gulp.dest('./dist/osx/' + options.appFilename + '/Contents/Resources/app/'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});

gulp.task('sass', function() {
    gulp.src(options.src+'/scss/*.scss', {base: options.src})
    .pipe(debug())
    .pipe(sass())
    .pipe(gulp.dest(options.dist))
    .pipe(reload({
        stream: true
    }));
    gulp.src(options.srcBrowser+'/scss/*.scss', {base: options.srcBrowser})
    .pipe(debug())
    .pipe(sass())
    .pipe(gulp.dest(options.distBrowser))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('lint', function() {
    gulp.src(options.src+'*.js', {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(reload({
        stream: true
    }));
    gulp.src(options.src+'/js/**/*.js', {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(reload({
        stream: true
    }));
    gulp.src(options.srcBrowser+'/js/**/*.js', {base: '.'})
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('html', function() {
    gulp.src([
        options.src+'/*.html',
        options.src+'/views/**/*.html',
    ], {base: options.src})
    .pipe(debug())
    .pipe(wiredep())
    .pipe(gulp.dest(options.dist))
    .pipe(reload({
        stream: true
    }));
    gulp.src([
        options.src+'/*.html',
        options.src+'/views/**/*.html',
    ], {base: options.srcBrowser})
    .pipe(debug())
    .pipe(wiredep())
    .pipe(gulp.dest(options.distBrowser))
    .pipe(reload({
        stream: true
    }));
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

gulp.task('copy', ['copy-atom', 'copy-bower', 'copy-bower-browser', 'copy-node'])
gulp.task('copy-atom', function () {
    return gulp.src(['./main.js', './index.html'], {base: options.src})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-bower', function () {
    return gulp.src('./bower_components/**/*', {base: '.'})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-bower-browser', function () {
    return gulp.src('./bower_components/**/*', {base: '.'})
    .pipe(debug())
    .pipe(gulp.dest(options.distBrowser))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-node', function () {
    return gulp.src('./node_modules/**/*', {base: '.'})
    .pipe(debug())
    .pipe(gulp.dest(options.dist))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});

gulp.task('copy-all', ['copy-all-atom', 'copy-all-bower', 'copy-all-bower-browser', 'copy-all-node'])
gulp.task('copy-all-atom', function () {
    return gulp.src('').pipe(shell([
        'mkdir -p <%= dist %>',
        'mkdir -p <%= dist %>/browser',
        'cp -rf <%= src %>/main.js <%= dist %>',
        'cp -rf <%= src %>/index.html <%= dist %>',
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
    stringsrc('settings.json', JSON.stringify(settings)).pipe(gulp.dest('dist/osx/' + options.appFilename.replace(' ', '\ ').replace('(','\(').replace(')','\)') + '/Contents/Resources/app'));
});


gulp.task('release', function () {
    if (!options.dev) {
        runSequence('atom-download', 'dist', 'lint', 'sass', 'scripts', 'html', 'atom-prep', 'settings', 'copy-all', 'sign', 'zip');
    } else {
        runSequence('atom-download', 'dist', 'lint', 'sass', 'scripts', 'html', 'atom-prep', 'settings', 'copy-all', 'sign', 'zip', 'watch',
                    'browser-sync',
                    'launch');
    }
});

gulp.task('default', function() {
    runSequence(['copy-all', 'lint', 'sass', 'scripts', 'html', 'atom-prep', 'watch'],[
          'browser-sync',
          'launch'
]);
});

