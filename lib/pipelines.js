"use strict";

var _ = require('lodash');
var buffer = require('vinyl-buffer');
var Combine = require('stream-combiner')
var filter = require('gulp-filter');
var ignore = require('gulp-ignore');
var loggers = require('../lib/loggers.js');
var path = require('path');
var process = require('process');
var streams = require('../lib/streams');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This file contains collections of streams that have been packaged up into
// discreet "pipelines" which are ultimately themselves streams. This helps keep
// `main.js` clean and easy to read.

var _fillOptionDefaults = function(opts) {
    if (!opts) opts = {};

    var mapAwareLogger = new loggers.MapAwareLogger();
    var defaults = {
        errorHandler: mapAwareLogger.getErrorHandler(),
        ignore: undefined,
        logger: new loggers.Logger(),
        mapAwareLogger: mapAwareLogger,
        packageRoot: process.cwd(),
        preprocessorVars: {},
        sourceRoot: process.cwd(),
        web3: 'internal'
    };

    return _.assign(defaults, opts);
};

// This pipeline gathers together all the raw source files that go into a
// given package.
var SourcePipeline = function (opts) {

    // Defaults
    opts = _fillOptionDefaults(opts);

    var solidityFilter = filter(['*.sol', '**/*.sol'], {restore: true});

    // Grab all the files relevant to the package.
    return Combine(
        streams.package_stream(opts.packageRoot),

        // Only preprocess Solidity source files.
        solidityFilter,

        // **TODO**: Files in the "ignore" pattern
        // should get filtered out during publishing.
        ignore.exclude(opts.ignore),

        // Inject a couple built-in contracts.
        streams.inject_virtual_contracts(),

        // Lodash.template is the default preprocessor.
        streams.preprocess(opts.preprocessorVars),

        // Return filtered-out files to the stream.
        solidityFilter.restore

        // **TODO**: Add any missing steps.
        //...
    );
};

var PackagePipeline = function (opts) {
    return Combine(
        SourcePipeline(opts),
        streams.linker(),
        streams.linker_filter.exclude()
    );
};

// Returns raw output of `solc`.
// **TODO**: Remove need for `sourceRoot` via intelligent file linking.
var BuildPipeline = function (opts) {

    // Defaults
    opts = _fillOptionDefaults(opts);

    var logger = new loggers.MapAwareLogger();
    var solidityFilter = filter(['*.sol', '**/*.sol'], {restore: true});

    return Combine(
        PackagePipeline(opts),
        opts.mapAwareLogger.seedStream(),
        solidityFilter,
        streams.build(opts),
        solidityFilter.restore);
};


// Builds JS-specific output.
var JSBuildPipeline = function (opts) {

    // Defaults
    opts = _fillOptionDefaults(opts);

    if (opts.environment && opts.environments
        && !(opts.environment in opts.environments))
    {
        opts.logger.error("Could not find specified environment in dappfile: "
                          + opts.environment);
        return;
    }
    return Combine(BuildPipeline(opts), streams.js_postprocess(opts));
};

// Grabs pre-built contracts from build directory.
var BuiltClassesPipeline = function (buildDir) {
    return Combine(vinyl.src([buildDir + '/classes.json']), buffer());
};

// Takes built contracts and deploys and runs any test
// contracts among them, emitting the results to the CLI
// and passing them downstream as File objects.
var TestPipeline = function (opts) {

    // Defaults
    opts = _fillOptionDefaults(opts);

    return Combine(
            streams.test(opts), streams.cli_out(),
            streams.test_summarizer(), streams.cli_out());
};


module.exports = {
    BuildPipeline: BuildPipeline,
    BuiltClassesPipeline: BuiltClassesPipeline,
    JSBuildPipeline: JSBuildPipeline,
    PackagePipeline: PackagePipeline,
    SourcePipeline: SourcePipeline,
    TestPipeline: TestPipeline
};

