'use strict';

// TODO - temporary hack with deasync, refactor to actualy real ast structure
//
var deasync     = require('deasync');
var Web3Factory = require('./web3Factory.js');
var Contract    = require('./contract.js');
var _           = require('lodash');
var web3;


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
    
    this.local   = {};
    this.global  = {};
    this.logs    = [];
    this.success = true;
    this.Var     = Var;
    // todo - process somehow
    this.classes = opts.classes
    
    
    if (opts.web3 === 'internal') {
      web3 = Web3Factory.EVM();
    } else {
      try {
        web3 = Web3Factory.JSONRPC(opts.web3);
      } catch (e) {
        console.log('could not connect');
        return;
      }
    }
  
  }
  
  // process the ast
  run( cb ){
    cb();
  }
  
  log( string ) {
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
      this.log(`deploying ${ className }(${args.join(',')}) with value: ${txOptions.value} and gas: ${txOptions.gas}`);
      

      var Class = web3.eth.contract( this.classes[className].interface );
      var address = undefined;
      
      Class.new({ 
        data: this.classes[className].bytecode,
        from: web3.eth.coinbase 
      }, function( err, res ) {
        if( err ) console.log(err);
        if( !res.address ) return null;
        
        address = res.address;
      });

      deasync.loopWhile(function(){return !address;});

      return address;
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
