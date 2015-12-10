var ignore = require('gulp-ignore');
var streams = require('../lib/streams');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This file contains collections of streams that have been packaged up into
// discreet "pipelines" which are ultimately themselves streams. This helps keep
// `main.js` clean and easy to read.

// Returns raw output of `solc`.
// **TODO**: Remove need for `sourceRoot` via intelligent file linking.
var BuildPipeline = function (sourceRoot, ignoreGlobs) {

    // Grab all the files relevant to the package.
    return streams.package_stream(sourceRoot)

        // **TODO**: Either implement a hierarchical ignore
        // filter, or determine that files in the "ignore"
        // pattern get filtered out during publishing.
        // Using gulp-ignore directly for now.
        .pipe(ignore.exclude(ignoreGlobs))

        // Inject a couple built-in contracts.
        .pipe(streams.inject_virtual_contracts())

        // **TODO**: Preprocessors.
        //.pipe(streams.preprocessor())
        
        // **TODO**: File linking.
        //.pipe(streams.link_files())

        // **TODO**: Contract linking.
        //.pipe(streams.link_contracts())
        
        // **TODO**: Add any missing steps.
        //.pipe(...)

        // Build!
        .pipe(streams.build());
};


// Builds JS-specific output.
var JSBuildPipeline = function (sourceRoot, ignoreGlobs) {
    return BuildPipeline(sourceRoot, ignoreGlobs)
            .pipe(streams.js_postprocess());
};


var TestPipeline = function (sourceRoot, ignoreGlobs) {
    // **TODO**: Implement testing.
    return BuildPipeline(sourceRoot, ignoreGlobs)
            //.pipe(streams.test())
            .pipe(streams.cli_out());
};


module.exports = {
    BuildPipeline: BuildPipeline,
    JSBuildPipeline: JSBuildPipeline,
    TestPipeline: TestPipeline
};

