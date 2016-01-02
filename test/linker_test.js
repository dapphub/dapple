'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var fs = require('fs');
var Linker = require('../lib/linker.js');
var testenv = require('./testenv');
var path = require('path');
var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var through = require('through2');
var Web3 = require('web3');
var Web3Factory = require('../lib/workspace.js');
var Workspace = require('../lib/workspace.js');

describe("Linker", function() {
    var web3 = new Web3();
    var sources = {};
    var workspace = new Workspace(testenv.linker_package_dir);

    var source_path = workspace.getSourcePath();
    var pkg_contract_hash = Linker.uniquifyContractName(
        path.join(source_path, "contract.sol"), "Contract");

    var dapple_packages = workspace.getPackagesPath();
    var pkg_workspace = new Workspace(path.join(dapple_packages, "pkg"));
    var dapple_pkg_contract_hash = Linker.uniquifyContractName(
        path.join(pkg_workspace.getSourcePath(), "contract.sol"), "Contract");

    // Grab all the source files first.
    before(function (done) {
        var workspace = new Workspace(testenv.linker_package_dir);
        SourcePipeline({
            packageRoot: workspace.package_root,
            sourceRoot: workspace.getSourcePath(),
            ignore: ['**/src.linked/**']
        })
            .pipe(through.obj(function(file, enc, cb) {
                sources[file.path] = String(file.contents);
                cb();

            }, function (cb) {
                done();
                cb();
            }));
    });

    it("converts all source paths to hashes based on file contents",
       function() {
           var linkedSources = Linker.linkImports(sources);
           var sourcefileCount = 0;

           for (let path of _.keys(linkedSources)) {
               if (path == Linker.SOURCEMAP_KEY
                   || path == Linker.CONTRACTMAP_KEY) {
                       continue;
               }

               sourcefileCount += 1;
               assert(/^_[a-f0-9]+\.sol$/.test(path),
                      "unhashed path found after linking: " + path);
           }
           assert.isAbove(sourcefileCount, 0, "no source files observed!");
       });

    it("changes all import statements to point to hashpaths", function() {
       var linkedSources = Linker.linkImports(sources);
       var importRE = /import ['|"]([^'|"]+)['|"]/g;
       var importsChecked = 0;

       for (let source of _.values(linkedSources)) {
           let match;
           while ((match = importRE.exec(source)) !== null) {
               importsChecked += 1;
               assert(match[1] in linkedSources,
                      "unresolvable import: " + match[0]);
           }
       }
       assert.isAbove(importsChecked, 0, "no imports found!");
    });

    it("includes a source map for linked imports", function() {
       var linkedSources = Linker.linkImports(sources);
       assert(Linker.SOURCEMAP_KEY in linkedSources);
    });

    it("replaces contract names with hashes", function() {
        var linkedSources = Linker.link(sources);
        linkedSources[Linker.SOURCEMAP_KEY] = JSON.parse(
            linkedSources[Linker.SOURCEMAP_KEY]);

        var getHashpath = function(filename) {
            var hashPath;
            for (var _hashPath in linkedSources[Linker.SOURCEMAP_KEY]) {
                let path = linkedSources[Linker.SOURCEMAP_KEY][_hashPath][0];
                if (path.endsWith(filename)) {
                    hashPath = _hashPath;
                };
            }
            return hashPath;
        };

        var contract_hash = getHashpath(
            'dapple_packages/pkg/src/sol/contract.sol');
        var local_contract_hash = getHashpath(
            'linker_test_package/src/sol/pkg/contract.sol');

        var template = _.template(fs.readFileSync(path.join(
            workspace.package_root, "src.linked",
            "sol", "linker_example.sol"), {encoding: 'utf8'}))

        var expectedOutput = template({
            contract_hash: contract_hash,
            local_contract_hash: local_contract_hash,
            pkg_contract_hash: Linker.uniquifyContractName(
                local_contract_hash, 'PkgContract'
            ),
            dapple_pkg_contract_hash: Linker.uniquifyContractName(
                contract_hash, 'DapplePkgContract'
            )
        });

        var example_hash = getHashpath('/linker_example.sol');
        assert.equal(linkedSources[example_hash], expectedOutput);
    });

    it("finds workspaces and their root paths", function() {
        assert.deepEqual(
            _.keys(Linker.findWorkspaces(sources)),
            ['/home/dev/devenv/dapple/test/_fixtures/linker_test_package',
             '/home/dev/devenv/dapple/test/_fixtures/linker_test_package/dapple_packages/pkg'
            ]);
    })
});
