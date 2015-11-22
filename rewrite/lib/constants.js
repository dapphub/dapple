// Get stuff from the `const` folder.
"use strict";
var fs = require("./file");

module.exports = new (class Const {
    constructor() {
        var const_directory = __dirname+"/../const";
        this.DEFAULTS_DIRECTORY = const_directory;
        this.DAPPFILE_FILENAME = "dappfile";
        this.DAPPLERC_FILENAME = "_dapplerc";

        this.DAPPLE_VMTEST_CLASSES = {
            'dapple/test.sol': const_directory + "/test.sol",
            'dapple/debug.sol': const_directory + "/debug.sol"
        }
    }
    // Source object you can feed into solc module
    // TODO dapple-buildpack should be a proper package
    get DAPPLE_PACKAGE_SOURCES() {
        var out = {};
        var classpaths = this.DAPPLE_VMTEST_CLASSES;
        for( let path in classpaths ) {
            out[path] = fs.readFileStringSync(classpaths[path]);
        }
        return out;
    }
})();
