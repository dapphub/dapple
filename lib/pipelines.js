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

// This pipeline gathers the build files

// Returns raw output of `solc`.
// **TODO**: Remove need for `sourceRoot` via intelligent file linking.
var BuildPipeline = function (sourceRoot, ignoreGlobs) {

    return Combine(
        PackagePipeline(sourceRoot, ignoreGlobs),

        // **TODO**: Preprocessors.
        //streams.preprocessor(),
        
        // **TODO**: File linking.
        //streams.link_files(),

        // **TODO**: Contract linking.
        //streams.link_contracts(),
        
        // **TODO**: Add any missing steps.
        //...

        // Build!
        streams.build());
};


// Builds JS-specific output.
var JSBuildPipeline = function (sourceRoot, ignoreGlobs) {
    return Combine(
            BuildPipeline(sourceRoot, ignoreGlobs),
            streams.js_postprocess());
};

var BuiltClassesPipeline = function (buildDir) {
    return Combine(vinyl.src([buildDir + '/classes.json']), buffer());
};

var TestPipeline = function () {
    // **TODO**: Implement testing.
    return Combine(streams.test(), streams.cli_out());
};


module.exports = {
    BuildPipeline: BuildPipeline,
    BuiltClassesPipeline: BuiltClassesPipeline,
    JSBuildPipeline: JSBuildPipeline,
    PackagePipeline: PackagePipeline,
    TestPipeline: TestPipeline
};

