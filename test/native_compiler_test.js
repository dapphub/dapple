'use strict';

var assert = require('chai').assert;
var filter = require('gulp-filter');
var fs = require("../lib/file");
var NativeCompiler = require("../lib/native_compiler");
var PackagePipeline = require('../lib/pipelines.js').PackagePipeline;
var testenv = require("./testenv");
var through = require('through2');
var Workspace = require("../lib/workspace");

describe("NativeCompiler", function() {
    var sources = {};
    var solidityFilter = filter(['*.sol', '**/*.sol'], {restore: true});

    // In order for this test suite to pass, solc must be installed.
    // We also need to grab all the source files first.
    before(function (done) {
        var workspace = new Workspace(testenv.golden_package_dir);
        PackagePipeline({
            packageRoot: workspace.package_root,
            sourceRoot: workspace.getSourcePath()
        })
            .pipe(solidityFilter)
            .pipe(through.obj(function(file, enc, cb) {
                sources[file.path] = String(file.contents);
                cb();

            }, function (cb) {
                done();
                cb();
            }));
    });

    it("knows when solc is installed", function() {
        assert(NativeCompiler.isAvailable());
    });

    it("compile recreates golden solc_out from blank init dir", function() {
        this.timeout(15000);
        var Builder = require('../lib/build');
        var returned = NativeCompiler.compile({sources: sources});
        // Uncomment to make new golden record
        //fs.writeJsonSync(testenv.GOLDEN_SOLC_OUT_PATH, returned);
        var golden = testenv.golden.SOLC_OUT();

        assert.deepEqual( returned, golden );
    });
});
