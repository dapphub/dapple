'use strict';

var _ = require('lodash');
var clc = require("cli-color-tty")(true);
var Contract = require("../contract");
var deasync = require("deasync");
var File = require('vinyl');
var LogTranslator = require('../logtranslator');
var path = require("path");
var through = require('through2');
var VMTest = require('../vmtest');
var Web3Factory = require("../web3Factory");

// This stream takes the output of either the build stream or pipeline (they
// produce the same output) and returns a stream of files containing the output
// of running each `Test` contract. A special, non-standard `error` flag is set
// on File objects representing failed tests. This allows the `cli_out` stream
// to push the content of those files to `stderr` instead of `stdout`.
module.exports = function (opts) {
    return through.obj(function (file, enc, cb) {
        var that = this;
        var classes = JSON.parse(String(file.contents));

        for (var className in classes) {
            // **TODO**: See if there's a more robust
            // way to determine if the class is a test.
            if (!/^.+Test$/.test(className)) {
                continue;
            }

            try {
                var contract = new Contract(classes[className]);

            } catch(err) {
                return cb(err);
            }

            var web3;
            if (opts.web3 == 'internal') {
                web3 = Web3Factory.EVM();
            } else {
                try {
                    web3 = Web3Factory.JSONRPC(opts.web3);
                } catch (e) {
                    this.push(new File({
                        path: "JSON-RPC Connection/Can't connect.stderr",
                        contents: new Buffer(String(e))
                    }));
                    cb();
                    return;
                }
            }

            // **TODO**: Run all tests in chain forks at the same height.
            var remaining = -1;
            var logTranslator = new LogTranslator(contract.abi);
            var vmtest = new VMTest(web3, contract, logTranslator);
            var testCount = vmtest.testCount();
            var remaining = testCount;

            var logTestResult = function(err, result) {
                var color = clc.green;

                if (result.failed) {
                    color = clc.red;
                }

                // TODO: Clean this up. We want it to be
                // easy to have special log formatting for
                // particular types of events, and this is
                // a discreet logical chunk that belongs in
                // its own function or class somewhere.
                var output = result.title + "\n";
                var logPrefix = "  LOG:  "

                for (let entry of result.logs) {
                    output += logPrefix + entry.event + "\n";

                    for (let arg of _.pairs(entry.args)) {
                        output += logPrefix + "  "
                                  + arg[0] + ": " + arg[1] + "\n";
                    }
                }
                output += "  " + color(result.message) + "\n";

                var file = new File({
                    path: path.join(
                        className,
                        result.title + (result.failed ? '.stderr' : '.stdout')),
                    contents: new Buffer(output)
                });
                that.push(file);
                remaining = remaining - 1;
            };

            // Run all the tests in parallel.
            for (var i = 0; i < testCount; i++) {
                vmtest.runTest(i, logTestResult);
            }

            // Wait until all the tests have been run.
            deasync.loopWhile(() => remaining != 0);
        }
        cb();
    });
};
