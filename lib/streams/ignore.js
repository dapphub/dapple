'use strict';

var _ = require('lodash');
var through = require('through2');

module.exports = function (regexPatterns) {
  var regexes = _.map(regexPatterns, (pattern) => new RegExp(pattern));
  return through.obj(function (file, enc, cb) {
    if (!regexes ||
      regexes.length === 0 ||
      !_.any(regexes, (r) => r.test(file.path))) {
      this.push(file);
    }
    cb();
  });
};
