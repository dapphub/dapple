'use strict';

var through = require('through2');
var _ = require('lodash');
var parser = require('../DSL.js');
var Interpreter = require('../interpreter.js');

module.exports = function(opts) {
  
  return through.obj( function( file, enc, cb ) {
    
    if( file.basename == 'classes.json' ) {
      
      var classes = JSON.parse(String(file.contents));
      var interpreter = new Interpreter({
        classes
      }); 
      parser.yy.i = interpreter;
      
      parser.parse( opts.script );
      
      console.log(interpreter.local);
      
      
    }
    cb();
    
  });
  
}
