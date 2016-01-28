'use strict';

var Linker = require('../linker.js');
var through = require('through2');

var filter = function (exclude) {
  return through.obj(function (file, enc, cb) {
    if (Linker.CONTRACTLINK_REGEXP.test(file.path) ? !exclude : exclude) {
      this.push(file);
    }
    cb();
  });
};

// This stream converts all Dapple import statements into their absolute paths.
module.exports = {
  exclude: function () {
    return filter(true);
  },

  only: function () {
    return filter(false);
  }
};
