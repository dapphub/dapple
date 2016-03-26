/* global it, describe */
'use strict';

var assert = require('chai').assert;
var testenv = require('./testenv');
var Web3Factory = require('../lib/web3Factory.js');
var Web3Interface = require('../lib/web3Interface.js');

describe('Web3Interface', function () {
  it('uses the web3 default account to deploy contracts', function () {
    var web3 = this._web3 = Web3Factory.EVM();
    var iface = new Web3Interface({}, web3);

    web3.eth._sendTransaction = web3.eth.sendTransaction;

    var debug = testenv.golden.SOLC_OUT().contracts.Debug;
    var receipt = iface.deploy({
      abi: JSON.parse(debug.interface),
      bytecode: debug.bytecode,
      className: 'Debug',
      args: []
    });
    assert.equal(
      web3.eth.defaultAccount,
      web3.eth.getTransaction(receipt.transactionHash).from);
  });
});
