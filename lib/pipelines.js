"use strict";

var buffer = require('vinyl-buffer');
var Combine = require('stream-combiner')
var ignore = require('gulp-ignore');
var streams = require('../lib/streams');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This file contains collections of streams that have been packaged up into
// discreet "pipelines" which are ultimately themselves streams. This helps keep
// `main.js` clean and easy to read.

// This pipeline gathers together all the files that go into a given package.
var PackagePipeline = function (sourceRoot, ignoreGlobs) {

    // Grab all the files relevant to the package.
    return Combine(
        streams.package_stream(sourceRoot),

        // **TODO**: Either implement a hierarchical ignore
        // filter, or determine that files in the "ignore"
        // pattern get filtered out during publishing.
        // Using gulp-ignore directly for now.
        ignore.exclude(ignoreGlobs),

        // Inject a couple built-in contracts.
        streams.inject_virtual_contracts());
};


// Returns raw output of `solc`.
// **TODO**: Remove need for `sourceRoot` via intelligent file linking.
var BuildPipeline = function (
        sourceRoot, ignoreGlobs, preprocessorVars, logger) {

    return Combine(
        PackagePipeline(sourceRoot, ignoreGlobs),

        // Lodash.template is the default preprocessor.
        streams.preprocess(preprocessorVars),
        
        // **TODO**: File linking.
        //streams.link_files(),

        // **TODO**: Contract linking.
        //streams.link_contracts(),
        
        // **TODO**: Add any missing steps.
        //...

        // Build!
        streams.build(logger));
};


// Builds JS-specific output.
var JSBuildPipeline = function (
        sourceRoot, ignoreGlobs, preprocessorVars, logger) {
    return Combine(
            BuildPipeline(sourceRoot, ignoreGlobs, preprocessorVars, logger),
            streams.js_postprocess());
};

// Grabs pre-built contracts from build directory.
var BuiltClassesPipeline = function (buildDir) {
    return Combine(vinyl.src([buildDir + '/classes.json']), buffer());
};

// Takes built contracts and deploys and runs any test
// contracts among them, emitting the results to the CLI
// and passing them downstream as File objects.
var TestPipeline = function () {
    return Combine(
            streams.test(), streams.cli_out(),
            streams.test_summarizer(), streams.cli_out());
};


module.exports = {
    BuildPipeline: BuildPipeline,
    BuiltClassesPipeline: BuiltClassesPipeline,
    JSBuildPipeline: JSBuildPipeline,
    PackagePipeline: PackagePipeline,
    TestPipeline: TestPipeline
};

