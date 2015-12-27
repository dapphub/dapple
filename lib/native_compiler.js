"use strict";

var _ = require('lodash');
var child_process = require("child_process");
var fs = require('fs-extra');
var os = require('os');
var path = require('path');

module.exports = class NativeCompiler {
    static isAvailable() {
        try {
            child_process.execSync("solc");
        } catch (err) {
            return false;
        }
        return true;
    }

    static compile(input) {
        var sources = input.sources;
        var tmpDir = path.join(os.tmpdir(), 'dapple',
                               String(Math.random()).slice(2));
        fs.emptyDirSync(tmpDir); // Create or empty the directory. 

        _.forIn(sources, (val, key) => {
            fs.outputFileSync(path.join(tmpDir, key), val);
        });

        var output = JSON.parse(child_process.execSync(
                "solc -o - --combined-json abi,bin,interface "
                + Object.keys(sources).join(" "), {cwd: tmpDir}));

        fs.removeSync(tmpDir); // Clean up.

        output.contracts = _.mapValues(output.contracts, function (contract) {
            return {
                "bytecode": contract.bin,
                "interface": contract.abi,
                "solidity_interface": contract.interface
            };
        });
        return output;
    }
};
