'use strict';

var File = require('vinyl');
var Parser = require('../DSL.js');
var through = require('through2');

module.exports = function (opts) {
  return through.obj(function (file, enc, cb) {
    var self = this;
    this.push(file);

    if (file.basename === 'classes.json') {
      var classes = JSON.parse(String(file.contents));
      var parser = new Parser({
        classes,
        web3: opts.web3,
        workspace: opts.workspace,
        env: opts.env
      });

      try {
        parser.parse(opts.script, function (err, results) {
          if (err) throw err;

          self.push(new File({
            path: 'deployScript.stdout',
            contents: new Buffer(JSON.stringify(results))
          }));
          cb();
        });
      } catch (e) {
        this.push(new File({
          path: 'deployScript.stderr',
          contents: new Buffer(String(e))
        }));
        cb();
      }
    } else {
      cb();
    }
  });
};
