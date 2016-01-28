/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Contract = require('../lib/contract.js');
var fs = require('fs');
var Web3Factory = require('../lib/web3Factory.js');
var VMTest = require('../lib/vmtest.js');

describe('VMTest', function () {
  var mock = JSON.parse(
    String(fs.readFileSync('./test/_fixtures/mocktest.json')));

  it('parses Contract objects for test functions', function () {
    var contract = Contract.create(mock.contracts.Pass);
    var vmtest = new VMTest(Web3Factory.EVM(), contract);
    assert.equal(1, vmtest.testCount(), 'expected 1 test function');
  });

  it('runs tests by their indices', function (done) {
    var contract = Contract.create(mock.contracts.Pass);
    var vmtest = new VMTest(Web3Factory.EVM(), contract);
    vmtest.runTest(0, function (err, result) {
      assert.notOk(err);
      assert.notOk(result.failed, 'test failed, should have passed');
      assert.equal(0, result.logs.length);
      done();
    });
  });

  it('returns log results', function (done) {
    var contract = Contract.create(mock.contracts.Fail);
    var vmtest = new VMTest(Web3Factory.EVM(), contract);
    vmtest.runTest(0, function (err, result) {
      assert.notOk(err);
      assert.ok(result.failed, 'test passed, should have failed');
      assert.equal(1, result.logs.length);
      done();
    });
  });
});
