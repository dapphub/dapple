'use strict';
var jison = require('jison');
var fs = require('fs');

var bnf = fs.readFileSync('./specs/dsl.y','utf8');

var parser = new jison.Parser(bnf);

var logs = [];

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
  ADDRESS: 'ADDRESS',
  STRING: 'STRING',
  NUMBER: 'NUMBER'
}

parser.yy.Var = Var;

parser.yy.classes = {
  "Contract": { "name": "Contract" }
}
parser.yy.localenv = {}; // init if not passed
parser.yy.globalenv = {}; // init if not passed
parser.yy.log = function( log ) {
  logs.push( log );
}
parser.yy.getLogs = function() {
  return logs;
}


// FORMULAS
parser.yy.assign = function( key, value ) {
  
  if( key in parser.yy.localenv ) {
    parser.yy.success = false;
    parser.yy.log(`ERROR: ${key} is already declared in local env!`);
  } else {
    parser.yy.localenv[key] = value;
  }
  
    return parser.yy.success;
}

parser.yy.export = function( key ) {
  
  if( key in parser.yy.globalenv ) {
    parser.yy.log(`ERROR: ${key} is already declared in global env!`);
    parser.yy.success = false;
  } else if( !(key in parser.yy.localenv) ) {
    parser.yy.log(`ERROR: ${key} is not declared in local env!`);
    parser.yy.success = false;
  } else {
    parser.yy.globalenv[key] = parser.yy.localenv[key];
  }
  
}


// TERMS

parser.yy.deploy = function( className, args, txOptions ) {
  
  if( className in parser.yy.classes ) {
    parser.yy.log(`deploying ${ className }(${args.join(',')}) with value: ${txOptions.value} and gas: ${txOptions.gas}`);
    return new Var( '0x0123', Var.TYPE.ADDRESS );
  } else {
    parser.yy.success = false;
    return null;
  }
  
}

parser.yy.call = function( varName, functionName, args, txOptions ) {
  // 
  // todo - assertion and detailed error handling
  if( typeof parser.yy.localenv[varName] === Var && parser.yy.localenv[varName].type === Var.TYPE.ADDRESS ) {
    console.log(`calling ${address} ${functionName}`);
  }
  
}

module.exports = parser;
