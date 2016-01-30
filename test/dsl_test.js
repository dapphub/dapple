'use strict';

var parser = require('../lib/DSL.js');

describe('DSL', function() {
  
  
  it("should recognize strings", function(done){
    
    var output = parser.parse('"abc"');
    
    assert(output === "abc");
    
    done();
  });
  
  it.only("should recognize an assignment", function(done){
    
    var output = parser.parse('var abc = "abc"');
    
    console.log(output);
    
    done();
  });

  
  
  
});

