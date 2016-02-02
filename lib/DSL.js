'use strict';
var jison = require('jison');
var fs = require('fs');
var Interpreter = require('./interpreter.js');

var bnf = fs.readFileSync(__dirname + '/../specs/dsl.y','utf8');


class Parser {

  constructor( opts ) {
    
    this.parser = new jison.Parser(bnf);
    
    this.interpreter = new Interpreter(opts); 
    
    this.parser.yy.i = this.interpreter;
  }
  
  parse ( script, cb ) {
    this.parser.parse( script );
    this.interpreter.run(cb);
  }

}

module.exports = Parser;
