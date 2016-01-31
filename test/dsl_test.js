'use strict';

var Parser = require('../lib/DSL.js');
var assert = require('chai').assert;
var parser;

describe('DSL', function() {
  
  // TODO - pass the real environment
  beforeEach( function() {
    parser = new Parser({
      classes: {
        "Contract": {}
      }
    });
  });
  
  // afterEach( function() {
  //   console.log(parser.interpreter.logs.join('\n') );
  // });
  
  
  it("should recognize an string assignment", function(done){
    
    parser.parse('var foo = "bar"', function( err, res ) {
      
      assert( parser.interpreter.success );
      assert( parser.interpreter.local.foo.value === "bar" );
      
      done();
      
    });
    
    
    
  });
  

  it("should recognize an number assignment", function(done){
    
    parser.parse('var foo = 42', function( err, res ) {
      assert( parser.interpreter.success );
      assert( parser.interpreter.local.foo.value === 42 );
      
      done();
    });
    
    
  });
  

  it("should fail if key is already taken", function(done){
    
    parser.parse('var foo = 42', function( err, res ) {
      
      assert.ok( parser.interpreter.success );
      assert( parser.interpreter.local.foo.value === 42 );
      
      parser.parse('var foo = 17', function(err,res) {
        
        assert.notOk( parser.interpreter.success );
        assert( parser.interpreter.local.foo.value === 42 );
        
        done();
        
      });
      
    });
    
    
  });
  
  it("should export local variables to global scope", function(done){
    
    parser.parse('var foo = 17\nexport foo', function( err, res ) {
      
      assert.ok( parser.interpreter.success );
      assert( parser.interpreter.global.foo.value === 17 );
      
      done();
      
    });
    
  });
  

  it("should fail export local variables to global scope if its taken", function(done){
    
    parser.parse('var foo = 17\nexport foo\nvar foo = 42\nexport foo', function( err, res ) {
      
      assert.notOk( parser.interpreter.success );
      assert( parser.interpreter.global.foo.value === 17 );
      
      done();
      
    });
    
  });
  
  it("should deploy a class", function(done){
    
    parser.parse('var foo = new Contract()', function(err,res) {
      
      assert.ok( parser.interpreter.success );
      assert( parser.interpreter.local.foo.value === '0x0123' );
      
      done();
      
    });
    
  });
  
  it("should fail deployment if a class is not known", function(done){
    
    parser.parse('var foo = new NoContract()', function( err, res ) {
      
      assert.notOk( parser.interpreter.success );
      
      done();
      
    });
    
  });
 
  it.skip("should deploy contract with the right value", function(done){
    
    parser.parse('var foo = new NoContract.value(24)()', function( err, res ) {
      
      done();
      
    });
    
    
  });
  
  it("should deploy contract with the right gas");
  
  it("should call an address", function(done){
    
    
    parser.parse('var foo = new Contract()\n foo.functionCall()', function( err, res ) {
      
      done();
      
    });
    
    
  });
  
  it("should fail calling a wrong address", function(done){
    
    parser.parse('var foo = new NoContract()\n foo.functionCall()', function(err,res) {
      
      assert.notOk( parser.interpreter.success );
      
      done();
      
    });
    
  });
  
  it('should send value to an address');
  it('should call an address with raw args');
  it('should switch between keys');
  
  it('should assert things');
  
  
  
  
});

