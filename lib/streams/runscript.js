'use strict';

var through = require('through2');
var _ = require('lodash');
var Parser = require('../DSL.js');

module.exports = function(opts) {
  
  return through.obj( function( file, enc, cb ) {
    
    if( file.basename == 'classes.json' ) {
      
      var classes = JSON.parse(String(file.contents));
      var parser = new Parser({ classes });
      
      parser.parse( opts.script, cb );
      
    } else {
      cb();
    }
    
  });
  
}
