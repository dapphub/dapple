'use strict';

var clc = require('cli-color-tty')(true);
var path = require('path');
var through = require('through2');

// Takes the output of the test and test_summarizer streams
// and emits it to stdout and stderr (as appropriate) before
// passing it on to the next stream in the pipeline.
module.exports = function () {
  var lastDirectory;

  return through.obj(function (file, enc, cb) {
    this.push(file);

    if (!/\.(stderr|stdout)$/.test(file.path)) {
      return cb();
    }

    var out = console.log;

    if (/\.stderr$/.test(file.path)) {
      out = console.error;
    }

    if (lastDirectory !== path.dirname(file.path)) {
      lastDirectory = path.dirname(file.path);
      out('\n' + clc.bold(lastDirectory));
    }
    out('  ' + String(file.contents));
    cb();
  });
};
