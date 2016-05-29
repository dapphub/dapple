/* global it, describe */
'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var pipelines = require('../lib/pipelines.js');
var RunPipeline = require('dapplescript');
var testenv = require('./testenv.js');
var through = require('through2');

describe.skip('DSL', function () {
  this.timeout(1000000);

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
      .pipe(RunPipeline({
        script: file,
        silent: true,
        confirmationBlocks: 0
      }))
      .pipe(through.obj(function (file, enc, cb) {
        if (!/__deployScript\.[json|stderr]/.test(file.path)) {
          cb();
          return;
        } else if (file.path === '__deployScript.json') {
          var output = JSON.parse(String(file.contents));
          assert(output.success, 'parser did not report success');
          done();
        } else {
          cb();
        }
      }));
  });

  it.skip('allows passing raw values to constructors', function (done) {
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
      .pipe(RunPipeline({
        script: script,
        silent: true,
        confirmationBlocks: 0
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

  it.skip('allows passing variables to constructors', function (done) {
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
      .pipe(RunPipeline({
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
});
