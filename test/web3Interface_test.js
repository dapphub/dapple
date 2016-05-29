/* global it, describe */
'use strict';

var assert = require('chai').assert;
var testenv = require('./testenv');
var Web3Factory = require('../lib/web3Factory.js');
var Web3Interface = require('../lib/web3Interface.js');

describe('Web3Interface', function () {
  it('uses the web3 default account to deploy contracts', function (done) {
    Web3Factory.EVM((err, web3) => {
      if (err) return done(err);
      var iface = new Web3Interface({}, web3);

      web3.eth._sendTransaction = web3.eth.sendTransaction;

      var debug = testenv.golden.SOLC_OUT().contracts.Debug;
      var receipt = iface.deploy({
        abi: JSON.parse(debug.interface),
        bytecode: debug.bytecode,
        className: 'Debug',
        args: []
      });
      web3.eth.getTransaction(receipt.transactionHash, (err, tx) => {
        if (err) throw new Error(err);
        assert.equal(
          web3.eth.defaultAccount,
          tx.from);
        web3.currentProvider.stop(done);
      });
    });
  });
});
