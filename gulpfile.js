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
    src: 'src',
    dist: 'dist',
    tmp: '.tmp',
    e2e: 'e2e',
    errorHandler: function(title) {
        return function(err) {
            gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
            this.emit('end');
        };
    },
    dev: process.argv.indexOf('release') === -1,
    beta: isBeta,
    appFilename: isBeta ? 'Zapzapzap (Beta).app' : 'Zapzapzap.app',
    appName: isBeta ? 'Zapzapzap (Beta)' : 'Zapzapzap',
    name: 'Zapzapzap',
    icon: isBeta ? './util/zapzapzap-beta.icns' : './util/zapzapzap.icns',
    bundle: 'com.zapzapzap.zapzapzap'
};
if (isVerbose) {
    console.log(options);
}

gulp.task('atom-download', function(cb) {
    atomdownload({
        version: '0.21.1',
        outputDir: 'cache'
    }, cb);
});

gulp.task('atom-prep', function() {
    return gulp.src(['./src/main.js', './src/package.json'])
    .pipe(debug())
    .pipe(gulp.dest('./build'));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './build'
        }
    });
});

gulp.task('scripts', function() {
    return gulp.src('./src/js/**/*.js')
    .pipe(debug())
    .pipe(gulp.dest('./build/js'))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('sass', function() {
    return gulp.src('./src/scss/*.scss')
    .pipe(debug())
    .pipe(sass())
    .pipe(gulp.dest('./build/css'))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('lint', function() {
    return gulp.src('./src/js/**/*.js')
    .pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('html', function() {
    return gulp.src('./src/**/*.html')
    .pipe(debug())
    .pipe(wiredep())
    .pipe(gulp.dest('./build'))
    .pipe(reload({
        stream: true
    }));
});

gulp.task('watch', function() {
    gulp.watch('./src/**/*.html', ['html']);
    gulp.watch('./src/js/**/*.js', ['lint', 'scripts']);
    gulp.watch('./src/scss/*.scss', ['sass']);
});

gulp.task('launch', shell.task([
    options.dev ? 'cache/Atom.app/Contents/MacOS/Atom build --proxy-server=127.0.0.1:3000 --debug=5858' : 'cache/Atom.app/Contents/MacOS/Atom ./dist/osx/' + options.appFilename + '/Contents/Resources/app/build --proxy-server=127.0.0.1:3000 --debug=5858', 
    //'open http://127.0.0.1:8080/debug?port=5858'
]));

gulp.task('copy', ['copy-atom', 'copy-bower', 'copy-node', 'copy-dist']);
gulp.task('copy-atom', function () {
    gulp.src(['src/main.js', 'src/index.html'])
    .pipe(gulpif(options.dev, changed('./build')))
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.appFilename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-bower', function () {
    gulp.src('bower_components/*/**/*.js', {base: '.'})
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.appFilename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
    gulp.src('bower_components/*/**/*.css', {base: '.'})
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.appFilename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
    gulp.src('bower_components/*/**/*.png', {base: '.'})
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.appFilename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-node', function () {
    gulp.src('node_modules/*/**/*.{js,map,css,html}', {base: '.'})
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.appFilename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});
gulp.task('copy-dist', function () {
    gulp.src('./build/**/*')
    .pipe(gulp.dest('./dist/osx/' + options.appFilename + '/Contents/Resources/app/'))
    .pipe(gulpif(options.dev, reload({
        stream: true
    })));
});

gulp.task('dist', function () {
    var stream = gulp.src('').pipe(shell([
        'rm -Rf dist',
        'mkdir -p ./dist/osx',
        'cp -R ./cache/Atom.app ./dist/osx/<%= filename %>',
        'mv ./dist/osx/<%= filename %>/Contents/MacOS/Atom ./dist/osx/<%= filename %>/Contents/MacOS/<%= name %>',
        'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app',
        'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app/bower_components',
        'cp package.json dist/osx/<%= filename %>/Contents/Resources/app/',
        'mkdir -p dist/osx/<%= filename %>/Contents/Resources/app/resources',
        'cp -v resources/* dist/osx/<%= filename %>/Contents/Resources/app/resources/ || :',
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
        runSequence('atom-download', 'dist', 'lint', 'sass', 'scripts', 'html', 'atom-prep', 'settings', 'copy', 'sign', 'zip');
    } else {
        runSequence('atom-download', 'dist', 'lint', 'sass', 'scripts', 'html', 'atom-prep', 'settings', 'copy', 'sign', 'zip', 'watch',
                    'browser-sync',
                    'launch');
    }
});

gulp.task('default', ['lint', 'sass', 'scripts', 'html', 'atom-prep', 'copy', 'watch',
          'browser-sync',
          'launch'
]);
