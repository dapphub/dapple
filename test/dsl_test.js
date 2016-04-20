/* global beforeEach, it, describe */
'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var Parser = require('../lib/DSL.js');
var pipelines = require('../lib/pipelines.js');
var testenv = require('./testenv.js');
var through = require('through2');
var Web3Factory = require('../lib/web3Factory.js');

describe('DSL', function () {
  this.timeout(1000000);
  var parser;

  // TODO - pass the real environment
  beforeEach(function () {
    parser = new Parser({
      classes: {
        'Contract': {
          interface: [{'constant': false, 'inputs': [{'name': 'x', 'type': 'uint256'}], 'name': 'set', 'outputs': [], 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'get', 'outputs': [{'name': 'retVal', 'type': 'uint256'}], 'type': 'function'}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      },
      environment: 'test',
      environments: {
        'test': {
          'objects': {
            'fizzbuzz': 'buzz buzz'
          }
        }
      },
      web3: 'internal',
      // web3: {host: '192.168.59.103', port:'8545'},
      silent: true,
      confirmationBlocks: 1
    });
  });

  // afterEach( function() {
  //   console.log(parser.interpreter.logs.join('\n') )
  // })
  it('should recognize an string assignment', function (done) {
    parser.parse('var foo = "bar"', function (err, res) {
      if (err) throw err;
      assert(parser.interpreter.success);
      assert(parser.interpreter.local.foo.value === 'bar');
      done();
    });
  });

  it('should recognize an number assignment', function (done) {
    parser.parse('var foo = 42', function (err, res) {
      if (err) throw err;
      assert(parser.interpreter.success);
      assert(parser.interpreter.local.foo.value === 42);
      done();
    });
  });

  it('should fail if key is already taken', function (done) {
    parser.parse('var foo = 42', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert(parser.interpreter.local.foo.value === 42);
      parser.parse('var foo = 42\nvar foo = 17', function (err, res) {
        if (err) throw err;
        assert.notOk(parser.interpreter.success);
        assert(parser.interpreter.local.foo.value === 42);
        done();
      });
    });
  });

  it('allows importing object values from the dappfile', function (done) {
    parser.parse('import fizzbuzz\nlog fizzbuzz', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert.include(parser.interpreter.logs, 'buzz buzz\n');
      done();
    });
  });

  it('should export local variables to global scope', function (done) {
    parser.parse('var foo = 17\nexport foo', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert(parser.interpreter.global.foo.value === 17);
      done();
    });
  });

  it('should fail export local variables to global scope if its taken', function (done) {
    parser.parse('var foo = 17\nexport foo\nvar foo = 42\nexport foo', function (err, res) {
      if (err) throw err;
      assert.notOk(parser.interpreter.success);
      assert(parser.interpreter.global.foo.value === 17);
      done();
    });
  });

  it('should deploy a class', function (done) {
    parser.parse('var foo = new Contract()', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert(parser.interpreter.local.foo.value.length === 42);
      done();
    });
  });

  it('should pass an object as a deploy argument', function (done) {
    parser.parse('var foo = new Contract()\n var bar = new Contract(foo)', function (err, res) {
      // TODO: test if foo got passed as an correct address
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      done();
    });
  });

  it('should fail deployment if a class is not known', function (done) {
    parser.parse('var foo = new NoContract()', function (err, res) {
      if (err) throw err;
      assert.notOk(parser.interpreter.success);
      done();
    });
  });

  it.skip('should deploy contract with the right value', function (done) {
    parser.parse('var foo = new NoContract.value(24)()', function (err, res) {
      if (err) throw err;
      done();
    });
  });

  it('should deploy contract with the right gas');

  it('should call an address', function (done) {
    parser.parse('var foo = new Contract()\n foo.set(2) \n foo.get()', function (err, res) {
      if (err) throw err;
      done();
    });
  });

  it('should fail calling a wrong address', function (done) {
    parser.parse('var foo = new NoContract()\n foo.functionCall()', function (err, res) {
      if (err) throw err;
      assert.notOk(parser.interpreter.success);
      done();
    });
  });

  it('should allow logging via "log"', function (done) {
    parser.parse('log "Logging test!"', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert.include(parser.interpreter.logs, 'Logging test!\n');
      done();
    });
  });

  it('should send value to an address');
  it('should call an address with raw args');
  it('should switch between keys');

  it('should assert things');

  it('should deploy a simple package', function (done) {
    let file = fs.readFileSync(
      testenv.dsl_package_dir + '/deployscript', 'utf8');

    pipelines
      .BuildPipeline({
        packageRoot: testenv.dsl_package_dir + '/',
        subpackages: false,
        logger: {
          info: () => {},
          error: (e) => { throw e; }
        }
      })
      .pipe(pipelines.RunPipeline({
        script: file,
        silent: true
      }))
      .pipe(through.obj(function (file, enc, cb) {
        if (!/__deployScript\.[json|stderr]/.test(file.path)) {
          cb();
          return;
        }

        var output = JSON.parse(String(file.contents));
        assert(output.success, 'parser did not report success');
        cb();
        done();
      }));
  });

  it('allows passing raw values to constructors', function (done) {
    let script = 'var bar = new ConstructorContract(42)\n' +
                 'var res = bar.constructorArg()' +
                 'export res';

    var output;
    pipelines
      .BuildPipeline({
        packageRoot: testenv.dsl_package_dir + '/',
        subpackages: false,
        logger: {
          info: () => {},
          error: (e) => { throw e; }
        }
      })
      .pipe(pipelines.RunPipeline({
        script: script,
        silent: true
      }))
      .pipe(through.obj(function (file, enc, cb) {
        if (/__deployScript\.json/.test(file.path)) {
          output = JSON.parse(String(file.contents));
        }
        cb();
      }, function (cb) {
        assert(output.success, 'parser did not report success');
        assert.equal(output.globals.res, '42');
        cb();
        done();
      }));
  });

  it('allows passing variables to constructors', function (done) {
    let script = 'var foo = 42\n' +
                 'var bar = new ConstructorContract(foo)\n' +
                 'var res = bar.constructorArg()' +
                 'export res';

    var output;
    pipelines
      .BuildPipeline({
        packageRoot: testenv.dsl_package_dir + '/',
        subpackages: false,
        logger: {
          info: () => {},
          error: (e) => { throw e; }
        }
      })
      .pipe(pipelines.RunPipeline({
        script: script,
        silent: true
      }))
      .pipe(through.obj(function (file, enc, cb) {
        if (/__deployScript\.json/.test(file.path)) {
          output = JSON.parse(String(file.contents));
        }
        cb();
      }, function (cb) {
        assert(output.success, 'parser did not report success');
        assert.equal(output.globals.res, '42');
        cb();
        done();
      }));
  });

  it.skip('should something', function (done) {
    var c = {
      classes: {
        'Contract': {
          interface: [{'constant': false, 'inputs': [{'name': 'x', 'type': 'uint256'}], 'name': 'set', 'outputs': [], 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'get', 'outputs': [{'name': 'retVal', 'type': 'uint256'}], 'type': 'function'}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      }
    };
    const DEFAULT_GAS = 900000000;
    var web3 = Web3Factory.EVM();
    if (typeof web3.eth.defaultAccount === 'undefined') {
      web3.eth.defaultAccount = web3.eth.accounts[0];
    }
    web3.eth.sendTransaction({
      from: web3.eth.defaultAccount,
      data: '0x' + c.classes.Contract.bytecode,
      gas: DEFAULT_GAS,
      gasLimit: DEFAULT_GAS
    }, function (e, r) {
      console.log(e, r);
    });
  });
});

describe.skip('deployscript against real chain', function () {
  // 5 min
  this.timeout(600000);
  var parser;
  // TODO - pass the real environment
  beforeEach(function () {
    parser = new Parser({
      classes: {
        'Contract': {
          interface: [{'constant': false, 'inputs': [{'name': 'x', 'type': 'uint256'}], 'name': 'set', 'outputs': [], 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'get', 'outputs': [{'name': 'retVal', 'type': 'uint256'}], 'type': 'function'}],
          bytecode: '606060405260978060106000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b11460415780636d4ce63c14605757603f565b005b605560048080359060200190919050506078565b005b606260048050506086565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b600060006000505490506094565b9056'
        }
      },
      // web3: {host: '192.168.59.103', port:'8545'},
      web3: {host: 'localhost', port: '8545'},
      silent: true
    });
  });

  it('should deploy a contract via rpc', function (done) {
    parser.parse('var foo = new Contract()', function (err, res) {
      if (err) throw err;
      assert.ok(parser.interpreter.success);
      assert(parser.interpreter.local.foo.value.length === 42);
      done();
    });
  });
});
