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

    // Runs the given test function on the given contract instance.
    // Passes back an object representing the results of the test
    // to the callback function.
    runInstanceTestByName(contractInstance, testFunction, cb) {
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
