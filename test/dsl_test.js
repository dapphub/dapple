'use strict';

var parser = require('../lib/DSL.js');

describe('DSL', function() {
  
  
  it("should parse a simple statement", function(done){
    
    
    var output = parser.parse('var addr = new Contract()');
    
    console.log(output);
    
    
    done();
  });

  
  
  
});

