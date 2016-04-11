'use strict';

var _ = require('lodash');
var clc = require('cli-color-tty')(true);
var Contract = require('../contract');
var deasync = require('deasync');
var File = require('vinyl');
var LogTranslator = require('../logtranslator');
var path = require('path');
var fs = require('fs');
var through = require('through2');
var VMTest = require('../vmtest');

// This stream takes the output of either the build stream or pipeline (they
// produce the same output) and returns a stream of files containing the output
// of running each `Test` contract. A special, non-standard `error` flag is set
// on File objects representing failed tests. This allows the `cli_out` stream
// to push the content of those files to `stderr` instead of `stdout`.

function runTests (stream, className, vmTest, logTranslator) {
  var testCount = vmTest.testCount();
  var remaining = testCount;
  var deployFailure = false;

  function testResultHandler (err, result) {
    if (deployFailure || stream.isPaused()) return;

    if (err) {
      stream.push(new File({
        path: path.join(className,
          'Deployment failure.stderr'),
        contents: new Buffer(String(err))
      }));
      deployFailure = true;
      return;
    }

    var color = clc.green;

    if (result.failed) {
      color = clc.red;
    }

    // TODO: Clean this up. We want it to be
    // easy to have special log formatting for
    // particular types of events, and this is
    // a discreet logical chunk that belongs in
    // its own function or class somewhere.
    var output = result.title + '\n';
    var logPrefix = '  LOG:  ';
    var report = '';
    for (let entry of result.logs) {
      if (entry.event === '__startBlockE') {
        report += '```{' + entry.args.what + '}\n';
      } else if (entry.event === '__stopBlockE') {
        report += '```\n';
      } else if (entry.event.indexOf('log_id_') > -1 && LogTranslator.logs[entry.event].type === 'doc') {
        report += LogTranslator.format(entry) + '\n';
      } else if (entry.event.indexOf('_named_') > -1) {
        output += logPrefix + entry.args.key + ': ' + entry.args.val + '\n';
      } else if (entry.event.indexOf('log_id_') > -1) {
        output += '  ' + LogTranslator.format(entry) + '\n';
      } else {
        output += logPrefix + entry.event + '\n';

        for (let arg of _.pairs(entry.args)) {
          output += logPrefix + '  ' +
            arg[0] + ': ' + arg[1] + '\n';
        }
      }
    }
    output += '  ' + color(result.message) + '\n';
    // TODO refactor to write report stream file
    if (result.reporterPath) {
      fs.appendFileSync(result.reporterPath, report);
    }

    var file = new File({
      path: path.join(
        className,
        result.title + (result.failed ? '.stderr' : '.stdout')),
      contents: new Buffer(output)
    });
    stream.push(file);

    remaining = remaining - 1;
  }

  // Run all the tests in parallel.
  for (var i = 0; i < testCount; i++) {
    vmTest.runTest(i, testResultHandler);
  }

  // Wait until all the tests have been run.
  deasync.loopWhile(() => remaining !== 0 && !deployFailure);
}

module.exports = function (opts) {
  return through.obj(function (file, enc, cb) {
    var classes = JSON.parse(String(file.contents));

    // Skip if Test contract isn't found
    if (!('Test' in classes)) return cb();

    // Load the Test contract
    try {
      var testContract = new Contract(classes['Test']);
    } catch (err) {
      return cb(err);
    }

    // TODO - export this to pipeline setup as different streams have to be able to communicate with the chain
    var web3 = opts.web3;

    // var libraryAddressMap = {};
    // const DEFAULT_GAS = 900000000; // 900 million
    var className;

    for (className in classes) {
      // Filter classNames if a filter is present if a filter is present
      if (opts.nameFilter && !opts.nameFilter.test(className)) {
        continue;
      }

      try {
        var contract = new Contract(classes[className]);
      } catch (err) {
        return cb(err);
      }

      // way to determine if the class is a test,
      // iff it has implemented the Test interface
      if (_.intersection(contract.signatures, testContract.signatures)
           .length !== testContract.signatures.length) {
        continue;
      }
      let translator = opts.logTranslator || new LogTranslator(contract.abi);
      let vmTest = opts.vmTest || new VMTest(web3, contract, translator);
      let stream = opts.stream || this;
      runTests(stream, className, vmTest, translator);
    }
    cb();
  });
};
