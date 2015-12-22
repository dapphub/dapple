'use strict';

var _ = require("lodash");
var buffer = require('vinyl-buffer');
var Builder = require('./build.js');
var clc = require("cli-color-tty")(true);
var constants = require('./constants');
var Contract = require("./contract");
var deasync = require("deasync");
var File = require('vinyl');
var LogTranslator = require('./logtranslator');
var path = require('path');
var RLP = require('rlp');
var through = require('through2');
var vinyl = require("vinyl-fs");
var VMTest = require('./vmtest');
var Web3Factory = require("./web3Factory");

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

            // Move every file so its path is relative to the
            // `sourceRoot` path passed in.

            // **TODO**: Find a more elegant way of doing this.
            // Perhaps hook into each package's dappfile during
            // the file linking step and handle it then.
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

// Runs and expands any Lodash template directives in the source code.
var preprocess = function (preprocessorVars) {
    return through.obj(function (file, enc, cb) {
        file.contents = new Buffer(
            _.template(String(file.contents))(preprocessorVars));
        this.push(file);
        cb();
    });
};

// This stream takes Solidity contract files and hands them off to the Solidity
// compiler and passes it on.
var build = function () {
    var sources = {};

    return through.obj(function (file, enc, cb) {
        if (file.path.endsWith(".sol")) {
            sources[file.path] = String(file.contents);
        }
        cb();

    }, function (cb) {
        var solc_out = Builder.buildSources(sources);

        this.push(new File({
            path: 'classes.json',
            contents: new Buffer(JSON.stringify(solc_out.contracts))
        }));
    });
};

var js_postprocess = function (opts) {
    opts = _.assign({
        export_dapple_headers: false
    }, opts);

    return through.obj(function (file, enc, cb) { 
        var raw_solc_output = JSON.parse(String(file.contents));
        var classes = Builder.removeSolcClutter(raw_solc_output);
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


// This stream takes the output of either the build stream or pipeline (they
// produce the same output) and returns a stream of files containing the output
// of running each `Test` contract. A special, non-standard `error` flag is set
// on File objects representing failed tests. This allows the `cli_out` stream
// to push the content of those files to `stderr` instead of `stdout`.
var test = function () {
    return through.obj(function (file, enc, cb) {
        var that = this;
        var classes = JSON.parse(String(file.contents));

        for (var className in classes) {
            // **TODO**: See if there's a more robust
            // way to determine if the class is a test.
            if (!/^.+Test$/.test(className)) {
                continue;
            }

            try {
                var contract = new Contract(classes[className]);

            } catch(err) {
                return cb(err);
            }

            // **TODO**: Parallelize local execution in EVMs.
            // (Run tests asynchronously, cache EVM instances,
            // and block in the "flush" function until all the
            // tests have been run and pushed.)
            var remaining = -1;
            var web3 = Web3Factory.EVM();
            var logTranslator = new LogTranslator(contract.abi);
            var vmtest = new VMTest(web3, contract, logTranslator);
            vmtest.run(function(err, result) {
                var color = clc.green;

                if (result.failed) {
                    color = clc.red;
                }

                // TODO: Clean this up. We want it to be
                // easy to have special log formatting for
                // particular types of events, and this is
                // a discreet logical chunk that belongs in
                // its own function or class somewhere.
                var output = result.title + "\n";
                var logPrefix = "  LOG:  "

                for (let entry of result.logs) {
                    output += logPrefix + entry.event + "\n";

                    for (let arg of _.pairs(entry.args)) {
                        output += logPrefix + "  "
                                  + arg[0] + ": " + arg[1] + "\n";
                    }
                }
                output += "  " + color(result.message) + "\n";

                var file = new File({
                    path: path.join(
                        className,
                        result.title + (result.failed ? '.stderr' : '.stdout')),
                    contents: new Buffer(output)
                });
                that.push(file);

                remaining = result.remaining;
            });

            deasync.loopWhile(() => remaining != 0);
        }
        cb();
    });
};

var test_summarizer = function () {
    var totalTests = 0;
    var failingTests = [];

    return through.obj(function (file, enc, cb) {
        if (/\.stderr$/.test(file.path)) {
            failingTests.push(file);
        }
        totalTests += 1;
        cb();

    }, function (cb) {
        var ext = ".stdout";
        var output = clc.green("Passed all tests!")

        if (failingTests.length > 0) {
            ext = ".stderr";
            output = clc.red(
                "Failed " + failingTests.length
                + " out of " + totalTests + " tests.\n\n");

            var failedOutput = "";
            for (let failingTest of failingTests) {
                failedOutput += clc.red(path.dirname(failingTest.path)
                                + ": " + path.basename(failingTest.path, ext))
                                + "\n";
            }

            this.push(new File({
                path: path.join("Failing Tests", "summary" + ext),
                contents: new Buffer(failedOutput)
            }));
        }

        this.push(new File({
            path: path.join("Summary", "summary" + ext),
            contents: new Buffer(output)
        }));

        cb();
    });
};


var cli_out = function () {
    var lastDirectory;

    return through.obj(function (file, enc, cb) {
        var out = console.log;

        if (/\.stderr$/.test(file.path)) {
           out = console.error;
        }

        if (lastDirectory != path.dirname(file.path)) {
           lastDirectory = path.dirname(file.path);
           console.log("\n" + clc.bold(lastDirectory));
        }
        out("  " + String(file.contents));
        this.push(file);
        cb();

    });
};


module.exports = {
    build: build,
    cli_out: cli_out,
    file_linker: file_linker,
    inject_virtual_contracts: inject_virtual_contracts,
    js_postprocess: js_postprocess,
    package_stream: package_stream,
    preprocess: preprocess,
    test: test,
    test_summarizer: test_summarizer
};
