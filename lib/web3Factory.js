'use strict';

var deasync = require('deasync');
var DappleChain = require('dapple-chain');
var utils = require('./utils');
var Web3 = require('web3');
var _ = require('lodash');
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

    // Technically this number is too big to represent as an integer in
    // Javascript, but the actual value doesn't really matter and 2^256 is
    // the maximum integer size in Solidity.
    var INITIAL_WEI = Math.pow(2, 255);
    var accounts = {
      "0x9ae2d2bbf1f3bf003a671fe212236089b45609ac": '0x'+INITIAL_WEI.toString(16)
    };

    var provider = DappleChain.web3Provider(_.assign( opts || {}, {
      gasLimit: DEFAULT_GAS,
      alloc: accounts
    }));
    provider.manager.blockchain.addAccount();

    var web3 = new Web3(provider);
    web3.eth.defaultAccount = "0x9ae2d2bbf1f3bf003a671fe212236089b45609ac";



    return cb(null, web3);
  }
};
