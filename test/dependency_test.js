/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Dependency = require('../lib/dependency');

describe('Dependency', function () {
  describe('construction from strings resolving to git paths', function () {
    it('handles git addresses', function () {
      var dep = Dependency.fromDependencyString(
        'https://github.com/nexusdev/dappsys.git@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'https://github.com/nexusdev/dappsys.git');
      assert.equal(dep.getVersion(), '9fe4f51');
    });

    // GIT URLS AND IPFS HASHES ARE DEPRECATED
    // it('requires a commit hash', function () {
    //   assert.throws(function () {
    //     Dependency.fromDependencyString(
    //       'https://github.com/nexusdev/dappsys.git');
    //   });
    // });

    it('handles git addresses with auth as well', function () {
      var dep = Dependency.fromDependencyString(
        'dev@bitbucket.org/nexusdev/dappsys.git@9fe4f51');
      assert.equal(dep.getPath(), 'dev@bitbucket.org/nexusdev/dappsys.git');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'dev@bitbucket.org/nexusdev/dappsys.git');
      assert.equal(dep.getVersion(), '9fe4f51');
    });

    it('matches git addresses regardless of case', function () {
      var dep = Dependency.fromDependencyString(
        'Dev@BitBucket.org/NexusDev/Dappsys.Git@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'Dev@BitBucket.org/NexusDev/Dappsys.Git');
      assert.equal(dep.getVersion(), '9fe4f51');
    });
  });

  describe('construction from strings resolving to IPFS paths', function () {
    // it('translates Qmdeadbeef to an IPFS path', function () {
    //   var dep = Dependency.fromDependencyString('Qmdeadbeef');
    //   assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
    //   assert.equal(dep.getName(), '');
    //   assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
    //   assert.equal(dep.getVersion(), 'Qmdeadbeef');
    // });

    it('translates @Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('@Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });

    it('translates dappsys@Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('dappsys@Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), 'dappsys');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });

    it('translates dappsys@ipfs://Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('dappsys@ipfs://Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), 'dappsys');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });

    // it('translates ipfs://Qmdeadbeef to an IPFS path', function () {
    //   var dep = Dependency.fromDependencyString('ipfs://Qmdeadbeef');
    //   assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
    //   assert.equal(dep.getName(), '');
    //   assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
    //   assert.equal(dep.getVersion(), 'Qmdeadbeef');
    // });
    //
    // it('translates IpFs://Qmdeadbeef to an IPFS path', function () {
    //   var dep = Dependency.fromDependencyString('ipfs://Qmdeadbeef');
    //   assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
    //   assert.equal(dep.getName(), '');
    //   assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
    //   assert.equal(dep.getVersion(), 'Qmdeadbeef');
    // });

    it('allows overriding names of IPFS packages', function () {
      var dep = Dependency.fromDependencyString('dappsys2@Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), 'dappsys2');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });
  });

  describe('construction for DappHub dependencies', function () {
    it('recognizes dappsys 1.2.3 as a DappHub reference', function () {
      var dep = new Dependency('dappsys', '1.2.3', 'dsys-alias');
      assert(dep.hasDappHubPath(), 'does not recognize DappHub reference');
      assert.equal(dep.getName(), 'dsys-alias');
      assert.equal(dep.getPath(), 'dappsys');
      assert.equal(dep.getVersion(), '1.2.3');
    });
    it('can be constructed from the string dappsys@1.2.3', function () {
      var dep = Dependency.fromDependencyString('dappsys@1.2.3', 'dsys-alias');
      assert(dep.hasDappHubPath(), 'does not recognize DappHub reference');
      assert.equal(dep.getName(), 'dsys-alias');
      assert.equal(dep.getPath(), 'dappsys');
      assert.equal(dep.getVersion(), '1.2.3');
    });
    it('can be constructed from the string 1.2.3 and the name dappsys', function () {
      var dep = Dependency.fromDependencyString('1.2.3', 'dappsys');
      assert(dep.hasDappHubPath(), 'does not recognize DappHub reference');
      assert.equal(dep.getName(), 'dappsys');
      assert.equal(dep.getPath(), 'dappsys');
      assert.equal(dep.getVersion(), '1.2.3');
    });
  });
});
