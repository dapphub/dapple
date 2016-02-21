'use strict';

var _ = require('lodash');
var File = require('vinyl');
var Parser = require('../DSL.js');
var through = require('through2');

module.exports = function (opts) {
  return through.obj(function (file, enc, cb) {
    var self = this;
    this.push(file);

    if (file.basename === 'classes.json') {
      var classes = JSON.parse(String(file.contents));
      var parser = new Parser(_.extend({}, opts, {classes}));

      try {
        parser.parse(opts.script, function (err, results) {
          if (err) throw err;

          self.push(new File({
            path: '__deployScript.json',
            contents: new Buffer(JSON.stringify(results))
          }));

          self.push(new File({
            path: '__deployScript.stdout',
            contents: new Buffer('Successfully deployed!')
          }));
          cb();
        });
      } catch (e) {
        this.push(new File({
          path: '__deployScript.stderr',
          contents: new Buffer(String(e))
        }));
        cb();
      }
    } else {
      cb();
    }
  });
};
