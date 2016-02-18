'use strict';

var through = require('through2');
var Parser = require('../DSL.js');

module.exports = function (opts) {
  return through.obj(function (file, enc, cb) {
    if (file.basename === 'classes.json') {
      var classes = JSON.parse(String(file.contents));
      var parser = new Parser({
        classes,
        web3: opts.web3,
        workspace: opts.workspace,
        env: opts.env
      });
      parser.parse(opts.script, cb);
    } else {
      cb();
    }
  });
};
