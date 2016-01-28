'use strict';

var _ = require('lodash');
var LogTranslator = require('./logtranslator');
var utils = require('./utils');
var fs = require('fs');
var constants = require('../lib/constants');

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
  constructor (web3, contract, logTranslator) {
    this.web3 = web3;
    this.contract = contract;
    this.logTranslator = logTranslator;

    if (!logTranslator) {
      this.logTranslator = new LogTranslator(contract.abi);
    }

    this.tests = [];
    for (var item of this.contract.abi) {
      if (item.name && item.name.indexOf('test') === 0) {
        this.tests.push(item.name);
      }
    }
  }

  static writeTestTemplate (className) {
    var template = _.template(constants.SOL_CONTRACT_TEMPLATE());
    var contract = template({
      className: className
    });

    fs.writeFileSync(utils.classToFilename(className), contract);

    var testClassName = className + 'Test';
    var testTemplate = _.template(constants.SOL_CONTRACT_TEST_TEMPLATE());
    var test = testTemplate({
      className: className,
      testClassName: testClassName
    });

    fs.writeFileSync(utils.classToFilename(testClassName), test);
  }

  // **TODO**: Chain snapshotting
  // Takes the array index of a test in `this.tests` and runs it.
  // Passes the result to the callback function once it's done.
  runTest (testIndex, cb) {
    var that = this;

    if (typeof (that.web3.eth.defaultAccount) === 'undefined') {
      that.web3.eth.defaultAccount = that.web3.eth.accounts[0];
    }

    cb = utils.optionalCallback(cb);

    var contractClass = that.web3.eth.contract(that.contract.abi);

    var runTestOn = function (contract) {
      that.runInstanceTestByName(contract, that.tests[testIndex], cb);
    };

    var setUpHandlerFor = function (contract) {
      return function (err, txHash) {
        if (err) {
          return cb(err);
        }

        that.web3.eth.getTransactionReceipt(txHash, function (err, receipt) {
          if (receipt === null && err === null) {
            err = 'setUp failed - exception thrown';
          }

          if (err) {
            var testResult = {
              title: 'setUp failed',
              message: err,
              logs: [],
              failed: true
            };
            cb(err, testResult);
            return;
          }

          runTestOn(contract);
        });
      };
    };

    var getCodeHandlerFor = function (address) {
      return function (err, code) {
        if (err) {
          return cb(err);
        }

        if (code === '0x') {
          return cb('Contract failed to deploy.');
        }

        var contract = contractClass.at(address);

        if (contract.setUp !== undefined) {
          contract.setUp(setUpHandlerFor(contract));
        } else {
          runTestOn(contract);
        }
      };
    };

    var deployHandler = function (err, receipt) {
      if (err) {
        return cb(err);
      }
      that.web3.eth.getCode(receipt.contractAddress,
        getCodeHandlerFor(receipt.contractAddress));
    };

    that.deploy(deployHandler);
  }

  testCount () {
    return this.tests.length;
  }

  // Deploys the VMTest's contract to its blockchain.
  deploy (cb) {
    var that = this;
    var deployCheck = function (err, txHash) {
      if (err) {
        return cb(
          new Error('Contract deployment failure: ' + err));
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
      data: '0x' + this.contract.bytecode,
      gas: DEFAULT_GAS,
      gasLimit: DEFAULT_GAS

    }, deployCheck);
  }

  // Runs the given test function on the given contract instance.
  // Passes back an object representing the results of the test
  // to the callback function.
  runInstanceTestByName (contractInstance, testFunction, cb) {
    var that = this;

    var captureTestResults = function (err, txHash) {
      if (err) {
        return cb(err, txHash);
      }

      that.web3.eth.getTransactionReceipt(txHash, function (err, receipt) {
        if (err) {
          return cb(err, txHash);
        }

        contractInstance.failed(function (err, failed) {
          var logs;
          var message = 'Passed!';
          if (receipt == null) {
            failed = true;
            logs = [];
            message = 'Failed! Exception thrown.';
          } else {
            failed = failed || Boolean(err);
            message = err || 'Failed!';
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

    contractInstance[testFunction]({
      from: that.web3.eth.defaultAccount,
      gas: DEFAULT_GAS

    }, captureTestResults);
  }
};
