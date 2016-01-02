'use strict';

var _ = require('lodash');
var path = require('path').posix;
var Web3 = require('web3');
var Workspace = require('./workspace.js');

var web3 = new Web3();

const SOURCEMAP_KEY = '__dapplesourcemap__';
const CONTRACTMAP_KEY = '__dapplecontractmap__';

class Linker {
    static link(sources) {
        // TODO: Link contracts. We're mostly there, but it needs a little work
        // when it comes to handling collisions upon converting back to legible
        // names.
        return this.linkContracts(this.linkImports(sources));
    }

    static linkImports(_sources) {
        // Prevent accidental mutation.
        var sources = _.cloneDeep(_sources);

        var linked = {};
        linked[SOURCEMAP_KEY] = {};

        // Find all Dapple packages and wrap them in Workspace objects.
        var workspaces = this.findWorkspaces(sources);

        // Sort package root paths from deepest to shallowest. This will allow
        // us to efficiently find the appropriate package root given any file
        // path by simply walking the array and taking the first package root
        // that matches the beginning of the file path.
        // This works because package roots are always separated by the same
        // depth. (I.e.,
        // package1/dapple_packages/package2/dapple_packages/package...)
        // If this were not true, we'd have to create a tree and actually
        // calculate depths.
        var sortedWorkspacePaths = _.sortBy(_.keys(workspaces), function(p) {
            return -1 * p.split('/').length;
        });

        // Make a map of file paths to package root paths that can later
        // be used to look up the relevant regexes and workspace objects
        // for any given file.
        var workspacePaths = _.zipObject(_.map(_.keys(sources), function(p) {
            return [p, _.find(sortedWorkspacePaths, (wp) => p.startsWith(wp))];
        }));

        // Create a function that can resolve import paths for each source file.
        var resolveImport = function( sourcePath, importPath ) {
            if (importPath in sources) {
                // Fully qualified import path.
                return importPath;
            }

            var workspace = workspaces[workspacePaths[sourcePath]];

            if (!importPath.startsWith('./')) {
                var importParts = importPath.split(path.sep);
                var packageRootPath = path.join(
                    workspace.getPackagesDir(), importParts[0]);

                if (packageRootPath in workspaces) {
                    var packageWorkspace = workspaces[packageRootPath];
                    var packagePath = path.join.apply(
                        path, [packageWorkspace.getSourceDir()]
                                .concat(importParts.slice(1)));

                    if (packagePath in sources) {
                        return packagePath;
                    }
                }
            }

            var localPath = path.normalize(
                path.join(workspace.getSourceDir(), importPath));

            if (localPath in sources) {
                return localPath;
            }

            throw new Error(
                "Unable to resolve import path '" + importPath
                + "' in file '" + sourcePath + "'");
        }

        // Walk all the source files and replace import paths with paths derived
        // from the content being imported. This is a crude way of
        // de-duplicating imported data and slimming down our builds.
        var importRegex = /(^\s*import\s*['|""])([^'|"]+)/gm;
        for (let sourcePair of _.pairs(sources)) {
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
                    return importPrefix + that.solidityHashpath(
                        sources[resolveImport(path, importPath)])
            });
        }

        linked[SOURCEMAP_KEY] = JSON.stringify(linked[SOURCEMAP_KEY]);

        return linked;
    }

    static linkContracts(sources) {
        // Link contract names.
        var linked = _.clone(sources);
        linked[CONTRACTMAP_KEY] = {};

        // If we were given a sourcemap, we're going to want to use it.
        // In particular, we're going to want to have a concept of each contract
        // file's package depth. This will let us provide a mapping of which
        // contracts should be included in the build output whne there's a
        // naming collision.
        var depths = {};
        if (SOURCEMAP_KEY in sources) {
            linked[SOURCEMAP_KEY] = JSON.parse(sources[SOURCEMAP_KEY]);

            for (let pair of _.pairs(linked[SOURCEMAP_KEY])) {
                let hashPath = pair[0];
                let paths = pair[1];

                depths[hashPath] = _.min(_.map(paths,
                                               (p) => p.split('/').length));
            }
        }

        // First build up a mapping from imported files to the files importing
        // them. We'll use this to update references to contracts as we hash
        // their names.
        var dependencyMap = {};
        var importRegex = /(^\s*import\s*['|""])([^'|"]+)/gm;

        for (let sourcePair of _.pairs(sources)) {
            let p = sourcePair[0];
            let source = sourcePair[1];
            let match;

            while ((match = importRegex.exec(source)) !== null) {
                let imported = match[2];
                if (!(imported in dependencyMap)) {
                    dependencyMap[imported] = [];
                }
                dependencyMap[imported].push(p);
            }
        }

        // Now we've got our dependency graph. Let's do one more iteration
        // through the source files and replace contract names with hashes.
        // TODO: Clean this up. Three nested for loops is turrible.
        // TODO: We could also be somewhat more intelligent about this. As
        // written, this will totally overwrite contract names in strings and
        // comments.
        var contractDecRegex = /(^\s*contract\s*)([^\{\s]+)/gm;

        // We're going to keep track of the hashes we assign to the shallowest
        // contract names so we can give them back their original names before
        // returning. This is how we resolve naming collisions. Anything
        // occluded by a naming collision will retain its hashed name.
        let contractDepths = {};
        let contractLocations = [];
        let shallowestContracts = {};

        for (let sourcePair of _.pairs(dependencyMap)) {
            let path = sourcePair[0];
            let dependencies = sourcePair[1];
            let contractHashes = {};
            let source = sources[path];
            let match;

            while ((match = contractDecRegex.exec(source)) !== null) {
                let contractHash = this.uniquifyContractName(path, match[2]);
                contractHashes[match[2]] = contractHash;

                // Populate our output mapping.
                if (!(match[2] in contractDepths)
                    || contractDepths[match[2]] > depths[path]) {
                        contractDepths[match[2]] = depths[path];
                        contractLocations[match[2]] = [path].concat(dependencies);
                        shallowestContracts[match[2]] = contractHash;
                }
            }

            let replaceContractNames = function(source) {
                var names = _.sortBy(_.keys(contractHashes),
                                    (k) => k.length * -1);

                for (let name of names) {
                    source = source.replace(
                        new RegExp('([^A-Za-z0-9_\'"])('
                                   + name + ')([^A-Za-z0-9_\'"])', 'gm'),
                        function(match, ws1, name, ws2){
                            return ws1 + contractHashes[name] + ws2;
                        });
                }
                return source;
            };

            for (let dependency of dependencies) {
                linked[dependency] = replaceContractNames(linked[dependency]);
            }
            linked[path] = replaceContractNames(source);
        }

        // Restore the names of contracts not occluded by shallower contracts.
        for (let pair of _.pairs(shallowestContracts)) {
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

    static findWorkspaces(sources) {
        // Iterate over the paths given and create a Workspace for every Dapple
        // package found, as indicated by the presence of a dappfile.
        var dappfilePaths = _.filter(
            _.keys(sources), (p) => path.basename(p) == 'dappfile')

        return _.zipObject(_.map(dappfilePaths, function(p) {
            return [path.dirname(p), new Workspace(path.dirname(p))];
        }));
    }

    static uniquifyContractName(filepath, name) {
        return '_CT' + web3.sha3(path.join(filepath, name));
    }

    static solidityHashpath(content) {
        return '_' + web3.sha3(content) + '.sol';
    }
};
Linker.SOURCEMAP_KEY = SOURCEMAP_KEY;
Linker.CONTRACTMAP_KEY = CONTRACTMAP_KEY;

// Helper regexes for classes that need to parse Linker output.
Linker.CONTRACTLINK_REGEXP = /_CT[0-9a-f]+/;
Linker.SOURCELINK_REGEXP = /_[0-9a-f]+/;

module.exports = Linker;
