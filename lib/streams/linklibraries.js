'use strict';
var File = require('vinyl');
var through = require('through2');
var _ = require('lodash');

// This stream takes Solidity contract files and hands them off to the Solidity
// compiler and passes it on.
module.exports = function (opts) {

  return through.obj(function (file, enc, cb) {
    if (/classes.json$/.test(file.path)) {
      let classes = JSON.parse(String(file.contents));

      classes = _.each(classes, (content, name) => {
        classes[name].bytecode = content.bytecode.replace(/__([^_]+)_*/g, (matched, name) => {
          // throw an error if the current library is not found
          if (!name in classes) throw new Error(`Library ${name} not found!`);
          // throw an error if the current library instance is not found on the chain
          if (!'address' in classes[name]) throw new Error(`Library instance of ${name} not found in your environment!`);
          return classes[name].address;
        })
      });

      this.push(new File({
        path: 'classes.json',
        contents: new Buffer(JSON.stringify(classes))
      }));
    } else {
      this.push(file);
    }
    cb();
  });
};
