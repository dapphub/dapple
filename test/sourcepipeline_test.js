/* global it, describe */
'use strict';

var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var testenv = require('./testenv');
var Workspace = require('../lib/workspace');

describe('SourcePipeline', function () {
  it('does not throw an exception given an empty ignore array', function () {
    var package_dir = testenv.golden_package_dir;
    SourcePipeline({
      packageRoot: Workspace.findPackageRoot(package_dir),
      ignore: []
    });
  });
});
