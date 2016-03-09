'use strict';

var _ = require('lodash');
var LogTranslator = require('./logtranslator');
var utils = require('./utils');
var fs = require('fs');
var constants = require('../lib/constants');

// DEFAULT_GAS and DEFAULT_ENDOWMENT are arbitrary.
const DEFAULT_GAS = 900000000; // 900 million
const DEFAULT_ENDOWMENT = 10000000; // 10 million
const DEFAULT_FAIL_FUNCTION_NAMES = ['testThrow', 'testFail', 'testError'];

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
    this.reporterPath = false;

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

  static testResult (failed, title, message, logs, reporterPath) {
    // TODO: Replace with proper JSON schema validation.
    if (typeof failed === 'undefined') {
      throw new Error('testResult requires a boolean as the 1st argument.');
    }

    if (typeof title === 'undefined') {
      throw new Error('testResult requires a test name as the 2nd argument.');
    }

    if (typeof message === 'undefined') {
      message = failed ? 'Failed!' : 'Passed!';
    }

    if (typeof logs === 'undefined') {
      logs = [];
    }

    return {
      title: title,
      message: message,
      logs: logs,
      failed: failed,
      reporterPath: reporterPath
    };
  }

  // **TODO**: Chain snapshotting
  // Takes the array index of a test in `this.tests` and runs it.
  // Passes the result to the callback function once it's done.
  runTest (testIndex, cb) {
    var that = this;

    if (typeof that.web3.eth.defaultAccount === 'undefined') {
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
            cb(err, VMTest.testResult(true, 'setUp failed', err));
            return;
          }

          if (!that.reporterPath) {
            var reporterLog = that.logTranslator.translateAll(
              receipt.logs.filter(l => l.topics.length > 0 &&
                l.topics[0] === '0x2ef9ea3c32090ed6e07dce1537a1ff386ee09eb5e752f0387a46c9a90bd31642'));
            if (reporterLog.length > 0) {
              that.reporterPath = reporterLog[0].args.where;
              fs.writeFileSync(that.reporterPath, ''); // clear file
            }
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

    function createTxCheck (callback) {
      let txCheck = function (err, txHash) {
        if (err) {
          return callback(err);
        }

        that.web3.eth.getTransactionReceipt(txHash, function (err, res) {
          if (!err && !res) {
            setTimeout(txCheck.bind(this, null, txHash), 2000);
            return;
          }
          callback(err, res);
        });
      };
      return txCheck;
    }

    that.web3.eth.sendTransaction({
      from: that.web3.eth.defaultAccount,
      data: '0x' + this.contract.bytecode,
      gas: DEFAULT_GAS,
      gasLimit: DEFAULT_GAS

    }, createTxCheck(function (err, receipt) {
      if (err) {
        return cb(new Error('Contract deployment error: ' + err));
      }
      that.web3.eth.sendTransaction({
        from: that.web3.eth.defaultAccount,
        to: receipt.contractAddress,
        gas: DEFAULT_GAS,
        gasLimit: DEFAULT_GAS,
        value: DEFAULT_ENDOWMENT
      }, createTxCheck(function (err) {
        if (err) {
          return cb(new Error('Contract endowment error: ' + err));
        }
        cb(err, receipt);
      }));
    }));
  }

  // Runs the given test function on the given contract instance.
  // Passes back an object representing the results of the test
  // to the callback function.
  // TODO: Break up some of this nesting. It's really intense.
  runInstanceTestByName (contractInstance, testFunction, cb) {
    var that = this;

    // returns true, if the function is expecting an error (throw)
    var expectingAnError = new RegExp(
                DEFAULT_FAIL_FUNCTION_NAMES
                  .map(s => `^${s}`)
                  .join('|'))
                .test(testFunction);

    var testString = testFunction.replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase();

    function captureTestResults (err, txHash) {
      if (err) {
        if (expectingAnError) {
          cb(null, VMTest.testResult(false, testString));
        } else {
          cb(null, VMTest.testResult(true, testString, err));
        }
        return;
      }

      that.web3.eth.getTransactionReceipt(txHash, function (err, receipt) {
        if (err) {
          return cb(err, txHash);
        }

        contractInstance.failed(function (err, failed) {
          var message, logs;
          if (receipt === null) {
            failed = !expectingAnError;
            logs = [];
            message = failed ? 'test failed - exception thrown' : 'Passed!';
          } else {
            failed = failed || Boolean(err);

            logs = that.logTranslator.translateAll(receipt.logs);

            var eventListeners = logs.filter(log => log.event === 'eventListener');
            logs = logs.filter(log => log.event !== 'eventListener');

            // if expect an event
            if (Array.isArray(eventListeners) && eventListeners.length > 0) {
              // event must be triggered

              // each event
              eventListeners.forEach(expectedEvent => {
                if (expectedEvent.args.exact) {
                  // prepare expected logs
                  var expected = logs
                    // Get all logs which should be thrown
                    .filter(log => log.address === expectedEvent.address)
                    // make sure the order is right
                    .sort((a, b) => a.logIndex < b.logIndex);

                  // prepare observed logs
                  var observed = logs
                    // Get all logs which should be thrown
                    .filter(log => log.address === expectedEvent.args._target)
                    // make sure the order is right
                    .sort((a, b) => a.logIndex < b.logIndex);

                  // Number of events has to be the same
                  if (observed.length !== expected.length) {
                    failed = true;
                  } else {
                    // Events has to be exactly the same
                    for (var i = 0; i < observed.length; i++) {
                      // events has to be the same and in correct order
                      failed = failed || observed[i].event !== expected[i].event;
                      if (failed) break;

                      // all args has to be the same
                      _.each(observed[i].args, (value, key) => {
                        failed = failed || expected[i].args[key] !== value;
                      });
                    }
                  }

                  // generate human readable error output
                  if (failed) {
                    //
                    // format events output
                    var format = function (es) {
                      es.map((e, i) => {
                        let args = _.map(e.args, (v, k) => `${k}=${v}`).join(' ');
                        return `${i}. ${e.event} - ${args}`;
                      }).join('\n');
                    };

                    // format message
                    message += 'The expected events do not match with the ' +
                         `observed:\nexpected: ${format(expected)}\n` +
                         `observed:${format(observed)}`;
                  }
                }
              });
            }

            // failed' := not (failed iff expected)
            //
            // failed and unexpected or
            // successful and expected
            failed = (failed && !expectingAnError) ||
                     (!failed && expectingAnError);
            message = err || (failed ? 'Failed!' : 'Passed!');
          }

          cb(err, VMTest.testResult(failed, testString, message, logs, that.reporterPath));
        });
      });
    }

    contractInstance[testFunction]({
      from: that.web3.eth.defaultAccount,
      gas: DEFAULT_GAS
    }, captureTestResults);
  }
};
