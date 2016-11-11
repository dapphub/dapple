/* global before, it, describe */
'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var constants = require('../../lib/constants.js');
var package_stream = require('../../lib/streams').package_stream;
var path = require('path');
var testenv = require('../testenv');
var through = require('through2');
var Workspace = require('../../lib/workspace');

describe('streams.package_stream', function () {
  var sources = {};

  // In order for this test suite to pass, solc must be installed.
  // We also need to grab all the source files first.
  before(function (done) {
    package_stream(testenv.golden_package_dir)
      .pipe(through.obj(function (file, enc, cb) {
        sources[file.path] = file;
        cb();
      }, function (cb) {
        done();
        cb();
      }));
  });

  it('loads package sources in accordance with its dappfile', function () {
    var workspace = new Workspace(_.values(sources));
    var sourceDir = workspace.getSourcePath();

    assert.deepEqual(_.uniq(Object.keys(sources).map(s => s.toLowerCase())).sort(), _.uniq([
      path.join(workspace.package_root,
        constants.PACKAGES_DIRECTORY, 'pkg', 'contracts', 'example.sol'),
      path.join(workspace.package_root, constants.PACKAGES_DIRECTORY, 'pkg',
        'Dappfile'),
      path.join(sourceDir, 'example.sol'),
      path.join(sourceDir, 'example_test.sol'),
      path.join(sourceDir, 'subdirectory', 'example2.sol'),
      path.join(workspace.package_root, 'Dappfile')
    ].map(s => s.toLowerCase())));
  });
});
