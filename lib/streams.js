'use strict';

module.exports = {
    build: require("./streams/build.js"),
    cli_out: require("./streams/cli_out.js"),
    file_linker: require("./streams/file_linker.js"),
    inject_virtual_contracts: require("./streams/inject_virtual_contracts.js"),
    js_postprocess: require("./streams/js_postprocess.js"),
    package_stream: require("./streams/package_stream.js"),
    preprocess: require("./streams/preprocess.js"),
    test: require("./streams/test.js"),
    test_summarizer: require("./streams/test_summarizer.js")
};
