'use strict';

var assert = require('chai').assert;
var Contract = require('../lib/contract.js');
var fs = require('fs');
var Web3Factory = require('../lib/web3Factory.js');
var VMTest = require("../lib/vmtest.js");
var testenv = require("./testenv");
var vinyl = require("vinyl-fs");
var through = require('through2');

describe("VMTest", function() {

  // var source;
  //
  // before( function( done ) {
  //   var src = vinyl.src(['./test/_fixtures/mocktest.sol']);
  //   src.pipe(through.obj(function (file, enc) {
  //     source = file;
  //     done();
  //   }));
  // });

  var mock = JSON.parse(
    String(fs.readFileSync("./test/_fixtures/mocktest.json")));

    it("parses Contract objects for test functions", function() {
      var contract = new Contract(mock.contracts.Pass);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      assert.equal(1, vmtest.testCount(), "expected 1 test function")
    });

    it("runs tests by their indices", function(done) {
      var contract = new Contract(mock.contracts.Pass);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        assert.equal(0, result.logs.length);
        done();
      });
    });

    it("returns log results", function(done) {
      var contract = new Contract(mock.contracts.Fail);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test passed, should have failed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("passes if an expected exception is thrown", function( done ) {
      var contract = new Contract(mock.contracts.Throw);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        done();
      });
    });
    
    it("fails if an expected exception is not thrown", function( done ) {
      var contract = new Contract(mock.contracts.NotThrow);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.ok(result.failed, "test passed, should have failed");
        done();
      });
    });
    
    it("catches expected event", function( done ) {
      var contract = new Contract(mock.contracts.Event);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("catches multiple expected events", function( done ) {
      var contract = new Contract(mock.contracts.TwoEvent);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        assert.equal(2, result.logs.length);
        done();
      });
    });
    
    it("catches expected events arguments", function( done ) {
      var contract = new Contract(mock.contracts.EventArgs);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("catches expected events arguments by regex", function( done ) {
      var contract = new Contract(mock.contracts.EventArgsRegex);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.notOk(result.failed, "test failed, should have passed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("fails if expected events arguments dont match", function( done ) {
      var contract = new Contract(mock.contracts.EventNoArgs);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.ok(result.failed, "test passed, should have failed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("fails if expected events arguments dont match by regex", function( done ) {
      var contract = new Contract( mock.contracts.EventNoArgsRegex );
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.ok(result.failed, "test passed, should have failed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
    it("fails if expected event is not thrown", function( done ) {
      var contract = new Contract(mock.contracts.NoEvent);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.ok(result.failed, "test passed, should have failed");
        assert.equal(0, result.logs.length);
        done();
      });
    });
    
    it("fails if expected events are not thrown", function( done ) {
      var contract = new Contract(mock.contracts.NoSecondEvent);
      var vmtest = new VMTest(Web3Factory.EVM(), contract);
      vmtest.runTest(0, function(err, result) {
        assert.notOk(err);
        assert.ok(result.failed, "test passed, should have failed");
        assert.equal(1, result.logs.length);
        done();
      });
    });
    
});
