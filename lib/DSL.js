var jison = require('jison');
var fs = require('fs');

var bnf = fs.readFileSync('./specs/dsl.y','utf8');

var parser = new jison.Parser(bnf);

parser.yy.assign = function( key, value ) {
  
  console.log(`${key} = ${value}`);
  return true;
  
}

parser.yy.deploy = function( cclass, args, value, gas ) {
  
  console.log(`deploying ${ cclass }(${args.join(',')}) with value: ${value} and gas: ${gas}`);
  return '0x0123';
  
}

module.exports = parser;
