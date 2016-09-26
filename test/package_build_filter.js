/* global it, describe */
'use strict';

var assert = require('chai').assert;
var constants = require('../lib/constants.js');
var PackageBuildFilter = require('../lib/package_build_filter.js');

describe('PackageBuildFilter', function () {
  // skipping because packages now can be in the same direcotry as sol sources
  // and i didn't tried to refactor and understand the linker as it may becode
  // deprecated, because solidity nativelly is able to link against packages
  it.skip('should remove build output from other packages', function () {
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
