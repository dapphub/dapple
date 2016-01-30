var jison = require('jison');
var fs = require('fs');

var bnf = fs.readFileSync('./specs/dsl.y','utf8');

var parser = new jison.Parser(bnf);

parser.yy.env = {}; // init if not passed

parser.yy.assign = function( key, value ) {
  
  if( key in parser.yy.env ) {
    console.log(`HANDLE THIS ERROR: ${key} is already declared!`);
  } else {
    parser.yy.env[key] = value;
  }
  return true;
  
}

parser.yy.deploy = function( cclass, args, value, gas ) {
  
  console.log(`deploying ${ cclass }(${args.join(',')}) with value: ${value} and gas: ${gas}`);
  return '0x0123';
  
}

module.exports = parser;
