// Get stuff from the `const` folder.
// TODO this class is a disaster
'use strict';
var fs = require('dapple-core/file.js');
var path = require('path');

class Const {
  constructor () {
    var constants_directory = path.join(__dirname, '/../constants');
    this.CONSTANTS_DIRECTORY = constants_directory;
    this.DAPPFILE_FILENAME = 'Dappfile';
    this.PACKAGES_DIRECTORY = '.dapple/packages';
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

    this.DAPPLE_HEADERS = ['Test', 'Debug', 'Tester', 'Reporter'];
  }
}

module.exports = new Const();
