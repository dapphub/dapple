"use strict"

var deasync = require("deasync");
var EVM = require('ethereumjs-lib').VM;
var LogTranslator = require('./logtranslator');
var utils = require('./utils');

const DEFAULT_GAS = 900000000;

// TODO use chain manager
 
module.exports = class VMTest {
    // Takes a web3 instance, a Contract object (from ./contract.js),
    // and a LogTranslator (from ./logTranslator.js). Will later use
    // these values to run the tests defined in the given contract.
    constructor(web3, contract, logTranslator) {
        this.web3 = web3;
        this.contract = contract;
        this.logTranslator = logTranslator;
    }

    // **TODO**: Chain snapshotting and async/parallel tests.
    // Needs to be as fast as possible.
    
    // Collects all the tests in the class definition, deploys an instance
    // of the contract for each test on the given web3 object, runs "setUp",
    // and then runs the test. The callback takes an error string as its
    // first argument and an object containing the results of each test. The
    // callback gets called once per test.
    //
    // This class should be considered unstable for now. It's likely that its
    // interface will end up changing in the future.
    run(cb) {

        if (typeof(this.web3.eth.defaultAccount) == "undefined") {
            this.web3.eth.defaultAccount = this.web3.eth.accounts[0];
        }

        cb = utils.optionalCallback(cb);

        var tests = [];
        for( var item of this.contract.abi ) {
            if( item.name && item.name.indexOf("test") == 0 ) {
                tests.push(item.name);
            }
        }

        var testsRemaining = tests.length;
        var testHandler = function(err, result) {
            testsRemaining -= 1;
            result.remaining = testsRemaining;
            cb(null, result);
        }

        var contractClass = this.web3.eth.contract(this.contract.abi);

        for( var i=0; i < tests.length; i+=1 ) {
            var testFunction = tests[i];
            var testRunner = this.testRunner(
                    contractClass, testFunction, testHandler);

            this.deploy(testRunner);
        }
    }

    deploy(cb) {
        var that = this;
        var deployCheck = function(err, txHash) {
            if (err) {
                return cb(
                    new Error("Error on contract deployment: " + err));
            }

            that.web3.eth.getTransactionReceipt(txHash, function (err, res) {
                if (!res.contractAddress) {
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

    testRunner(contractClass, testFunction, cb) {
        var that = this;

        return function (err, receipt) {
            that.runOne(contractClass.at(receipt.contractAddress),
                        testFunction, cb);
        };
    }

    runOne(contractInstance, testFunction, cb) {
        var that = this;

        var captureTestResults = function (err, txHash) {
            that.web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
                contractInstance.failed(function (err, failed) {
                    failed = failed || Boolean(err);
                    var testString = testFunction.replace(/([A-Z])/g, ' $1')
                                                 .replace(/_/g, ' ')
                                                 .toLowerCase();

                    var testResult = {
                        title: testString,
                        message: err ? err : (failed ? "Failed!" : "Passed!"),
                        logs: that.logTranslator.translateAll(receipt.logs),
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
