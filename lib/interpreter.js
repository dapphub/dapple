'use strict';

// TODO - temporary hack with deasync, refactor to actualy real ast structure
//
var deasync     = require('deasync');
var Web3Factory = require('./web3Factory.js');
var Contract    = require('./contract.js');
var _           = require('lodash');
var web3;
const DEFAULT_GAS = 900000000;


class Var{
  constructor( value, type ){
    // todo - typecheck
    this.value = value; 
    this.type = type;
  }
  toString(){
    return this.value;
  }
}
Var.TYPE = {
  ADDRESS: ( cname ) => { return new ADDRESS( cname ) },
  STRING: 'STRING',
  NUMBER: 'NUMBER'
}

class ADDRESS {
  
  constructor( contractName ){
    this.contractName = contractName;
  }
  
  toString() {
    return 'ADDRESS';
  }

}



class Interpreter {
  
  constructor( opts ) {
    
    // global is a real subset of local
    // 
    this.local   = {};
    this.global  = {};
    this.logs    = [];
    this.success = true;
    this.Var     = Var;
    // todo - process somehow
    this.classes = opts.classes
    this.isLogging = !opts.silent;
    
    
    if (opts.web3 === 'internal') {
      web3 = Web3Factory.EVM();
    } else {
      try {
        web3 = Web3Factory.JSONRPC(opts);
      } catch (e) {
        console.log('could not connect');
        return;
      }
    }
  
  }
  
  // process the ast
  run( cb ){
    var tasks = [];
    
    // _.each(this.local, ( v, name ) => {
    //   if( typeof v.value === 'function' ) {
    //     tasks.push(function(){
    //       v.value( function( err, res ){
    //         if( typeof err === 'function' ) cb( err );
    //         v.value = res;
    //       })
    //     })
    //   }
    // })
    //
    // async.series( tasks, function( err, res ) {
    //   if( typeof err === 'function' ) cb( err );
    //   
      cb();
    // });
    
  }
  
  log( string ) {
    if( this.isLogging ) {
      process.stdout.write(string);
    }
    this.logs.push(string);
  }
  
  assign( key, value ) {
    
    if( key in this.local ) {
      this.success = false;
      this.log(`ERROR: ${key} is already declared in local env!`);
    } else {
      this.local[key] = value;
    }

    return this.success;
  
  }
  
  export( key ) {

    if( key in this.global ) {
      this.log(`ERROR: ${key} is already declared in global env!`);
      this.success = false;
    } else if( !(key in this.local) ) {
      this.log(`ERROR: ${key} is not declared in local env!`);
      this.success = false;
    } else {
      this.global[key] = this.local[key];
    }

  }


  deploy( className, args, txOptions ) {
   
    if( className in this.classes ) {
      // this.log(`deploying ${ className }(${args.join(',')}) with value: ${txOptions.value} and gas: ${txOptions.gas}`);
      
      var self = this;
      var numConfirmations = 4;
      var timeoutCounter = 50;
      var address;
      var filter;
      var transactionHash;
      
      var async = function(cb) {
        
        var Class = web3.eth.contract( self.classes[className].interface );
        
        filter = web3.eth.filter('latest', function( err, result ){
          if( err ) cb( err );

          if( typeof address === 'undefined' && timeoutCounter-- >= 0 ) {

            if( transactionHash ) {
              web3.eth.getTransactionReceipt(transactionHash, function ( err, receipt ) {
                if( err ) cb(err);
                if( !receipt || !receipt.contractAddress ) return null;

                // this.log(`deploying ${ className }(${args.join(',')}) with value: ${txOptions.value} and gas: ${txOptions.gas}`);
                self.log(`DEPLOYED: ${ className } = ${receipt.contractAddress}\n`);
                self.log(`GAS COST: ${ parseInt(receipt.gasUsed) } for "new ${ className }"\n`)
                self.log(`Waiting for ${ numConfirmations } confirmations: `)

                address = receipt.contractAddress;

              });
            }

          } else if( numConfirmations-- <= 0) { // Address found
            filter.stopWatching();
            web3.eth.getCode(address, function( err, res ) {
              if( err ) cb( err );
              if( typeof res === 'string' && res.length > 2 ) {
                self.log(' confirmed!');
                cb( null, address );
              } else {
                cb( new Error("could not verify contract") );
              }


            })

          } else {
            self.log('.');
          }
        });
        
        web3.eth.sendTransaction({
          from: web3.eth.defaultAccount,
          data: '0x' + self.classes[className].bytecode
        }, function( err, txHash ) {
          
          transactionHash = txHash;
          
        });
        

        
      }
      
      var syncDeploy = deasync( async );
      var address = syncDeploy();


      return new Var( address, Var.TYPE.ADDRESS( className ) );
    } else {
      this.success = false;
      return null;
    }
    
  }

  call( varName, functionName, args, txOptions ) {
    // 
    // todo - assertion and detailed error handling
    if( this.local[varName] instanceof Var && this.local[varName].type instanceof ADDRESS ) {
      var address = this.local[varName].value;
      this.log(`calling ${address} ${functionName} ${args} with value: ${txOptions.value} and gas: ${txOptions.gas}`);
    } else {
      this.log(`ERROR: ${varName} is not a valid address.`);
    }
    
  }

}

module.exports = Interpreter;
