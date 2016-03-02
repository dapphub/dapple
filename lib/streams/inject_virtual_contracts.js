'use strict';

var constants = require('../constants');
var File = require('vinyl');
var through = require('through2');

// This stream injects some built-in contracts for the other contracts to use.
module.exports = function () {
  return through.obj(

    // No-op. We aren't interested in transforming...
    (file, enc, cb) => cb(null, file),

    // ...we're more interested in injecting.
    function (cb) {
      var sources = constants.DAPPLE_PACKAGE_SOURCES;

      for (var path in sources) {
        this.push(new File({
          path: path,
          contents: new Buffer(sources[path])
        }));
      }
      cb();
    });
};
