// Get stuff from the `const` folder.
"use strict";
var fs = require("./file");
var path = require("path");

module.exports = new (class Const {
    constructor() {
        var constants_directory = path.join(__dirname, "/../constants");
        this.CONSTANTS_DIRECTORY = constants_directory;
        this.DAPPFILE_FILENAME = "dappfile";
        this.DAPPLERC_FILENAME = "_dapplerc";

        this.DAPPLE_VMTEST_CLASSES = {
            'dapple/test.sol': path.join(constants_directory, "/test.sol"),
            'dapple/debug.sol': path.join(constants_directory, "/debug.sol")
        }
    }
    // Source object you can feed into solc module
    // TODO dapple-buildpack should be a proper package
    get DEFAULT_DAPPFILE_CONTENTS() {
        return fs.readFileStringSync(path.join(this.CONSTANTS_DIRECTORY, "init_dappfile"));
    }
    get DEFAULT_DAPPFILE_OBJECT() {
        return JSON.parse(this.DEFAULT_DAPPFILE_CONTENTS);
    }
    get DAPPLE_PACKAGE_SOURCES() {
        var out = {};
        var classpaths = this.DAPPLE_VMTEST_CLASSES;
        for( let path in classpaths ) {
            out[path] = fs.readFileStringSync(classpaths[path]);
        }
        return out;
    }
})();
