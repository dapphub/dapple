'use strict';

// Don't load the streams until they're requested.
module.exports = require('lazreq')({
  build: './streams/build.js',
  linker: './streams/linker.js',
  linker_filter: './streams/linker_filter.js',
  ignore: './streams/ignore.js',
  js_postprocess: './streams/js_postprocess.js',
  PackageBuildFilter: './streams/package_build_filter_stream.js',
  package_stream: './streams/package_stream.js',
  file_logger: './streams/file_logger.js',
  publish: './streams/publish.js',
  linkLibraries: './streams/linklibraries.js'
});
