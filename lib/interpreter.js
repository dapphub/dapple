'use strict';

// TODO - temporary hack with deasync, refactor to actualy real ast structure
//
var deasync       = require('deasync');
var Web3Interface = require('./web3Interface.js');
var Contract      = require('./contract.js');
var _             = require('lodash');
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
    
    // global is a real subset of local
    // 
    this.local   = {};
    this.global  = {};
    this.logs    = [];
    this.success = true;
    this.Var     = Var;
    // todo - process somehow
    this.classes = opts.classes;
    this.isLogging = !opts.silent;
    this.workspace = opts.workspace;
    this.env       = opts.env;
    
    
    // Ensure that classes.interfaces is not a string
    _.each( this.classes, ( classObject, className ) => {
      if( typeof classObject.interface === 'string' ) {
        classObject.interface = JSON.parse(classObject.interface);
      }
    });
    
    this.web3Interface = new Web3Interface( { web3: opts.web3 } );
    
    this.log('Connected to RPC client, block height is ' + this.web3Interface._web3.eth.blockNumber);
   
  }
  
  // process the ast
  run( cb ){
    var tasks = [];
    
    var self = this;
    
    if( self.workspace ) {
      _.each( this.global, ( variable, name ) => {
        // if( this.env !== 'default' ) {
          self.workspace.addObject( self.env, name, variable.type.contractName, variable.value )
        // }
      });
      this.workspace.writeDappfile();
    }
    
    cb();
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
  
  serialize ( args ) {
    var self = this;
    return args.map( atom => {
      // TODO - test with atoms
      //
      // reference
      if( typeof atom === 'string' ) {
        return self.local[atom].value;
      }
      // atom
      return atom.value;
    });
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
      
      var numConfirmations = 1;
      
      var _args = this.serialize( args );
      
      var receipt = this.web3Interface.deploy({
        className,
        args,
        abi: this.classes[className].interface,
        bytecode: this.classes[className].bytecode,
        args: _args
      });
      
      var address = receipt.contractAddress;
      
      this.log(`DEPLOYED: ${ className } = ${ address }\n`);
      this.log(`GAS COST: ${ parseInt(receipt.gasUsed) } for "new ${ className }"\n`)
      
      this.web3Interface.waitForBlock( receipt.blockNumber + numConfirmations );
      
      if( this.web3Interface.confirmCode( address ) ) {
        this.log(`CONFIRMED deploy after ${numConfirmations} blocks!\n`);
      }
      
      return new Var( receipt.contractAddress, Var.TYPE.ADDRESS( className ) );
      
    } else {
      this.success = false;
      return null;
    }
    
  }

  call( varName, fName, _args, txOptions ) {
    
    // TODO - assertion and detailed error handling
    if( this.local[varName] instanceof Var && this.local[varName].type instanceof ADDRESS ) {
      
      var className = this.local[varName].type.contractName;
      var address = this.local[varName].value;
      var abi = this.classes[className].interface;
      
      // TODO - get function interface by signature and not by name
      var functionInterface = this.classes[className].interface.filter( i => {
        return i.name === fName
      })[0];
      if( !functionInterface ) throw new Error(`${fName} is not a valid function of class ${className}`);
      
      var constant = functionInterface.constant;
      var args = this.serialize(_args);
      
      var result = this.web3Interface.call({ args, fName, constant, abi, address });
      
      // REPORT
      this.log(`CALLED: ${ varName }.${ fName }(${args.join(',')})\n`);
      if( constant ) {
        this.log(`RETURN: ${result}\n`);
      } else {
        this.log(`GAS COST: ${ parseInt(result.gasUsed) } for "call ${ className }.${ fName }(${args.join(',')})"\n`)
      }
      
    } else {
      this.log(`ERROR: ${varName} is not a valid address.`);
    }
    
  }

}

module.exports = Interpreter;
