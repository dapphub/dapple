'use strict';

var DappleChain = require('dapple-chain');
var utils = require('./utils');
var Web3 = require('web3');

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

    var provider = DappleChain.web3Provider(opts);
    var web3;
    provider.manager.blockchain.setGasLimit(900000000);
    web3 = new Web3(provider);
    web3.eth.defaultAccount = provider.manager.blockchain.defaultAccount();
    cb(null, web3);
  }
};
