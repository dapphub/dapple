// Get stuff from the `defaults` folder.
"use strict";
var fs = require("./file");

module.exports = new (class DappleDefaults {
    constructor() {
        var defaults_directory = __dirname+"/../defaults";
        this.DEFAULTS_DIRECTORY = defaults_directory;
        this.DAPPFILE_FILENAME = "dappfile";
        this.DAPPLERC_FILENAME = "_dapplerc";

        this.DAPPLE_VMTEST_CLASSES = {
            'dapple/test.sol': defaults_directory + "/dapple_virtual_package/test.sol",
            'dapple/debug.sol': defaults_directory + "/dapple_virtual_package/debug.sol"
        }
    }
    // Source object you can feed into solc module
    get DAPPLE_PACKAGE_SOURCES() {
        var out = {};
        var classpaths = this.DAPPLE_VMTEST_CLASSES;
        for( let path in classpaths ) {
            out[path] = fs.readFileStringSync(classpaths[path]);
        }
        return out;
    }
})();
