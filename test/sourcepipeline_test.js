'use strict';

var assert = require('chai').assert;
var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var testenv = require("./testenv");
var Workspace = require("../lib/workspace");

describe("SourcePipeline", function() {
    it('does not throw an exception given an empty ignore array', function () {
        var workspace = new Workspace(testenv.golden_package_dir);
        SourcePipeline({
            packageRoot: workspace.package_root,
            ignore: []
        })
    });
});
