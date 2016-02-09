'use strict';

// TODO - refactor this, maybe with promisses the structure gets simpler

var Web3Factory = require('./web3Factory.js');
var deasync       = require('deasync');

const DEFAULT_GAS = 3141592;

class Web3Interface {
  
  constructor ( opts ) {
    
    if (opts.web3 === 'internal') {
      
      this._web3 = Web3Factory.EVM();
      this._gas = DEFAULT_GAS;
      
    } else {
      
      this._web3 = Web3Factory.JSONRPC(opts);
      var block = this._web3.eth.getBlock('latest');
      this._gas = block.gasLimit;
      
    }
    
    this._block0 = this._web3.eth.getBlock('0');
    // this._tasks = {};
    
  }
  

  // returns an address of a deployed contract given a transaction hash
  getDeployReceiptSync ( txHash ) {
    var self = this;
    var fSync = deasync(function( cb ) {
      self._web3.eth.getTransactionReceipt( txHash, function ( err, receipt ) {
        if( err ) {
          cb(err);
        }
        if( !receipt || !receipt.contractAddress ) return null;
        cb( null, receipt );
      });
    });
    
    return fSync();
  }
  
  waitForBlock( blockNumber ) {
    var self = this;
    var done = false;
    console.log('wait');
    
    var _filter = this._web3.eth.filter('latest', function( err, result ){
      if(err) {
        _filter.stopWatching();
        throw err;
      }
      
      console.log(self._web3.eth.blockNumber > blockNumber);
      done = self._web3.eth.blockNumber > blockNumber;
    });
  
    deasync.loopWhile( function() { return !done; });
    _filter.stopWatching();

    return true;
  }

  confirmCode ( address ) {
    var self = this;
    var fSync = deasync(function( cb ) {
      self._web3.eth.getCode(address, function( err, res ) {
        console.log(res);
        if( err ) cb( err );
        if( typeof res === 'string' && res.length > 2 ) {
          cb( null, true );
        } else {
          cb( new Error("could not verify contract") );
        }
      })
    });
    
    return fSync( );
  }
  
  // deploys a contract async
  // 
  // opts.abi:  aplication binary interface
  // opts.data: contract bytecode
  // opts.className: Class Name 
  // 
  deploy( opts ) {
    
    // TODO - check wih json schema
    var Class = this._web3.eth.contract( opts.abi );
    
    // Concates the constructor arguments to the binary data for the deploy
    // TODO - test with atoms
    // TODO - refactor the arg mapping outside of deploy
    var args = opts.args.concat( [ { data:opts.bytecode } ])
    
    // console.log(args);
    // TODO - typecheck parametery against the abi
    var data = Class.new.getData.apply( this, args );
    var address = this._web3.eth.defaultAccount;
    var receipt;
    var txHash;
    
    
    var self = this;
    var _filter = this._web3.eth.filter('latest', function( err, result ){
      console.log('.');
      
      if( !txHash ) return null;
      
      // var _receipt = self.getDeployReceiptSync( txHash );
      
      self._web3.eth.getTransactionReceipt( txHash, function ( err, _receipt ) {
        if( err ) {
          _filter.stopWatching();
          throw err;
        }
        if( !_receipt || !_receipt.contractAddress ) return null;
        
        _filter.stopWatching();
        receipt = _receipt
      });
      
    });
    
    // console.log(data);
    this._web3.eth.sendTransaction({
      from: address,
      data: data,
      gas: this._gas
    }, function( err, _txHash ) {
      
      if( err ) {
        _filter.stopWatching();
        throw err;
      }
      
      // Check if the transaction got rejected
      if( (/^0x0+$/).test( _txHash ) ) {
        _filter.stopWatching();
        throw new Error(`Could not deploy contract ${opts.className}, maybe the gas is to low.`);
      }
      
      txHash = _txHash;
      
    });
    
    deasync.loopWhile( function() { return typeof receipt !== 'object'; });
    
    return receipt;
  }
  

}

module.exports = Web3Interface;



