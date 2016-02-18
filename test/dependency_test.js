/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Dependency = require('../lib/dependency');

describe.only('Dependency', function () {
  describe('construction from strings resolving to git paths', function () {
    // We'll be changing this to prefer Dapphub paths once that's launched.
    it('translates NexusDev/dappsys to a Github URL', function () {
      var dep = Dependency.fromDependencyString('NexusDev/dappsys');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'https://github.com/NexusDev/dappsys.git');
      assert.equal(dep.getVersion(), '');
    });

    it('translates NexusDev/dappsys@9fe4f51 to a Github URL', function () {
      var dep = Dependency.fromDependencyString('NexusDev/dappsys@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'https://github.com/NexusDev/dappsys.git');
      assert.equal(dep.getVersion(), '@9fe4f51');
    });

    it('translates NexusDev/dappsys#audit@9fe4f51 to a Github URL', function () {
      var dep = Dependency.fromDependencyString('NexusDev/dappsys#audit@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'https://github.com/NexusDev/dappsys.git');
      assert.equal(dep.getVersion(), '#audit@9fe4f51');
    });

    it('allows overriding the name property', function () {
      var dep = Dependency.fromDependencyString('NexusDev/dappsys', 'dappsys2');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), 'dappsys2');
      assert.equal(dep.getPath(), 'https://github.com/NexusDev/dappsys.git');
      assert.equal(dep.getVersion(), '');
    });

    it('handles non-short non-Github git addresses as well', function () {
      var dep = Dependency.fromDependencyString(
        'https://bitbucket.org/nexusdev/dappsys.git#audit@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'https://bitbucket.org/nexusdev/dappsys.git');
      assert.equal(dep.getVersion(), '#audit@9fe4f51');
    });

    it('handles non-Github git addresses with auth as well', function () {
      var dep = Dependency.fromDependencyString(
        'dev@bitbucket.org/nexusdev/dappsys.git#audit@9fe4f51');
      assert.equal(dep.getPath(), 'dev@bitbucket.org/nexusdev/dappsys.git');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'dev@bitbucket.org/nexusdev/dappsys.git');
      assert.equal(dep.getVersion(), '#audit@9fe4f51');
    });

    it('matches git addresses regardless of case', function () {
      var dep = Dependency.fromDependencyString(
        'Dev@BitBucket.org/NexusDev/Dappsys.Git#audit@9fe4f51');
      assert(dep.hasGitPath(), 'should have gotten a git path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'Dev@BitBucket.org/NexusDev/Dappsys.Git');
      assert.equal(dep.getVersion(), '#audit@9fe4f51');
    });
  });

  describe('construction from strings resolving to IPFS paths', function () {
    it('translates Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });

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

    it('translates ipfs://Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('ipfs://Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });

    it('translates IpFs://Qmdeadbeef to an IPFS path', function () {
      var dep = Dependency.fromDependencyString('ipfs://Qmdeadbeef');
      assert(dep.hasIPFSPath(), 'should have gotten an IPFS path');
      assert.equal(dep.getName(), '');
      assert.equal(dep.getPath(), 'ipfs://Qmdeadbeef');
      assert.equal(dep.getVersion(), 'Qmdeadbeef');
    });
  });
});
