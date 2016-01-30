'use strict';

var parser = require('../lib/DSL.js');
var assert = require('chai').assert;

describe('DSL', function() {
  
  // TODO - pass the real environment
  beforeEach( function() {
    parser.yy.localenv = {};
    parser.yy.globalenv = {};
    parser.yy.success = true;
  });
  
  
  it("should recognize an string assignment", function(done){
    
    parser.parse('var foo = "bar"');
    
    assert( parser.yy.success );
    assert( parser.yy.localenv.foo.value === "bar" );
    
    done();
    
  });
  

  it("should recognize an number assignment", function(done){
    
    parser.parse('var foo = 42');
    
    assert( parser.yy.success );
    assert( parser.yy.localenv.foo.value === 42 );
    
    done();
    
  });
  

  it("should fail if key is already taken", function(done){
    
    parser.parse('var foo = 42');
    
    assert.ok( parser.yy.success );
    assert( parser.yy.localenv.foo.value === 42 );
    
    parser.parse('var foo = 17');
    
    assert.notOk( parser.yy.success );
    assert( parser.yy.localenv.foo.value === 42 );
    
    done();
    
  });
  
  it("should export local variables to global scope", function(done){
    
    parser.parse('var foo = 17\nexport foo');
    
    assert.ok( parser.yy.success );
    assert( parser.yy.globalenv.foo.value === 17 );
    
    done();
  });
  

  it("should fail export local variables to global scope if its taken", function(done){
    
    parser.parse('var foo = 17\nexport foo\nvar foo = 42\nexport foo');
    
    assert.notOk( parser.yy.success );
    assert( parser.yy.globalenv.foo.value === 17 );
    
    done();
  });
  
  it("should deploy a class", function(done){
    
    parser.parse('var foo = new Contract()');
    
    assert.ok( parser.yy.success );
    assert( parser.yy.localenv.foo.value === '0x0123' );
    
    
    done();
  });
  
  it("should fail deployment if a class is not known", function(done){
    
    parser.parse('var foo = new NoContract()');
    
    assert.notOk( parser.yy.success );
    
    done();
  });
 
  it.skip("should deploy contract with the right value", function(done){
    
    parser.parse('var foo = new NoContract.value(24)()');
    
    done();
    
  });
  
  it("should deploy contract with the right gas");
  
  it("should call an address", function(done){
    
    
    parser.parse('var foo = new NoContract()\n foo.functionCall()');
    
    
    done();
  });
  
  
  
});

