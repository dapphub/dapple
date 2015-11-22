var assert = require("assert");
var fs = require("fs");
var Workspace = require("../lib/workspace");
var testenv = require("./testenv");
var workspace = new Workspace(testenv.example_package_dir);


describe("Workspace module tests for example package", function() {
    it("virtual package contracts are loaded", function() {
        var sourcepath = workspace.dapple_class_sources['dapple/test.sol'];
        var solcode = fs.readFileSync(sourcepath).toString();
        assert(solcode.indexOf("contract Test") !== -1, "Test contract not found");
        sourcepath = workspace.dapple_class_sources['dapple/debug.sol'];
        solcode = fs.readFileSync(sourcepath).toString();
        assert(solcode.indexOf("contract Debug") !== -1, "Debug contract not found");
    });
    it("loads local .sol source tree", function() {
        var sources = workspace.loadWorkspaceSources();
        assert.deepEqual( Object.keys(sources), [ 'example.sol','example_test.sol','subdirectory/example2.sol'] );
    });
});
