/* global it, describe */
'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var constants = require('../lib/constants.js');
var dircompare = require('dir-compare');
var fs = require('../lib/file');
var path = require('path');
var schemas = require('../lib/schemas.js');
var testenv = require('./testenv');
var Workspace = require('../lib/workspace');

describe('class Workspace', function () {
  it('.initialize(emptydir) matches golden version', function () {
    var dir = fs.tmpdir();
    Workspace.initialize(dir);
    // fs.copySync(dir, testenv.golden.INIT_EMPTY_DIR); //  Create a new golden record
    var emptyDirs = ['.dapple', 'build', 'contracts'];
    var ls = fs.readdirSync(dir);
    console.log(_.intersection(ls, emptyDirs), emptyDirs);
    assert.deepEqual(_.intersection(ls, emptyDirs), emptyDirs,
      'Workspace does not initialize with expected empty directories.');

    var diff = dircompare.compareSync(dir, testenv.golden.INIT_EMPTY_DIR, {
      excludeFilter: emptyDirs.join(',')
    });
    console.log(diff);
    assert(diff.same, 'Workspace does not initialize with expected files.');
  });

  it('.initialize(initializeddir) throws', function () {
    assert.throws(function () {
      Workspace.initialize(testenv.golden.INIT_EMPTY_DIR);
    }, /dappfile already exists/);
  });

  it('initializes successfully in golden package', function (done) {
    testenv.get_source_files(
      testenv.golden_package_dir, function (files) {
        Workspace.create(_.values(files));
        done();
      });
  });

  it('can initialize around a single dappfile, as opposed to having to' +
      ' take in all the dappfiles at once', function () {
    var workspace = Workspace.atPackageRoot(testenv.golden_package_dir);
    var expectedDappfile = fs.readYamlSync(path.join(
      testenv.golden_package_dir, 'dappfile'));
    assert.deepEqual(workspace.dappfile, expectedDappfile);

    assert(schemas.dappfile.validate(expectedDappfile),
      'dappfile is not valid by schema');
  });

  describe('findPackageRoot', function () {
    it('may take an argument instead of assuming the' +
        ' search should start in the current working directory', function () {
      let subdir = path.join(
        testenv.golden_package_dir, 'subdirectory');
      assert.equal(Workspace.findPackageRoot(subdir),
        testenv.golden_package_dir);
    });

    it('recognizes the lowest parent directory with a dappfile' +
        ' as the package root', function () {
      let pkgdir = path.join(
        testenv.golden_package_dir, constants.PACKAGES_DIRECTORY, 'pkg');
      let subdir = path.join(pkgdir, 'contracts');
      assert.equal(Workspace.findPackageRoot(subdir), pkgdir);
    });

    it('returns undefined if it hits root', function () {
      var dir = fs.tmpdir();
      assert.equal(undefined, Workspace.findPackageRoot(dir));
    });

    it.skip('returns undefined if it hits .dapplerc', function () {
      var dir = 'TODO';
      var workspace = new Workspace(testenv.golden_package_dir);
      assert.equal(undefined, workspace.findPackageRoot(dir));
    });
  });

  describe('findBuildPath', function () {
    it('may take an argument instead of assuming the' +
    ' search should start in the current working directory', function () {
      assert.equal(
        Workspace.findBuildPath(testenv.golden_package_dir),
        path.join(testenv.golden_package_dir, 'build'));
    });

    it('returns undefined if it hits root', function () {
      var dir = fs.tmpdir();
      assert.equal(undefined, Workspace.findBuildPath(dir));
    });
  });

  it('knows how to load .dapplerc', function () {
    var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');
    var rc = Workspace.getDappleRC({paths: [fixtureRC]});
    var expectedRC = fs.readYamlSync(fixtureRC + '.expanded');
    assert.deepEqual(rc.data, expectedRC, 'did not load ' + fixtureRC);
  });

  it('knows how to make .dapplerc', function () {
    var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');
    var expectedRC = fs.readYamlSync(fixtureRC + '.expanded');
    var newRC = path.join(__dirname, '_fixtures', 'dapplerc_copy');
    Workspace.writeDappleRC(newRC, expectedRC);
    var rc = Workspace.getDappleRC({paths: [newRC]});
    fs.removeSync(newRC); // Cleanup

    assert.deepEqual(rc.data, expectedRC, 'did not create dapplerc');
  });

  it('throws an exception if the dappfile is empty', function () {
    assert.throws(function () {
      Workspace.create(testenv.empty_package_dir);
    });
  });

  it('allows setting subordinate dappfiles, even empty ones', function () {
    var workspace = Workspace.atPackageRoot(testenv.golden_package_dir);
    workspace.addSubDappfile(process.cwd(), {});
  });

  it('allows setting sub-dappfiles with ignore patterns', function () {
    var cwd = process.cwd();
    var workspace = Workspace.atPackageRoot(testenv.golden_package_dir);
    var prevIgnores = workspace.getIgnoreGlobs();
    workspace.addSubDappfile(cwd, {ignore: ['foo/bar.sol']});
    assert.deepEqual(
      _.difference(workspace.getIgnoreGlobs(), prevIgnores), [
        path.join(cwd, 'contracts/foo/bar.sol')
      ]);
  });
});
