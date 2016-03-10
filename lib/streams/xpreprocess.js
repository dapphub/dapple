'use strict';

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
        /\.sol$/i.test(file.path) && // is solidity contract
        opts.report
      ) {
        if (RegExp(/^\s*\/\/@(warn|info|debug|log|doc)/gm).test(content)) { // has log statements inside
          content = content // update content
            .replace(/\/\/@(warn|info|debug|log|doc)\s*(.*)$/gm, function (match, type, hit) { // replace the log lines
              let eventName = `${GENERIC_LOG_PREFIX}${logCounter++}`;
              let types = hit
                  .replace(/\\`/g, '\0')
                  .split(/`/)
                  .filter((a, k) => k % 2 === 1)
                  .map(t => {
                    if (t.indexOf(' ') === -1) throw new Error('Log statements has to follow the form: `<type> <name>`');
                    return t.split(' ');
                  });
              let vars = types
                  .map(t => t[0] + ' ' + t[1].replace(/\.|\[|\]|\)|\(|\+|\-|\s+|\=|\<|\>/g, '_'));
              // Add generic log to LoGTranslator to display it nicely in the future
              LogTranslator.addGenericLog(eventName, type, hit);
              // Save logger
              // TODO - ressearch if explicite type declaration can be omitted and instread
              // replaced with every type signature, the solc compiler then picks the correct types
              // much like assert generation in tests
              logger.push({
                target: match,
                signature: `event ${eventName}(${vars.join(',')});`
              });
              return `${eventName}(${types.map(t => t[1]).join(',')});`;
            });
        } // if has logs
        content = content
          .replace(/^\s*contract\s([^{]*){/gm, function (match, hit) { // inject DappleLogger contract
            return `contract ${RegExp(/\sis\s/gm).test(hit) ? (hit.replace(/\sis\s/gm, ' is DappleLogger, ')) : (hit + 'is DappleLogger')} {`;
          });
        // inject import
        content = 'import "dapple/dapple_log.sol";\n' + content;
      }
      file.contents = new Buffer(content);
      this.push(file);
    }
    // if there is something to log, inject logger
    this.push(new File({
      path: 'dapple/dapple_log.sol',
      contents: new Buffer(`contract DappleLogger {\n${logger.map(l => l.signature).join('\n')}\n}`)
    }));
    cb();
  });
};
