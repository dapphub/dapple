'use strict';

var parser = require('../lib/DSL.js');
var assert = require('chai').assert;

describe('DSL', function() {
  
  // TODO - pass the real environment
  beforeEach( function() {
    parser.yy.env = {};
  });
  
  
  it("should recognize strings", function(done){
    
    var output = parser.parse('"abc"');
    
    assert(output === "abc");
    
    done();
  });
  
  it("should recognize numbers", function(done){
    
    var output = parser.parse('42');
    
    assert(output = 42);
    
    done();
  });
  
  it("should recognize an assignment", function(done){
    
    var output = parser.parse('var foo = "bar"');
    
    assert( parser.yy.env.foo = "bar" );
    
    done();
  });
  


  
  
  
});

