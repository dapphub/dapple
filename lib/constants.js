// Get stuff from the `const` folder.
// TODO this class is a disaster
'use strict';
var fs = require('./file');
var path = require('path');

class Const {
  constructor () {
    var constants_directory = path.join(__dirname, '/../constants');
    this.CONSTANTS_DIRECTORY = constants_directory;
    this.DAPPFILE_FILENAME = 'dappfile';
    this.DAPPLERC_FILENAME = '_dapplerc';
    this.PACKAGES_DIRECTORY = 'dapple_packages';
    this.JS_HEADER_TEMPLATE_DIR = path.join(
        this.CONSTANTS_DIRECTORY, 'build_templates');

    this.JS_HEADER_TEMPLATE = function (name) {
      if (typeof name === 'undefined') {
        name = 'js_module';
      }
      return fs.readFileStringSync(
          path.join(this.JS_HEADER_TEMPLATE_DIR, name + '.template'));
    };

    this.SOL_CONTRACT_TEMPLATE = function () {
      return fs.readFileStringSync(
        path.join(this.CONSTANTS_DIRECTORY, 'template.sol'));
    };

    this.SOL_CONTRACT_TEST_TEMPLATE = function () {
      return fs.readFileStringSync(
        path.join(this.CONSTANTS_DIRECTORY, 'template_test.sol'));
    };

    this.DAPPLE_VMTEST_CLASSES = {
      'dapple/test.sol': path.join(constants_directory, '/test.sol'),
      'dapple/debug.sol': path.join(constants_directory, '/debug.sol'),
      'dapple/reporter.sol': path.join(constants_directory, '/reporter.sol')
    };
    this.DAPPLE_HEADERS = ['Test', 'Debug', 'Tester', 'Reporter'];
  }
  // Source object you can feed into solc module
  // TODO dapple-buildpack should be a proper package
  get DAPPLE_PACKAGE_SOURCES () {
    var out = {};
    var classpaths = this.DAPPLE_VMTEST_CLASSES;
    for (let path in classpaths) {
      out[path] = fs.readFileStringSync(classpaths[path]);
    }
    return out;
  }
}

module.exports = new Const();
