var assert = require("assert");
var fs = require("fs");
var Workspace = require("../lib/workspace");
var constants = require("../lib/constants");
var testenv = require("./testenv");
var workspace = new Workspace(testenv.example_package_dir);
var path = require("path");


describe("Workspace module tests for example package", function() {
    it("loads local .sol source tree", function(done) {
        var sources = workspace.loadWorkspaceSources();
        assert.deepEqual( Object.keys(sources), [ 'example.sol','example_test.sol','subdirectory/example2.sol'] );
        done();
    });
    it("finds dappfile in subdirectory", function(done) {
        assert( workspace.findWorkspaceRoot(path.join(testenv.example_package_dir, "subdirectory")) );
        done();
    });
    it("findWorkspaceRoot returns undefined if it hits root", function(done) {
        assert( undefined === workspace.findWorkspaceRoot(fs.tmpdir()));
        done();
    });
    it.skip("findWorkspaceRoot returns undefined if it hits dappleRC", function(done) {
        var dir = "TODO";
        assert( undefined === workspace.findWorkspaceRoot(dir) );
        done();
    });

});
