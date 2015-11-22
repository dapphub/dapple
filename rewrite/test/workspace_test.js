var assert = require("assert");
var fs = require("fs");
var Workspace = require("../lib/workspace");
var defaults = require("../lib/defaults");
var testenv = require("./testenv");
var workspace = new Workspace(testenv.example_package_dir);


describe("Workspace module tests for example package", function() {
    it("loads local .sol source tree", function(done) {
        var sources = workspace.loadWorkspaceSources();
        assert.deepEqual( Object.keys(sources), [ 'example.sol','example_test.sol','subdirectory/example2.sol'] );
        done();
    });
});
