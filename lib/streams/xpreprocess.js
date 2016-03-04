'use strict';

var _ = require('lodash');
var through = require('through2');
var Workspace = require('../workspace.js');
var File = require('vinyl');

// Runs and expands any Lodash template directives in the source code.
module.exports = function (opts) {
  var sources = [];

  return through.obj(function (file, enc, cb) {
    sources.push(file);
    cb();
  }, function (cb) {
    var workspace = new Workspace(sources);
    var logger = [];
    var logCounter = 0;

    for (let i = 0; i < sources.length; i += 1) {
      let file = sources[i];
      let content = String(file.contents);

      if (
        opts.web3 === 'internal' && // only on internal chains
        /\.sol$/i.test(file.path) && // is solidity contract
        RegExp(/^\s*\/\/@log/gm).test(content) // has log statements inside
      ) {
        content = content // update content
          .replace(/\/\/@log\s*(.*)$/gm, function( match, hit ) { // replace the log lines
            let types = hit
                .split('`')
                .filter((a, k) => k%2===1)
                .map( t=>t.split(' '));
            // Save logger
            logger.push({
              target: match,
              signature: `event log_id_${logCounter}(${types.map( t=> t[0] ).join(',')});`
            });
            return `log_id_${logCounter++}(${types.map( t=> t[1] ).join(',')});`;
          })
          .replace(/^\s*contract([^{]*){/gm, function( match, hit ){ // inject DappleLogger contract
            return `contract ${hit}${RegExp(/\sis\s/gm).test(hit)?',':'is'} DappleLogger {`;
          });
          // inject import
          content = 'import "dapple/dapple_log.sol";\n'+ content;
        file.contents = new Buffer(content);
      }
      this.push(file);
    }
    // if there is something to log, inject logger
    if( logger.length > 0 ) {
      this.push(new File({
        path: "dapple/dapple_log.sol",
        contents: new Buffer(`contract DappleLogger {\n${logger.map(l => l.signature).join('\n')}\n}`)
      }));
    }
    cb();
  });
};
