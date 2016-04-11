'use strict';

var deasync = require('deasync');
var EtherSim = require('ethersim');
var utils = require('./utils');
var Web3 = require('web3');
const DEFAULT_GAS = 900000000;

module.exports = {
  JSONRPC: function (opts, cb) {
    var connection_string = 'http://localhost:8545';

    if (typeof (opts) === 'function' && typeof (cb) === 'undefined') {
      cb = opts;
    }

    if (typeof (opts) === 'object' && 'web3' in opts) {
      if ('connection_string' in opts.web3) {
        connection_string = opts.web3.connection_string;
      } else {
        var host = opts.web3.host;
        if (!/^https?:\/\//.test(host.toLowerCase())) {
          host = 'http://' + host;
        }
        connection_string = host + ':' + opts.web3.port;
      }
    }

    if (typeof (opts) === 'string') {
      connection_string = opts;
    }

    cb = utils.optionalCallback(cb);

    var web3 = new Web3(new Web3.providers.HttpProvider(connection_string));
    web3.eth.defaultAccount = undefined;
    if (typeof opts === 'object' &&
        'web3' in opts &&
        'account' in opts.web3) {
      web3.eth.defaultAccount = opts.web3.account;
    }

    try {
      if (web3.eth.defaultAccount === undefined) {
        web3.eth.defaultAccount = web3.eth.coinbase || web3.eth.accounts[0];
      }

      if (web3.eth.defaultAccount === undefined) {
        return cb(new Error('Could not find a default account to use!'));
      }
    } catch (e) {
      return cb(String(e));
    }

    return cb(null, web3);
  },

  EVM: function (opts, cb) {
    if (typeof (opts) === 'function' && typeof (cb) === 'undefined') {
      cb = opts;
    }
    cb = utils.optionalCallback(cb);

    var provider = EtherSim.web3Provider();
    provider.manager.blockchain.setGasLimit(DEFAULT_GAS);

    // Set a no-op logger. We're not interested in EtherSim's output ATM.
    provider.manager.blockchain.setLogger({
      log: function () {},
      error: function () {}
    });

    var web3 = new Web3(provider);

    // Technically this number is too big to represent as an integer in
    // Javascript, but the actual value doesn't really matter and 2^256 is
    // the maximum integer size in Solidity.
    var INITIAL_WEI = Math.pow(2, 256);

    if (typeof (opts) === 'object' &&
        'web3' in opts &&
        'balance' in opts.web3) {
      INITIAL_WEI = opts.web3.balance;
    }

    if (typeof (opts) === 'object' &&
        'web3' in opts &&
        'account' in opts.web3) {
      deasync(function (cb) {
        web3.eth.defaultAccount = opts.web3.account;
        provider.manager.blockchain.setBalance(
            web3.eth.defaultAccount, INITIAL_WEI, cb);
      })();
    } else {
      // Create a tester account and give it an arbitrary amount of ether.
      // Any amount necessary to run all the tests should be fine.
      deasync(function (cb) {
        provider.manager.blockchain.addAccount(function () {
          web3.eth.defaultAccount = web3.eth.accounts[0];
          provider.manager.blockchain.setBalance(
            web3.eth.defaultAccount, INITIAL_WEI, cb);
        });
      })();
    }

    return cb(null, web3);
  }
};
