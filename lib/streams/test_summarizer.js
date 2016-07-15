'use strict';

var clc = require('cli-color-tty')(true);
var File = require('vinyl');
var path = require('path');
var through = require('through2');

// Takes the output of the test stream and summarizes the test results.
// Outputs one file object if all the tests passed, and two if some
// tests failed. One file object has a string describing the overall
// test status, and the other has a list of all failing tests.
module.exports = function () {
  var totalTests = 0;
  var failingTests = [];

  return through.obj(function (file, enc, cb) {
    if (/\.stderr$/.test(file.path)) {
      failingTests.push(file);
    }
    totalTests += 1;
    cb();
  }, function (cb) {
    var ext = '.stdout';
    var output = clc.green('Passed all ' + totalTests + ' tests!');

    if (failingTests.length > 0) {
      ext = '.stderr';
      output = clc.red(
        'Failed ' + failingTests.length +
        ' out of ' + totalTests + ' tests.');

      var failedOutput = '';
      for (let failingTest of failingTests) {
        failedOutput += clc.red(path.dirname(failingTest.path) +
            ': ' + path.basename(failingTest.path, ext)) + '\n  ';
      }

      this.push(new File({
        path: path.join('Failing Tests', 'summary' + ext),
        contents: new Buffer(failedOutput)
      }));
    }

    this.push(new File({
      path: path.join('Summary', 'summary' + ext),
      contents: new Buffer(output)
    }));

    cb();
  });
};
