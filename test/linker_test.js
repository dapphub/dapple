/* global before, it, describe */
'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var constants = require('../lib/constants.js');
var fs = require('fs');
var Linker = require('../lib/linker.js');
var testenv = require('./testenv');
var path = require('path');
var Workspace = require('../lib/workspace.js');

describe('Linker', function () {
  var sources = {};
  var workspace;

  before(function (done) {
    testenv.get_source_files(testenv.linker_package_dir, function (files) {
      sources = _.object(_.map(
        files, (file) => [file.path, String(file.contents)]));
      workspace = new Workspace(_.values(files));
      done();
    });
  });

  it('can infer local imports based on the absence of packages', function () {
    var sources = {
      '/package/src/test/contract.sol': '',
      '/package/src/test/contract2.sol': '',
      '/package/src/contract.sol': ''
    };
    var mockWorkspace = {
      getPackageRoot: (f) => '/package',
      getPackagesDir: (f) => constants.PACKAGES_DIRECTORY,
      getSourcePath: (f) => '/package/src'
    };
    var importer = '/package/test/contract2.sol';
    var imported = 'test/contract.sol';
    var resolvedPath = Linker.resolveImport(
      sources, importer, imported, mockWorkspace);

    assert.equal(resolvedPath, '/package/src/test/contract.sol',
      'Linker got confused by identical contract names');
  });

  it('converts all source paths to hashes based on file contents',
    function () {
      var linkedSources = Linker.linkImports(workspace, sources);
      var sourcefileCount = 0;

      for (let path of _.keys(linkedSources)) {
        if (path === Linker.SOURCEMAP_KEY ||
            path === Linker.CONTRACTMAP_KEY) {
          continue;
        }

        sourcefileCount += 1;
        assert(/^_[a-f0-9]+\.sol$/.test(path),
          'unhashed path found after linking: ' + path);
      }
      assert.isAbove(sourcefileCount, 0, 'no source files observed!');
    });

  it('changes all import statements to point to hashpaths', function () {
    var linkedSources = Linker.linkImports(workspace, sources);
    var importRE = /import ['|"]([^'|"]+)['|"]/g;
    var importsChecked = 0;

    for (let source of _.values(linkedSources)) {
      let match;
      while ((match = importRE.exec(source)) !== null) {
        importsChecked += 1;
        assert(match[1] in linkedSources,
          'unresolvable import: ' + match[0]);
      }
    }
    assert.isAbove(importsChecked, 0, 'no imports found!');
  });

  it('includes a source map for linked imports', function () {
    var linkedSources = Linker.linkImports(workspace, sources);
    assert(Linker.SOURCEMAP_KEY in linkedSources);
  });

  it('includes a contract map for linked contracts', function () {
    var linked = Linker.link(workspace, sources);
    assert(Linker.CONTRACTMAP_KEY in linked);
  });

  it('only puts valid contract names in the contract map', function () {
    var map = Linker.link(workspace, sources)[Linker.CONTRACTMAP_KEY];
    var contractNames = _.values(JSON.parse(map)).sort();
    assert.deepEqual([
      'DappleLogger', 'DapplePkgContract', 'Debug', 'LinkerExample',
      'ParenExample', 'PkgContract', 'PkgContract', 'PkgContract_Test',
      'Reporter', 'Test', 'Tester'
    ], contractNames);
  });

  it('replaces contract names with hashes', function () {
    var linkedSources = Linker.link(workspace, sources);
    linkedSources[Linker.SOURCEMAP_KEY] = JSON.parse(
      linkedSources[Linker.SOURCEMAP_KEY]);

    var getHashpath = function (filename) {
      var hashPath;
      for (var _hashPath in linkedSources[Linker.SOURCEMAP_KEY]) {
        let path = linkedSources[Linker.SOURCEMAP_KEY][_hashPath][0];
        if (path.endsWith(filename)) {
          hashPath = _hashPath;
        }
      }
      return hashPath;
    };

    var contract_hash = getHashpath(
      constants.PACKAGES_DIRECTORY + '/pkg/src/sol/contract.sol');
    var local_contract_hash = getHashpath(
      'linker_test_package/src/sol/pkg/contract.sol');
    var dapple_contract_hash = getHashpath(
      constants.PACKAGES_DIRECTORY + '/pkg/src/sol/dapple_contract.sol');

    var local_pkg_contract_hash = Linker.uniquifyContractName(
      local_contract_hash, 'PkgContract'
    );
    var exampleTemplate = _.template(fs.readFileSync(path.join(
      workspace.getPackageRoot(), 'src.linked',
      'sol', 'linker_example.sol'), {encoding: 'utf8'}));
    var exampleOutput = exampleTemplate({
      contract_hash: contract_hash,
      local_contract_hash: local_contract_hash,
      dapple_contract_hash: dapple_contract_hash,
      pkg_contract_hash: local_pkg_contract_hash,
      dapple_pkg_contract_hash: Linker.uniquifyContractName(
        dapple_contract_hash, 'DapplePkgContract'
      )
    });

    var pkg_contract_hash = Linker.uniquifyContractName(
      contract_hash, 'PkgContract'
    );
    var dappleContractTemplate = _.template(fs.readFileSync(path.join(
      workspace.getPackageRoot(), 'src.linked',
      'sol', 'dapple_contract.sol'), {encoding: 'utf8'}));
    var dappleContractOutput = dappleContractTemplate({
      contract_hash: contract_hash,
      pkg_contract_hash: pkg_contract_hash
    });

    var example_hash = getHashpath('/linker_example.sol');
    assert.equal(linkedSources[example_hash], exampleOutput);
    assert.equal(linkedSources[dapple_contract_hash], dappleContractOutput);
  });

  it('produces accurate import maps', function () {
    var sources = {
      'a.sol': 'import "b.sol"',
      'b.sol': 'import "c.sol"',
      'c.sol': ''
    };
    var imports = {
      'a.sol': [],
      'b.sol': ['a.sol'],
      'c.sol': ['b.sol']
    };
    assert.deepEqual(Linker.importerMap(sources), imports);
  });

  it('can create lists of dependent files', function () {
    var imports = {
      'a.sol': [],
      'b.sol': ['a.sol'],
      'c.sol': ['b.sol']
    };
    var dependents = ['b.sol', 'a.sol'];
    assert.deepEqual(Linker.dependentsList('c.sol', imports), dependents);
  });
});
