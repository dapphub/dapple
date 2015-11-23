var assert = require("assert");
var fs = require("fs");
var tmp = require("tmp");
var Workspace = require("../lib/workspace");
var constants = require("../lib/constants");
var testenv = require("./testenv");
var path = require("path");


describe("class Workspace", function() {
    var workspace = new Workspace(testenv.example_package_dir);
    it("loads local .sol source tree", function(done) {
        var sources = workspace.loadWorkspaceSources();
        assert.deepEqual( Object.keys(sources), [ 'example.sol','example_test.sol','subdirectory/example2.sol'] );
        done();
    });
    it("finds dappfile in subdirectory", function(done) {
        assert( Workspace.findWorkspaceRoot(path.join(testenv.example_package_dir, "subdirectory")) );
        done();
    });
    it("findWorkspaceRoot returns undefined if it hits root", function(done) {
        var dir = fs.tmpdir();
        assert.equal(undefined, Workspace.findWorkspaceRoot(dir));
        done();
    });
    it.skip("findWorkspaceRoot returns undefined if it hits .dapplerc", function(done) {
        var dir = "TODO";
        assert.equal( undefined, workspace.findWorkspaceRoot(dir) );
        done();
    });
    it("initializes blank workspace to spec", function() {
        var dir = fs.tmpdir();
        Workspace.initialize(dir)
    });
});
