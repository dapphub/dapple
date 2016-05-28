/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Web3Factory = require('../lib/web3Factory.js');

describe('Web3Factory.EVM', function () {
  it.skip('returns a Web3 object with the first account as default', function (done) {
    Web3Factory.EVM((err, web3) => {
      web3.eth.accounts((err, res) => {
        assert.equal(web3.eth.defaultAccount, web3.eth.accounts[0]);
        web3.currentProvider.stop(done);
      })
    });
  });
  it.skip('allows setting a default account and balance', function (done) {
    var defaultAccount = '0x1010101010101010101010101010101010101010';
    var web3 = Web3Factory.EVM({web3: {
      account: defaultAccount, balance: 1337
    }}, (err, web3) => {
      assert.equal(web3.eth.defaultAccount, defaultAccount);
      web3.eth.getBalance(defaultAccount, function (err, balance) {
        if (err) {
          return done(err);
        }
        assert.equal(balance, 1337);
        web3.currentProvider.stop(done);
      });
    });
  });
});

describe('Web3Factory.JSONRPC', function () {
  it('allows setting a default account', function () {
    var defaultAccount = '0x1010101010101010101010101010101010101010';
    var web3 = Web3Factory.JSONRPC({web3: {
      account: defaultAccount,
      host: 'localhost',
      port: 8545
    }});
    assert.equal(web3.eth.defaultAccount, defaultAccount);
  });
});
