'use strict';

var _ = require('lodash');
var through = require('through2');
var File = require('vinyl');
var LogTranslator = require('../logtranslator.js');

var GENERIC_LOG_PREFIX = 'log_id_';

// Runs and expands any Lodash template directives in the source code.
module.exports = function (opts) {
  var sources = [];

  return through.obj(function (file, enc, cb) {
    sources.push(file);
    cb();
  }, function (cb) {
    var logger = [];
    var logCounter = 0;

    for (let i = 0; i < sources.length; i += 1) {
      let file = sources[i];
      let content = String(file.contents);

      if (
        opts.web3 === 'internal' && // only on internal chains
        /\.sol$/i.test(file.path) // is solidity contract
      ) {
        if( RegExp(/^\s*\/\/@log/gm).test(content) ) { // has log statements inside
          content = content // update content
            .replace(/\/\/@log\s*(.*)$/gm, function( match, hit ) { // replace the log lines
              let eventName = `${GENERIC_LOG_PREFIX}${logCounter++}`;
              let types = hit
                  .split('`')
                  .filter((a, k) => k%2===1)
                  .map( t=>t.split(' '));
              let vars = types
                  .map(t => t.join(' ').replace('.','_'));
              // Add generic log to LoGTranslator to display it nicely in the future
              LogTranslator.addGenericLog (eventName, hit);
              // Save logger
              logger.push({
                target: match,
                signature: `event ${eventName}(${vars.join(',')});`
              });
              return `${eventName}(${types.map( t=> t[1] ).join(',')});`;
            });
        } // if has logs
        content = content
          .replace(/^\s*contract([^{]*){/gm, function( match, hit ){ // inject DappleLogger contract
            return `contract ${hit}${RegExp(/\sis\s/gm).test(hit)?',':'is'} DappleLogger {`;
          });
        // inject import
        content = 'import "dapple/dapple_log.sol";\n'+ content;
      }
      file.contents = new Buffer(content);
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
