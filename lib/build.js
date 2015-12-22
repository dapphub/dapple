"use strict";
var _ = require("lodash");
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");
var os = require("os");
var path = require("path");
var smake = require("gulp-smake");
var streamFromArray = require("stream-from-array");
var vinyl = require("vinyl-fs");
var web3 = new require("web3")();

// This is a static helper class for our streams.
module.exports = class Builder {
    static compileJsModule(header) {
        //TODO constants
        var template = _.template(constants.JS_HEADER_TEMPLATE());
        return template({header: JSON.stringify(header)});
    }

    static extractClassHeaders(classes) {
        return _.mapValues(classes, function(_class, classname) {
            return _.pick(_class, ["interface", "solidity_interface", "bytecode"]);
        });
    }

    // Compiles the passed-in mapping of Solidity source paths to
    // Solidity source code. Prefers a native `solc` installation
    // if one is available. Fails over to a Javascript `solc`
    // implementation if one is not.
    static buildSources(sources) {
        return this.jsBuildSources(sources);

        try {
            return this.nativeBuildSources(sources);

        } catch (err) {
            return this.jsBuildSources(sources);
        }
    }

    static nativeBuildSources(sources) {
        var tmpDir = path.join(os.tmpdir(), 'dapple');
        fs.emptyDirSync(tmpDir);
        // TODO: Find a way to do this without streamFromArray.
        streamFromArray(sources).pipe(vinyl.dest(tmpDir));
        streamFromArray(sources).pipe(smake.build({
            // TODO: Options go here.
        }));
    }

    static jsBuildSources(sources) {
        var solc_out = solc.compile({sources:sources});
        if( solc_out.errors ) {
            throw solc_out.errors;
        }
        return solc_out;
    }

    // Filters out useless solc output
    static removeSolcClutter(sources) {
        var bad_keys =  ["assembly", "opcodes"];
        return _.mapValues(sources, function(_class, classname) {
            var omitted = _.omit(_class, bad_keys);
            return omitted;
        });
    }
};
