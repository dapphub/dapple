'use strict';

var _ = require('lodash');
var path = require('path').posix;
var Web3 = require('web3');

var web3 = new Web3();

const SOURCEMAP_KEY = '__dapplesourcemap__';
const CONTRACTMAP_KEY = '__dapplecontractmap__';

class Linker {
  static link (workspace, sources) {
    return this.linkContracts(this.linkImports(workspace, sources));
  }

  static resolveImport (sources, sourcePath, importPath, workspace) {
    if (importPath in sources) {
      // Fully qualified import path.
      return importPath;
    }

    var importParts = importPath.split(path.sep);
    var packagePath1 = path.join(
      workspace.getPackageRoot(sourcePath),
      workspace.getPackagesDir(sourcePath),
      importParts[0]);
    var packagePath2 = path.join(
      workspace.getPackageRoot(sourcePath),
      'dapple_packages',
      importParts[0]);

    // TODO - refactor this based on dappfile version
    var testPackagePath = (packagePath) => {
      var exists = (packagePath === workspace.getPackageRoot(packagePath));

      if (!importPath.startsWith('./') && exists) {
        var resolvedPath = path.join.apply(path,
          [workspace.getSourcePath(packagePath)]
            .concat(importParts.slice(1)));

        if (resolvedPath in sources) {
          return resolvedPath;
        }
      }
      return null;
    };
    var resolvedPath = testPackagePath(packagePath1) || testPackagePath(packagePath2);
    if (resolvedPath != null) return resolvedPath;

    var localPath = path.normalize(
      path.join(workspace.getSourcePath(sourcePath), importPath));

    if (localPath in sources) {
      return localPath;
    }

    throw new Error(
      'Unable to resolve import path \'' + importPath +
      '\' in file \'' + sourcePath + '\'');
  }

  static linkImports (workspace, _sources) {
    // Prevent accidental mutation.
    var sources = _.cloneDeep(_sources);

    var linked = {};
    linked[SOURCEMAP_KEY] = {};

    // Walk all the source files and replace import paths with paths derived
    // from the content being imported. This is a crude way of
    // de-duplicating imported data and slimming down our builds.
    var importRegex = /(^\s*import\s*['|""])([^'|"]+)/gm;
    for (let sourcePair of _.map(sources, (v, k) => [k, v])) {
      let path = sourcePair[0];
      let source = sourcePair[1];

      if (!path.toLocaleLowerCase().endsWith('.sol')) {
        continue;
      }

      // Provide a map for relating hashes back to paths.
      let pathHash = this.solidityHashpath(source);
      if (!(pathHash in linked[SOURCEMAP_KEY])) {
        linked[SOURCEMAP_KEY][pathHash] = [];
      }
      linked[SOURCEMAP_KEY][pathHash].push(path);

      // Replace all import paths with paths derived from the content
      // being imported.
      let that = this;
      linked[pathHash] = source.replace(
        importRegex, (_, importPrefix, importPath) => {
          let resolvedPath = that.resolveImport(
            sources, path, importPath, workspace);
          let pathHash = that.solidityHashpath(sources[resolvedPath]);
          return importPrefix + pathHash;
        });
    }

    linked[SOURCEMAP_KEY] = JSON.stringify(linked[SOURCEMAP_KEY]);

    return linked;
  }

  static contractDepths (sources) {
    // If we were given a sourcemap, we're going to want to use it.
    // In particular, we're going to want to have a concept of each contract
    // file's package depth. This will let us provide a mapping of which
    // contracts should be included in the build output when there's a
    // naming collision. Any included package's directory depth will always
    // been lower than the depth of the package including it.
    var depths = {};
    if (SOURCEMAP_KEY in sources) {
      sources[SOURCEMAP_KEY] = JSON.parse(sources[SOURCEMAP_KEY]);

      for (let pair of _.map(sources[SOURCEMAP_KEY], (v, k) => [k, v])) {
        let hashPath = pair[0];
        let paths = pair[1];

        depths[hashPath] = _.min(_.map(
          paths, (p) => p.split('/').length));
      }
    }
    return depths;
  }

  static importerMap (sources) {
    // Build up a mapping from imported files to the files importing them.
    // We'll use this to update references to contracts as we hash their
    // names.
    var importerMap = {};
    var importRegex = /(^\s*import\s*['|""])([^'|"]+)/gm;

    for (let sourcePair of _.map(sources, (v, k) => [k, v])) {
      let p = sourcePair[0];
      let source = sourcePair[1];
      let match;

      while ((match = importRegex.exec(source)) !== null) {
        let imported = match[2];
        if (!(imported in importerMap)) {
          importerMap[imported] = [];
        }
        importerMap[imported].push(p);
      }

      if (!(p in importerMap)) {
        importerMap[p] = [];
      }
    }
    return importerMap;
  }

  static dependentsList (root, importers, dependents) {
    if (typeof dependents === 'undefined') {
      dependents = [];
    }

    for (let dependent of importers[root]) {
      if (dependents.indexOf(dependent) > -1) continue;
      dependents.push(dependent);
      dependents = this.dependentsList(dependent, importers, dependents);
    }
    return dependents;
  }

  static linkContracts (sources) {
    var linked = _.cloneDeep(sources);
    var depths = this.contractDepths(linked);
    var importerMap = this.importerMap(linked);

    // Now we've got our dependency graph. Let's do one more iteration
    // through the source files and replace contract names with hashes.
    // TODO: Clean this up. Three nested for loops is turrible.
    // TODO: We could also be somewhat more intelligent about this. As
    // written, this will totally overwrite contract names in strings and
    // comments.
    // TODO: Find a clean way to share this regex with PackageBuildFilter.
    var contractDecRegex = /(^\s*contract\s+)([A-Za-z0-9_]+)/gm;

    // We're going to keep track of the hashes we assign to the shallowest
    // contract names so we can give them back their original names before
    // returning. This is how we resolve naming collisions. Anything
    // occluded by a naming collision will retain its hashed name.
    let contractDepths = {};
    let contractLocations = {};
    let shallowestContracts = {};

    linked[CONTRACTMAP_KEY] = {};

    var sourcePairs = _.sortBy(_.map(importerMap, (v, k) => [k, v]),
                               (pair) => depths[pair[0]]);

    for (let sourcePair of sourcePairs) {
      let path = sourcePair[0];
      if (path === SOURCEMAP_KEY) continue;

      let contractHashes = {};
      let source = path in linked ? linked[path] : sources[path];
      let dependents = this.dependentsList(path, importerMap);

      let match;
      while ((match = contractDecRegex.exec(source)) !== null) {
        let contractName = match[2];
        let contractHash = this.uniquifyContractName(
          path, contractName);
        contractHashes[contractName] = contractHash;
        linked[CONTRACTMAP_KEY][contractHash] = contractName;

        // Populate our output mapping.
        if (!(contractName in shallowestContracts) ||
            contractDepths[contractName] > depths[path]) {
          contractDepths[contractName] = depths[path];
          contractLocations[contractName] = [path].concat(dependents);
          shallowestContracts[contractName] = contractHash;
        }
      }

      let replaceContractNames = function (source) {
        var names = _.sortBy(_.keys(contractHashes),
          (k) => k.length * -1);

        for (let name of names) {
          source = source.replace(
            new RegExp('([^A-Za-z0-9_\'"])(' +
                       name + ')([^A-Za-z0-9_\'"])', 'gm'),
            function (match, ws1, name, ws2) {
              return ws1 + contractHashes[name] + ws2;
            });
        }

        return source;
      };

      for (let dependent of dependents) {
        linked[dependent] = replaceContractNames(linked[dependent]);
      }
      linked[path] = replaceContractNames(source);
    }

    // Restore the names of contracts not occluded by shallower contracts.
    for (let pair of _.map(shallowestContracts, (v, k) => [k, v])) {
      let contract = pair[0];
      let contractHash = pair[1];

      for (let path of contractLocations[contract]) {
        linked[path] = linked[path].replace(
          new RegExp(contractHash, 'g'), contract);
      }
    }

    // Stringify JSON elements.
    linked[CONTRACTMAP_KEY] = JSON.stringify(linked[CONTRACTMAP_KEY]);

    // A shortcut we can take because we didn't mutate the JSON in `linked`.
    if (SOURCEMAP_KEY in sources) {
      linked[SOURCEMAP_KEY] = sources[SOURCEMAP_KEY];
    }
    return linked;
  }

  static uniquifyContractName (filepath, name) {
    return '_CT' + web3.sha3(path.join(filepath, name));
  }

  static solidityHashpath (content) {
    return '_' + web3.sha3(content) + '.sol';
  }
}
Linker.SOURCEMAP_KEY = SOURCEMAP_KEY;
Linker.CONTRACTMAP_KEY = CONTRACTMAP_KEY;

// Helper regexes for classes that need to parse Linker output.
Linker.CONTRACTLINK_REGEXP = /_CT[0-9a-f]+/;
Linker.SOURCELINK_REGEXP = /_[0-9a-f]+/;

module.exports = Linker;
