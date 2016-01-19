'use strict';

// Don't load the streams until they're requested.
module.exports = require('lazreq')({
    build: "./streams/build.js",
    cli_out: "./streams/cli_out.js",
    linker: "./streams/linker.js",
    linker_filter: "./streams/linker_filter.js",
    ignore: "./streams/ignore.js",
    inject_virtual_contracts: "./streams/inject_virtual_contracts.js",
    js_postprocess: "./streams/js_postprocess.js",
    package_build_filter: "./streams/package_build_filter_stream.js",
    package_stream: "./streams/package_stream.js",
    preprocess: "./streams/preprocess.js",
    test: "./streams/test.js",
    test_summarizer: "./streams/test_summarizer.js",
    file_logger: "./streams/file_logger.js"
});
