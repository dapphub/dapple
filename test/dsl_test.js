'use strict';

var Workspace = require('../lib/workspace');
var Parser = require('../lib/DSL.js');
var Web3Factory = require('../lib/web3Factory.js');
var assert = require('chai').assert;
var testenv = require('./testenv');
var fs = require('../lib/file');
var pipelines = require( '../lib/pipelines.js');


describe('DSL', function() {
  this.timeout(10000);
  
  var parser;
  
  // TODO - pass the real environment
  beforeEach( function() {
    parser = new Parser({
      classes: {
        'Contract': {
          interface: 
[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      },
      web3: 'internal',
      silent: true 
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
      assert( parser.interpreter.local.foo.value.length === 42 );
      
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
  
  it.only("should pass an var as a deploy argument", function(done){
    
    parser.parse('var foo = new Contract()\n var bar = new Contract(foo)', function(err,res) {
      
      assert.ok( parser.interpreter.success );
      
      done();
      
    });
    
  });

  
  it('should send value to an address');
  it('should call an address with raw args');
  it('should switch between keys');
  
  it('should assert things');
  
  // TODO - don't work: maybe because of workspace?
  it.skip('should deploy a simple package', function(done) {
    
    
    var workspace = new Workspace(testenv.deploy_package_dir);
    let environments = workspace.getEnvironments();

    // TODO - refactor to wirkspace
    let file = fs.readFileSync( testenv.dsl_package_dir + '/deployscript', 'utf8' );

    let
      initStream = pipelines
        .BuildPipeline({
          packageRoot: testenv.deploy_package_dir+'/',
          subpackages: false
        })
      .pipe(req.pipelines.RunPipeline({
        script: file
      }));

    done();
    
  });
  
  
  it.skip("should something", function(done){
    
    var c = {
      classes: {
        'Contract': {
          interface: 
[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      }
    };
    
    const DEFAULT_GAS = 900000000;
    
    var web3 = Web3Factory.EVM();
    var Class = web3.eth.contract( c.classes['Contract'].interface );
    
    if (typeof web3.eth.defaultAccount === 'undefined') {
      web3.eth.defaultAccount = web3.eth.accounts[0];
    }
    
    web3.eth.sendTransaction({
      from: web3.eth.defaultAccount,
      data: '0x' + c.classes.Contract.bytecode,
      gas: DEFAULT_GAS,
      gasLimit: DEFAULT_GAS

    }, function(e,r) {
      console.log(e,r);
      
    });

    // Class.new({ 
    //   data: c.classes['Contract'].bytecode,
    //   from: web3.eth.coinbase,
    //   gas: DEFAULT_GAS,
    //   gasLimit: DEFAULT_GAS
    // }, function( err, res ) {
    //   console.log(res);
    //   if( err ) console.log(err)
    //   if( res.address ) {
    //     console.log(res.address);
    //     done();
    //   }
    // });
    
    
    
  });
  
  
  
  
});

describe('deploycript against real chain', function() {
  // 5 min
  this.timeout(600000);
  
  var parser;
  
  // TODO - pass the real environment
  beforeEach( function() {
    parser = new Parser({
      classes: {
        'Contract': {
          interface: 
[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"type":"function"}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      },
      web3: {host: 'localhost', port:'8545'},
      silent: true 
    });
  });
  
  it("should deploy a contract via rpc", function(done){
    
    parser.parse('var foo = new Contract()', function(err,res) {
      
      assert.ok( parser.interpreter.success );
      assert( parser.interpreter.local.foo.value.length === 42 );
      
      done();
      
    });
    
  });
  
  
});
