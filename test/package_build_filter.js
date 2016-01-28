/* global it, describe */
'use strict';

var assert = require('chai').assert;
var PackageBuildFilter = require('../lib/package_build_filter.js');

describe('PackageBuildFilter', function () {
  it('should remove build output from other packages', function () {
    let sources = {
      '/package/contract.sol': 'contract Contract2{}',
      '/package/test/foo.sol': 'contract FooTest is Test {}',
      '/package/dapple_packages/subpackage/bar.sol': 'contract Bar{}'
    };
    let mockWorkspace = {
      getPackageRoot: (f) => '/package',
      getPackagesPath: (f) => '/package/dapple_packages',
      getSourcePath: (f) => '/package'
    };
    let buildFilter = new PackageBuildFilter();
    buildFilter.seed(mockWorkspace, sources);

    assert.deepEqual(
      buildFilter.filter(['Contract2', 'FooTest', 'Bar']),
      ['Contract2', 'FooTest']);
  });
});
