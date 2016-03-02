/* global it, describe */
'use strict';

var assert = require('chai').assert;
var constants = require('../lib/constants.js');
var PackageBuildFilter = require('../lib/package_build_filter.js');

describe('PackageBuildFilter', function () {
  it('should remove build output from other packages', function () {
    let sources = {
      '/package/contract.sol': 'contract Contract2{}',
      '/package/test/foo.sol': 'contract FooTest is Test {}'
    };
    let barSol = '/package/' + constants.PACKAGES_DIRECTORY +
                 '/subpackage/bar.sol';
    sources[barSol] = 'contract Bar{}';

    let mockWorkspace = {
      getPackageRoot: (f) => '/package',
      getPackagesPath: (f) => '/package/' + constants.PACKAGES_DIRECTORY,
      getSourcePath: (f) => '/package'
    };
    let buildFilter = new PackageBuildFilter();
    buildFilter.seed(mockWorkspace, sources);

    assert.deepEqual(
      buildFilter.filter(['Contract2', 'FooTest', 'Bar']),
      ['Contract2', 'FooTest']);
  });
});
