var gulp = require('gulp');
var _ = require('lodash');
var template = require('gulp-template-compile');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var jslint = require('gulp-jslint');
var stylus = require('gulp-stylus');
var groc = require('gulp-groc');
var rimraf = require('gulp-rimraf');
var nib = require('nib');
var karma = require('karma').server;

var VENDOR_FILES = [
  './backbone/vendor/jquery.js',
  './backbone/vendor/jquery.cookie.js',
  './backbone/vendor/jquery.knob.js',
  './backbone/vendor/jquery.base64.js',
  './backbone/vendor/jquery.matchHeight.js',
  './backbone/vendor/jquery.noty.js',
  './backbone/vendor/jquery.noty.bootstrap-theme.js',
  './backbone/vendor/jquery.highlight.js',
  './backbone/vendor/underscore.js',
  './backbone/vendor/underscore.string.js',
  './backbone/vendor/clientconfig.bundle.js',
  './backbone/vendor/backbone.js',
  './backbone/vendor/backbone.marionette.js',
  './backbone/vendor/backbone.picky.js',
  './backbone/vendor/backbone.syphon.js',
  './backbone/vendor/backbone.fetch-cache.js',
  './backbone/vendor/backbone.paginator.js',
  './backbone/vendor/backbone.stickit.js',
  './backbone/vendor/bootstrap.js',
  './backbone/vendor/bootstrap-multiselect.js',
  './backbone/vendor/bootstrap-datepicker.js',
  './backbone/vendor/moment.js',
  './backbone/vendor/autolinker.js'
];

var APP_FILES = [
  './backbone/config/**/*.js',
  './backbone/app.js',
  './backbone/common/**/*.js',
  './backbone/entities/base/*.js',
  './backbone/entities/*.js',
  './backbone/apps/**/*.js'
];

var TEST_FILES = [
  './test/setup/*.js',
  './test/**/*.spec.js'
];

var FDO_DEPLOY_DIR = '../../public/workspace/client/js';
var FDO_SOURCEMAPS_DIR = './sourcemaps';
var FDO_CSS_DEPLOY_DIR = '../../public/workspace/client/css';
var DOCS_DIR = './docs';
var TEST_DIR = './test';

// Karma test runner config
var karmaConfig = {
  frameworks: ['mocha', 'chai-sinon'],
  files:
    VENDOR_FILES
      .concat(APP_FILES)
      .concat([FDO_DEPLOY_DIR + '/templates.js'])
      .concat(TEST_FILES),
  browsers: ['PhantomJS'],
  reporters: ['progress', 'coverage'],
  preprocessors: {
    './backbone/common/**/*.js': ['coverage'],
    './backbone/entities/base/*.js': ['coverage'],
    './backbone/entities/*.js': ['coverage'],
    './backbone/apps/**/*.js': ['coverage']
  },
  coverageReporter: {
    type : 'html',
    dir : TEST_DIR + '/coverage'
  }
  //usePolling: true
  //logLevel: 'debug'
  //browsers: ['Chrome']
};

// Concat and copy vendor scripts into deploy location
gulp.task('vendor', function () {
  return gulp.src(VENDOR_FILES)
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write(FDO_SOURCEMAPS_DIR))
    .pipe(gulp.dest(FDO_DEPLOY_DIR));
});

// Concat and copy templates into deploy location
gulp.task('templates', function () {
  gulp.src(['./backbone/**/*.jst'])
    .pipe(sourcemaps.init())
    .pipe(template())
    .pipe(concat('templates.js'))
    .pipe(sourcemaps.write(FDO_SOURCEMAPS_DIR))
    .pipe(gulp.dest(FDO_DEPLOY_DIR));
});

// Concat and copy application scripts into deploy location
gulp.task('scripts', function () {
  return gulp.src(APP_FILES)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write(FDO_SOURCEMAPS_DIR))
    .pipe(gulp.dest(FDO_DEPLOY_DIR));
});

// JSLint application files
gulp.task('jslint', function () {
  gulp.src(APP_FILES.concat(TEST_FILES))
    .pipe(jslint({
      node: true,
      evil: true,
      nomen: true,
      indent: 2,
      unparam: true,
      errorsOnly: false
    })).on('error', function (error) {
      console.error(String(error));
      process.exit(1);
    });
});

// Compile Stylus based style files into CSS, storing in deploy location
gulp.task('styles', function () {
  gulp.src('./styles/app.styl')
    .pipe(stylus({use: [nib()]}))
    .pipe(gulp.dest(FDO_CSS_DEPLOY_DIR));
});

// Clean generated docs
gulp.task('clean-docs', function () {
  return gulp.src(DOCS_DIR + '/*', {
    read: false
  }).pipe(rimraf());
});

// Generate documentation
gulp.task('docs', ['clean-docs'], function () {
  return gulp.src(APP_FILES).pipe(groc({
    out: DOCS_DIR
  }));
});

// Run tests once and exit
gulp.task('test-once', ['build'], function (done) {
  karma.start(_.assign({}, karmaConfig, {singleRun: true}), done);
});

// Run tests and watch for changes
gulp.task('test', ['watch'], function (done) {
  karma.start(karmaConfig, done);
});

// Watch application files for changes; if found trigger re-concat and deploy
gulp.task('watch', ['build'], function () {
  gulp.watch('./backbone/vendor/**/*', ['vendor']);
  gulp.watch('./backbone/**/*.jst', ['templates']);
  gulp.watch([
    './backbone/**/*.js',
    '!./backbone/vendor/**/*.js'
    ], ['scripts']);
    gulp.watch('./styles/**/*.styl', ['styles']);
});

// Build
gulp.task('build', ['vendor', 'scripts', 'templates', 'styles']);

// Default task
gulp.task('default', ['watch']);
