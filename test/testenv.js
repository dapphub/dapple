'use strict';

var fs = require('dapple-core/file');
var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var path = require('path');
var through = require('through2');
var Workspace = require('../lib/workspace.js');

module.exports = {
  golden_package_dir: path.join(
    __dirname, '_fixtures', 'testenv', 'golden_package'),
  golden_solc_output: function () {
    return fs.readJsonSync(this.golden.SOLC_OUT_PATH());
  },
  golden: {
    ROOT: path.join(__dirname, '_fixtures', 'testenv', 'golden'),
    JS_OUT_PATH: function () {
      return path.join(__dirname, '_fixtures', 'golden', 'js_module.js');
    },
    JS_OUT: function () {
      return fs.readFileSync(this.JS_OUT_PATH(), 'utf8');
    },
    METEOR_OUT_PATH: function () {
      return path.join(__dirname, '_fixtures', 'golden', 'meteor.js');
    },
    METEOR_OUT: function () {
      return fs.readFileSync(this.METEOR_OUT_PATH(), 'utf8');
    },
    SOLC_OUT_PATH: function () {
      return path.join(__dirname, '_fixtures', 'golden', 'solc_out.json');
    },
    SOLC_OUT: function () {
      return fs.readJsonSync(this.SOLC_OUT_PATH());
    },
    NO_DEPLOY_JS_OUT_PATH: function () {
      return path.join(__dirname, '_fixtures', 'golden', 'js_module.no_deploy.js');
    },
    NO_DEPLOY_JS_OUT: function () {
      return fs.readFileSync(this.NO_DEPLOY_JS_OUT_PATH(), 'utf8');
    },
    MY_GLOBAL_JS_OUT_PATH: function () {
      return path.join(__dirname, '_fixtures', 'golden', 'js_module.my_global.js');
    },
    MY_GLOBAL_JS_OUT: function () {
      return fs.readFileSync(this.MY_GLOBAL_JS_OUT_PATH(), 'utf8');
    },
    INIT_EMPTY_DIR: path.join(
      __dirname, '_fixtures', 'golden', 'golden_init'),
    FILTERED_SOLC_OUT_PATH: path.join(
      __dirname, '_fixtures', 'golden', 'golden_solc_classes_out')
  },
  dsl_package_dir: path.join(
    __dirname, '_fixtures', 'testenv', 'deploy_package'),

  empty_package_dir: path.join(
    __dirname, '_fixtures', 'testenv', 'empty_package'),

  linker_package_dir: path.join(__dirname, '_fixtures', 'linker_test_package'),

  stream_test_dir: path.join(__dirname, '_fixtures', 'streams_test'),

  get_source_files: function (packagePath, callback) {
    var sources = {};
    var packageRoot = Workspace.findPackageRoot(packagePath);

    SourcePipeline({packageRoot: packageRoot})
      .pipe(through.obj(function (file, enc, cb) {
        sources[file.path] = file;
        cb();
      }, function (cb) {
        callback(sources);
        cb();
      }));
  }
};
