"use strict"

var deasync = require("deasync");
var EVM = require('ethereumjs-lib').VM;
var LogTranslator = require('./logtranslator');
var utils = require('./utils');
var fs = require('fs')

const DEFAULT_GAS = 900000000;

// TODO use chain manager
// TODO Use transaction manager. Retrying transactions like we do at present
// works, but it's kludgy and unmaintainable. There needs to be a clean
// abstraction around it because we're going to need to re-use those techniques
// elsewhere.

module.exports = class VMTest {
    // Takes a web3 instance, a Contract object (from ./contract.js),
    // and a LogTranslator (from ./logTranslator.js). Will later use
    // these values to run the tests defined in the given contract.
    constructor(web3, contract, logTranslator) {
        this.web3 = web3;
        this.contract = contract;
        this.logTranslator = logTranslator;

        if (!logTranslator) {
            this.logTranslator = new LogTranslator(contract.abi);
        }

        this.tests = [];
        for( var item of this.contract.abi ) {
            if( item.name && item.name.indexOf("test") == 0 ) {
                this.tests.push(item.name);
            }
        }
    }

    static writeTestTemplate(className) {
      var source = "\
contract " + className + " {\n\
}\n\
";
      fs.writeFileSync(utils.classToFilename(className), source);

      var testClassName = className + "Test";
      source = "\
contract " + testClassName + " is Test {\n\
    " + className + " target;\n\
    function setUp() {\n\
        target = new " + className + "();\n\
    }\n\
    function test___ () {\n\
    }\n\
}\n\
";
      fs.writeFileSync(utils.classToFilename(testClassName), source);
    }

    // **TODO**: Chain snapshotting
    // Takes the array index of a test in `this.tests` and runs it.
    // Passes the result to the callback function once it's done.
    runTest(testIndex, cb) {
        var that = this;

        if (typeof(that.web3.eth.defaultAccount) == "undefined") {
            that.web3.eth.defaultAccount = that.web3.eth.accounts[0];
        }

        cb = utils.optionalCallback(cb);

        var contractClass = that.web3.eth.contract(that.contract.abi);

        that.deploy(function (err, receipt) {
            if (err) {
                return cb(err);
            }

            that.runInstanceTestByName(
                contractClass.at(receipt.contractAddress),
                that.tests[testIndex], cb);
        });
    }

    testCount() {
        return this.tests.length;
    }

    // Deploys the VMTest's contract to its blockchain.
    deploy(cb) {
        var that = this;
        var deployCheck = function(err, txHash) {
            if (err) {
                return cb(
                    new Error("Contract deployment failure: " + err));
            }

            that.web3.eth.getTransactionReceipt(txHash, function (err, res) {
                if (!err && !res) {
                    setTimeout(deployCheck.bind(this, null, txHash), 2000);
                    return;
                }
                cb(err, res);
            });
        };

        that.web3.eth.sendTransaction({
            from: that.web3.eth.defaultAccount,
            data: "0x" + this.contract.bytecode,
            gas: DEFAULT_GAS,
            gasLimit: DEFAULT_GAS

        }, deployCheck);
    }

    // Runs the given test function on the given contract instance.
    // Passes back an object representing the results of the test
    // to the callback function.
    runInstanceTestByName(contractInstance, testFunction, cb) {
        var that = this;

        var captureTestResults = function (err, txHash) {
            that.web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
                contractInstance.failed(function (err, failed) {
                    var logs;
                    var message;
                    if( receipt == null ) {
                        failed = true;
                        logs = [];
                        message = "Transaction failed - no logs available.";
                    } else {
                        failed = failed || Boolean(err);
                        message = err ? err : (failed ? "Failed!" : "Passed!");
                        logs = that.logTranslator.translateAll(receipt.logs);
                    }

                    var testString = testFunction.replace(/([A-Z])/g, ' $1')
                                                 .replace(/_/g, ' ')
                                                 .toLowerCase();

                    var testResult = {
                        title: testString,
                        message: message,
                        logs: logs,
                        failed: failed
                    };
                    cb(err, testResult);
                });
            });
        };

        if( contractInstance.setUp !== undefined ) {
            contractInstance.setUp(function () {}); // No-op function is
                                            // a workaround for a
                                            // bug that needs to
                                            // be properly handled.
                                            // (TODO)
        }

        contractInstance[testFunction]({
            from: that.web3.eth.defaultAccount,
            gas: DEFAULT_GAS

        }, captureTestResults);
    }
}
