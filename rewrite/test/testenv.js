"use strict";
var chai = require("chai");
var fs = require("../lib/file");
var path = require("path");

module.exports = {
    golden_package_dir: path.join(__dirname, "/testenv/golden_package"),
    GOLDEN_SOLC_OUT_PATH: path.join(__dirname,"/golden/solc_out.json"),
    golden_solc_output: function() {
        return fs.readJsonSync(this.GOLDEN_SOLC_OUT_PATH);
    },
    golden: {
        ROOT: path.join(__dirname, "testenv/golden"),
        SOLC_OUT_PATH: function() {
            return path.join(__dirname,"/golden/solc_out.json");
        },
        SOLC_OUT: function() {
            return fs.readJsonSync(this.SOLC_OUT_PATH())
        },
        INIT_EMPTY_DIR: path.join(__dirname, "golden/golden_init"),
        FILTERED_SOLC_OUT_PATH: path.join(__dirname, "golden/golden_solc_classes_out")
    }
}
