'use strict';

var assert = require('chai').assert;
var package_stream = require('../../lib/streams').package_stream;
var testenv = require("../testenv");
var through = require('through2');
var Workspace = require("../../lib/workspace");

describe("streams.package_stream", function() {
    var workspace = new Workspace(testenv.golden_package_dir);
    var sources = {};

    // In order for this test suite to pass, solc must be installed.
    // We also need to grab all the source files first.
    before(function (done) {
        var workspace = new Workspace(testenv.golden_package_dir);
        package_stream(workspace.getSourceDir())
            .pipe(through.obj(function(file, enc, cb) {
                sources[file.path] = String(file.contents);
                cb();

            }, function (cb) {
                done();
                cb();            
            }));
    });

    it("loads package sources", function() {
        assert.deepEqual(Object.keys(sources), [
            'example.sol','example_test.sol','subdirectory/example2.sol']);
    });
});
