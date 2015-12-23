"use strict";
var _ = require("lodash");
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");
var fs = require("fs-extra");
var os = require("os");
var path = require("path");
var child_process = require("child_process");
var through = require('through2');
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
        var useNative = true;

        try {
            child_process.execSync("solc");

        } catch (err) {
            useNative = false;
        }

        if (useNative) {
            console.log("Using local solc installation...");
            return this.nativeBuildSources(sources);

        } else {
            console.log("No local solc found. Failing over to JS compiler...");
            return this.jsBuildSources(sources);
        }
    }

    static nativeBuildSources(sources) {
        var tmpDir = path.join(os.tmpdir(), 'dapple',
                               String(Math.random()).slice(2));
        fs.emptyDirSync(tmpDir); // Create or empty the directory. 

        _.forIn(sources, (val, key) => {
            fs.outputFileSync(path.join(tmpDir, key), val);
        });

        var output = JSON.parse(child_process.execSync(
                "solc -o - --combined-json abi,bin,bin-runtime "
                + Object.keys(sources).join(" "), {cwd: tmpDir}));

        fs.removeSync(tmpDir); // Clean up.

        output.contracts = _.mapValues(output.contracts, function (contract) {
            return {bytecode: contract.bin, interface: contract.abi};
        });
        return output;
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
