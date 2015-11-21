// dapple workspace and dev environment object
// all interactions with the filestystem should be contained to this module
// dapplerc, dappfile, subpackages, etc
"use strict";
var yaml = require("read-yaml");
let DAPPFILE_FILENAME = "dappfile";
let dapple_class_sources = {
    'dapple/test.sol': __dirname+"/../defaults/dapple_virtual_package/test.sol",
    'dapple/debug.sol': __dirname+"/../defaults/dapple_virtual_package/debug.sol"
}

class Dappfile {
    constructor(dappfile_path) {
        this.obj = yaml.sync(dappfile_path);
        console.log("Dappfile constructor with path:", dappfile_path);
        console.log("as object", this.obj);
    }
}

module.exports = class Workspace {
    constructor(path) {
        if( path === undefined ) {
            path = process.cwd();
        }
        // TODO traverse upwards until you hit root or dapplerc
        this.dappfile_dir = path;
        this.dappfile = new Dappfile(this.dappfile_dir +"/"+ DAPPFILE_FILENAME);
        this.dapple_class_sources = dapple_class_sources;
    }
    getSolSources() {
    }
}
