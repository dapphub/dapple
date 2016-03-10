'use strict';

var _ = require('lodash');
var through = require('through2');
var Workspace = require('../workspace.js');

// Runs and expands any Lodash template directives in the source code.
module.exports = function (preprocessorVars) {
  preprocessorVars = preprocessorVars || {};
  var sources = [];

  return through.obj(function (file, enc, cb) {
    sources.push(file);
    cb();
  }, function (cb) {
    var workspace = new Workspace(sources);

    for (let i = 0; i < sources.length; i += 1) {
      let file = sources[i];

      if (/\.sol$/i.test(file.path)) {
        let vars = _.assign(workspace.getPreprocessorVars(file.path), preprocessorVars);
        try {
          file.contents = new Buffer(_.template(String(file.contents))(vars));
        } catch (err) {
          throw new Error("Error preprocessing '" + file.path + "': " + err);
        }
      }
      this.push(file);
    }
    cb();
  });
};
