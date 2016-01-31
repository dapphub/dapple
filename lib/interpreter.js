'use strict';

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
    
    this.local = {};
    this.global = {};
    this.logs = [];
    this.success = true;
    this.Var = Var;
    this.classes = opts.classes 
  
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
      return new Var( '0x0123', Var.TYPE.ADDRESS( className ) );
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
