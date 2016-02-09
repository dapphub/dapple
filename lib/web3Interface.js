'use strict';

// TODO - refactor this, maybe with promisses the structure gets simpler

var Web3Factory = require('./web3Factory.js');
var async = require('async');
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
    this._tasks = {};
    
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
    var fSync = deasync( function( cb ) {
      self._tasks['wait'+blockNumber] = function() {
        if( self._web3.eth.blockNumber > blockNumber  ) cb( null, true );
      };
    });
    
    return fSync();
  }

  confirmCode ( address ) {
    var self = this;
    var fSync = deasync(function( cb ) {
      self._web3.eth.getCode(address, function( err, res ) {
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


  _runFilter (){
    
    // stop if filter already exists
    if( typeof this.filter === 'object' ) return null;
    
    var self = this;
    this._filter = this._web3.eth.filter('latest', function( err, result ){
      console.log('.');
      async.parallel( self._tasks );
    });
   
  }
  
  _stopFilter ( _id ) {
    
    // Stop filter if no task id is given
    if( typeof _id !== 'string' ) {
      this._filter.stopWatching();
      this._filter = null;
    }
    
    // remove taskId
    delete this._tasks[_id];
    
    // if no task, stop watching
    if( Object.keys(this._tasks).length === 0 ) {
      this._filter.stopWatching();
      this._filter = null;
    }
    
  }
  
  // deploys a contract async
  // 
  // opts.abi:  aplication binary interface
  // opts.data: contract bytecode
  // opts.className: Class Name 
  // 
  deploy( opts ) {
    

    var self = this;
    var fSync = deasync( function(cb) {

      // TODO - check wih json schema
      var Class = self._web3.eth.contract( opts.abi );
      
      // Concates the constructor arguments to the binary data for the deploy
      // TODO - test with atoms
      // TODO - refactor the arg mapping outside of deploy
      var args = opts.args.map( atom => {
        // reference
        if( typeof atom === 'string' ) {
          return self.local[atom].value;
        }
        // atom
        return atom;
      }).concat( [ { data:opts.data } ])
      
      // TODO - typecheck parametery against the abi
      var data = Class.new.getData.apply( self, args );
      var address = self._web3.eth.defaultAccount;
      
      
      
      self._web3.eth.sendTransaction({
        from: address,
        data: data,
        gas: self._gas
      }, function( err, txHash ) {
        
        if( err ) {
          // self._stopFilter();
          cb(err);
        }
        
        // Check if the transaction got rejected
        if( (/^0x0+$/).test( txHash ) ) {
          // self._stopFilter();
          cb( new Error(`Could not deploy contract ${opts.className}, maybe the gas is to low.`) )
        }
        
        self._tasks[ txHash ] = function() {
          var receipt = self.getDeployReceiptSync( txHash );
          
          if( typeof receipt.contractAddress === 'string' ) {
            self._stopFilter( txHash );
            // TODO - verify code and confirm after x transactions
            callback( null, receipt );
          }
        }
        
      });
      
    });
    
    var res = fSync();
    console.log(res);
    
    return res;
  }
  
  // // waits untill block `opts.blockNumber` and confirms wether 
  // // `opts.address` holds code
  // confirmCode( opts ) {
  //   
  //   
  //   return true;
  //   
  // }
  
  // 
  // opts.abi:  aplication binary interface
  // opts.data: contract bytecode
  // opts.className: Class Name 
  deploySync (opts) {
    
    var deploySync = deasync( this.deploy );
    
    var report = deploySync( opts );
    
  }

}

module.exports = Web3Interface;



