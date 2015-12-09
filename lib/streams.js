var _ = require("underscore")._;
var buffer = require('vinyl-buffer');
var Builder = require('./build.js');
var constants = require('./constants');
var File = require('vinyl');
var path = require('path');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This stream gathers all the files relevant to the package in the current
// directory.
var package_stream = function (sourceRoot) {
    if (sourceRoot && !sourceRoot.endsWith(path.sep)) {
        sourceRoot += path.sep;
    }

    return vinyl
        .src(['**/*.sol', '**/dappfile', 'dappfile'])
        .pipe(buffer())
        .pipe(through.obj(function (file, enc, cb) {

            // **TODO**: Find a more elegant way of doing this.
            // Perhaps hook into each package's dappfile during
            // the file linking step and handle it then.

            // Move every file so its path is relative to the
            // `sourceRoot` path passed in.
            var newPath = file.path;
            if (file.path.startsWith(sourceRoot)) {
                newPath = newPath.replace(sourceRoot, "");
            }

            this.push(new File({
                path: newPath,
                contents: file.contents
            }));
            
            cb();
        }));
};

// This stream injects some built-in contracts for the other contracts to use.
var inject_virtual_contracts = function () {
    return through.obj(

        // No-op. We aren't interested in transforming...
        (file, enc, cb) => cb(null, file),

        // ...we're more interested in injecting.
        function (cb) {
            var sources = constants.DAPPLE_PACKAGE_SOURCES;

            for (var path in sources) {
                this.push(new File({
                    path: path,
                    contents: new Buffer(sources[path])
                }));
            }
            cb();
        });
}; 

// This stream converts all Dapple import statements into their absolute paths.
var file_linker = function () {
    return through.obj(function (file, enc, cb) {

        // **TODO**: Grab `src` attribute from package
        // being imported and use it when calculating
        // absolute import paths. This will require
        // some internal state. For now, we'll be naive.

        cb();
    });
};

// This stream takes Solidity contract files and hands them off to the Solidity
// compiler, post-processes the output, and passes it on.
var build = function (opts) {
    opts = _.extend({
        export_dapple_headers: false
    }, opts);

    var sources = {};

    return through.obj(function (file, enc, cb) {
        if (file.path.endsWith(".sol")) {
            sources[file.path] = String(file.contents);
        }
        cb();

    }, function (cb) {
        // **TODO**: Either split this stream up into two parts,
        // or add an optional "postprocess" function parameter to
        // allow for different kinds of post-processing.

        var unfiltered_classes = Builder.buildSources(sources);
        var classes = Builder.filterSolcOut(unfiltered_classes);
        var headers = Builder.extractClassHeaders(classes);

        if (!opts.export_dapple_headers) {
            headers = _.omit(headers, ["Test", "Debug", "Tester"]);
        }

        this.push(new File({
            path: 'js_module.js',
            contents: new Buffer(Builder.compileJsModule(headers))
        }));

        this.push(new File({
            path: 'classes.json',
            contents: new Buffer(JSON.stringify(classes))
        }));

        cb();
    });
};

module.exports = {
    build: build,
    file_linker: file_linker,
    inject_virtual_contracts: inject_virtual_contracts,
    package_stream: package_stream
};
