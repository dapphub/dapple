'use strict';

var assert = require('chai').assert;
var filter = require('gulp-filter');
var fs = require("../lib/file");
var NativeCompiler = require("../lib/native_compiler");
var PackagePipeline = require('../lib/pipelines.js').PackagePipeline;
var testenv = require("./testenv");
var through = require('through2');
var Workspace = require("../lib/workspace");

describe.skip("NativeCompiler", function() {
    var sources = {};
    var solidityFilter = filter(['*.sol', '**/*.sol'], {restore: true});

    // In order for this test suite to pass, solc must be installed.
    // We also need to grab all the source files first.
    before(function (done) {
        testenv.get_source_files(testenv.golden_package_dir, function (files) {
            sources = files;
            done();
        });
    });

    it("knows when solc is installed", function() {
        assert(NativeCompiler.isAvailable());
    });

    it("compile recreates golden solc_out from blank init dir", function() {
        this.timeout(15000);
        var Builder = require('../lib/build');
        var returned = NativeCompiler.compile({sources: sources});
        // Uncomment to make new golden record
        fs.writeJsonSync(testenv.GOLDEN_SOLC_OUT_PATH, returned);
        var golden = testenv.golden.SOLC_OUT();

        assert.deepEqual( returned, golden );
    });
});
