'use strict';

// Lazy load things we might not need this run.
var req = require('lazreq')({
  buffer: 'vinyl-buffer',
  gutil: 'gulp-util',
  vinyl: 'vinyl-fs'
});

var _ = require('lodash');
var Combine = require('stream-combiner');
var filter = require('gulp-filter');
var loggers = require('../lib/loggers.js');
var streams = require('../lib/streams');
var Workspace = require('../lib/workspace.js');

// This file contains collections of streams that have been packaged up into
// discreet "pipelines" which are ultimately themselves streams. This helps keep
// `main.js` clean and easy to read.

var _fillOptionDefaults = function (opts) {
  if (!opts) opts = {};

  var mapAwareLogger = new loggers.MapAwareLogger();

  var defaults = {
    errorHandler: mapAwareLogger.getErrorHandler(),
    logger: new loggers.Logger(),
    mapAwareLogger: mapAwareLogger,
    packageRoot: Workspace.findPackageRoot() || process.cwd(),
    preprocessorVars: {},
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

    // Inject a couple built-in contracts.
    streams.inject_virtual_contracts(),

    // Lodash.template is the default preprocessor.
    streams.preprocess(opts.preprocessorVars),

    // Return filtered-out files to the stream.
    solidityFilter.restore

  // **TODO**: Add any missing steps.
  // ...
  );
};

// Returns raw output of `solc`.
var BuildPipeline = function (opts) {
  // Defaults
  opts = _fillOptionDefaults(opts);

  var solidityFilter = filter(['*.sol', '**/*.sol'], {restore: true});
  var buildFilter = new streams.PackageBuildFilter();

  return Combine(
    SourcePipeline(opts),
    opts.subpackages ? req.gutil.noop() : buildFilter.seed(),
    streams.linker(),
    streams.linker_filter.exclude(),
    opts.mapAwareLogger.seedStream(),
    solidityFilter,
    streams.build(opts),
    solidityFilter.restore,
    opts.subpackages ? req.gutil.noop() : buildFilter.filter());
};

// Builds JS-specific output.
var JSBuildPipeline = function (opts) {
  // Defaults
  opts = _fillOptionDefaults(opts);
  return Combine(BuildPipeline(opts), streams.js_postprocess(opts));
};

// Grabs pre-built contracts from build directory.
var BuiltClassesPipeline = function (opts) {
  opts = _fillOptionDefaults(opts);

  var buildFilter = new streams.PackageBuildFilter();
  streams.package_stream(opts.packageRoot)
         .pipe(buildFilter.seed());

  return Combine(
    req.vinyl.src([opts.buildRoot + '/classes.json']),
    opts.subpackage ? req.gutil.noop() : buildFilter.filter(),
    req.buffer());
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

// Takes built contracts and runs the deployscript
var RunPipeline = function(opts) {
  // Defaults
  opts = _fillOptionDefaults(opts);
  
  return Combine(
    streams.runscript(opts)
  );
  
}

module.exports = {
  BuildPipeline: BuildPipeline,
  BuiltClassesPipeline: BuiltClassesPipeline,
  JSBuildPipeline: JSBuildPipeline,
  SourcePipeline: SourcePipeline,
  TestPipeline: TestPipeline,
  RunPipeline
};
