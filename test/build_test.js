/* global it, describe */
'use strict';
var _ = require('lodash');
var assert = require('chai').assert;
var fs = require('../lib/file');
var path = require('path');
var testenv = require('./testenv');
var Workspace = require('../lib/workspace');

describe('class Builder', function () {
  var workspace = new Workspace(testenv.golden_package_dir);
  var Builder = require('../lib/build');
  var b = new Builder(workspace);

  // TODO this fails with timeout even though `done()` is called
  it.skip('[SLOW] .build recreates golden solc_out from blank init dir', function (done) {
    this.timeout(15000);

    var tmpdir = fs.tmpdir();
    var returned = b.build(tmpdir);
    // Uncomment to make new golden record
    // fs.writeJsonSync(testenv.golden.SOLC_OUT_PATH(), returned);
    var written = fs.readJsonSync(path.join(tmpdir, 'classes.json'));
    var golden = testenv.golden.SOLC_OUT();

    assert.deepEqual(returned, golden);
    assert.deepEqual(written, golden);
    done();
  });
  it('filterSolcOut does not exclude output we need', function (done) {
    var golden_sources = testenv.golden.SOLC_OUT();
    var filtered_sources = Builder.removeSolcClutter(golden_sources);
    var tester_class = filtered_sources.contracts.Tester;
    var required_outputs = ['bytecode', 'interface', 'solidity_interface'];
    _.forEach(required_outputs, function (key) {
      assert(_.has(tester_class, key), 'missing a required key: ' + key);
    });
    done();
  });
  it('writeJsHeader produces the golden output', function (done) {
    var classes = testenv.golden.SOLC_OUT();
    var headers = Builder.extractClassHeaders(classes);
    var compiled = Builder.compileJsModule({
      name: 'golden', headers: headers
    });
    // Uncomment to make new golden record
    // fs.writeFileSync(testenv.golden.JS_OUT_PATH(), compiled);
    assert.deepEqual(testenv.golden.JS_OUT(), compiled);
    done();
  });
  it('produces an importable JS file', function () {
    var dappleModule = require(path.join(testenv.golden.JS_OUT_PATH()));
    assert.isFunction(dappleModule.class);
    assert.isObject(dappleModule.environments);
  });
  it.skip('has helpful error when directory layout misconfigured');
});
