'use strict';

var assert = require('chai').assert;
var package_stream = require('../../lib/streams').package_stream;
var path = require('path');
var testenv = require("../testenv");
var through = require('through2');
var Workspace = require("../../lib/workspace");

describe("streams.package_stream", function() {
    var workspace = new Workspace(testenv.golden_package_dir);
    var sources = {};

    // In order for this test suite to pass, solc must be installed.
    // We also need to grab all the source files first.
    before(function (done) {
        package_stream(workspace.package_root)
            .pipe(through.obj(function(file, enc, cb) {
                sources[file.path] = String(file.contents);
                cb();

            }, function (cb) {
                done();
                cb();
            }));
    });

    it("loads package sources", function() {
        var sourceDir = workspace.getSourceDir();

        assert.deepEqual(Object.keys(sources), [
            path.join(workspace.package_root, 'dappfile'),
            path.join(sourceDir, 'example.sol'),
            path.join(sourceDir, 'example_test.sol'),
            path.join(sourceDir, 'subdirectory', 'example2.sol')
        ]);

    });
});
