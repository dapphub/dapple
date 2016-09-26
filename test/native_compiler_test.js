/* global before, it, describe */
'use strict';

var assert = require('chai').assert;
var fs = require('dapple-core/file');
var NativeCompiler = require('../lib/native_compiler');
var testenv = require('./testenv');

describe.skip('NativeCompiler', function () {
  var sources = {};

  // In order for this test suite to pass, solc must be installed.
  // We also need to grab all the source files first.
  before(function (done) {
    testenv.get_source_files(testenv.golden_package_dir, function (files) {
      sources = files;
      done();
    });
  });

  it('knows when solc is installed', function () {
    assert(NativeCompiler.isAvailable());
  });

  it('compile recreates golden solc_out from blank init dir', function () {
    this.timeout(15000);
    var returned = NativeCompiler.compile({sources: sources});
    // Uncomment to make new golden record
    fs.writeJsonSync(testenv.golden.SOLC_OUT_PATH(), returned);
    var golden = testenv.golden.SOLC_OUT();

    assert.deepEqual(returned, golden);
  });
});
