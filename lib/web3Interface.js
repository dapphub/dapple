'use strict';

// TODO - refactor this, maybe with promisses the structure gets simpler

var Web3Factory = require('./web3Factory.js');
var deasync = require('deasync');

const DEFAULT_GAS = 3141592;

class Web3Interface {

  constructor (opts, web3) {
    this._gas = DEFAULT_GAS;

    if (web3) {
      this._web3 = web3;
    } else if (opts.web3 === 'internal') {
      this._web3 = Web3Factory.EVM();
    } else {
      this._web3 = Web3Factory.JSONRPC(opts);
      var block = this._web3.eth.getBlock('latest');
      this._gas = block.gasLimit;
    }
    this._block0 = this._web3.eth.getBlock('0');
    // this._tasks = {};
  }

  // returns an address of a deployed contract given a transaction hash
  getDeployReceiptSync (txHash) {
    var self = this;
    var fSync = deasync(function (cb) {
      self._web3.eth.getTransactionReceipt(txHash, function (err, receipt) {
        if (err) {
          cb(err);
        }
        if (!receipt || !receipt.contractAddress) return null;
        cb(null, receipt);
      });
    });
    return fSync();
  }

  waitForBlock (blockNumber) {
    var self = this;
    var done = false;
    var _filter = this._web3.eth.filter('latest', function (err, result) {
      if (err) {
        _filter.stopWatching();
        throw err;
      }
      done = self._web3.eth.blockNumber > blockNumber;
    });
    deasync.loopWhile(function () { return !done; });
    _filter.stopWatching();
    return true;
  }

  getCode (address) {
    var self = this;
    var fSync = deasync(function (cb) {
      self._web3.eth.getCode(address, function (err, res) {
        if (err) {
          return cb(err);
        }
        cb(null, res);
      });
    });
    return fSync();
  }

  confirmCode (address) {
    var code = this.getCode(address);

    if (typeof code === 'string' && code.length > 2) {
      return true;
    }
    throw new Error('could not verify contract');
  }

  // deploys a contract async
  //
  // opts.abi:  aplication binary interface
  // opts.bytecode : contract bytecode
  // opts.className: Class Name
  // opts.args: constructor args
  //
  deploy (opts) {
    // TODO - check wih json schema
    var Class = this._web3.eth.contract(opts.abi);
    // Concates the constructor arguments to the binary data for the deploy
    // TODO - test with atoms
    // TODO - refactor the arg mapping outside of deploy
    var args = opts.args.concat([ { data: opts.bytecode } ]);
    // TODO - typecheck parametery against the abi
    var data = Class.new.getData.apply(this, args);
    var address = this._web3.eth.defaultAccount;
    var receipt;
    var txHash;
    var self = this;
    var _filter = this._web3.eth.filter('latest', function (err, result) {
      if (err) throw err;
      if (!txHash) return null;
      // var _receipt = self.getDeployReceiptSync( txHash );
      self._web3.eth.getTransactionReceipt(txHash, function (err, _receipt) {
        if (err) {
          _filter.stopWatching();
          throw err;
        }
        if (!_receipt || !_receipt.contractAddress) return null;
        _filter.stopWatching();

        if (/^0x0*$/.test(self._web3.eth.getCode(_receipt.contractAddress))) {
          throw new Error(`Could not deploy contract ${opts.className}. ` +
                          `Transaction went through, but there is no code ` +
                          `at contract address ${_receipt.contractAddress}`);
        }
        receipt = _receipt;
      });
    });
    // console.log(data);
    this._web3.eth.sendTransaction({
      from: address,
      data: data,
      gas: opts.gas || this._gas
    // gas: 895807
    }, function (err, _txHash) {
      if (err) {
        _filter.stopWatching();
        throw err;
      }
      // Check if the transaction got rejected
      if ((/^0x0*$/).test(_txHash)) {
        _filter.stopWatching();
        throw new Error(`Could not deploy contract ${opts.className}, ` +
                        `maybe the gas is too low.`);
      }
      txHash = _txHash;
    });
    deasync.loopWhile(function () { return typeof receipt !== 'object'; });
    return receipt;
  }

  // Calls a function
  // opts.constant: if a function is to be called constant
  // opts.fName: function Name
  // opts.args: arguments to giv during the call
  // opts.abi
  // opts.address
  call (opts) {
    var Class = this._web3.eth.contract(opts.abi);
    var object = Class.at(opts.address);
    var txHash;
    var result;
    var self = this;
    if (!opts.constant) {
      var _filter = this._web3.eth.filter('latest', function (err, res) {
        if (err) throw err;
        if (!txHash) return null;
        self._web3.eth.getTransactionReceipt(txHash, function (err, _receipt) {
          if (err) throw err;
          if (!_receipt) return null;
          result = _receipt;
        });
      });
    }
    object[opts.fName]
    .apply(this,
           opts.args.concat([
             opts.txOptions || {},
             function (err, res) {
               if (err) throw err;
               if (opts.constant) {
                 result = res;
               } else {
                 txHash = res;
               }
             }]));
    deasync.loopWhile(function () { return typeof result === 'undefined'; });
    if (typeof _filter === 'object') _filter.stopWatching();
    return result;
  }
}

module.exports = Web3Interface;
