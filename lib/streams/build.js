'use strict';

var Builder = require('../build.js');
var File = require('vinyl');
var through = require('through2');

// This stream takes Solidity contract files and hands them off to the Solidity
// compiler and passes it on.
module.exports = function (opts) {
  var sources = {};

  return through.obj(function (file, enc, cb) {
    if (file.path.endsWith('.sol')) {
      sources[file.path] = String(file.contents);
    } else {
      this.push(file);
    }
    cb();
  }, function (cb) {
    var solc_out = Builder.buildSources(sources, opts);

    // TODO: lol...
    global.built_sources = sources;

    this.push(new File({
      path: 'classes.json',
      contents: new Buffer(JSON.stringify(solc_out.contracts))
    }));
    cb();
  });
};
