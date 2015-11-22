// dapple workspace and dev environment object
// all interactions with the filestystem should be contained to this module
// dapplerc, dappfile, subpackages, etc

"use strict";
var yaml = require("read-yaml");
var fs = require("./file");
var readdir = require("fs-readdir-recursive");

let DAPPFILE_FILENAME = "dappfile";
let DAPPLE_CLASS_SOURCES = {
    'dapple/test.sol': __dirname+"/../defaults/dapple_virtual_package/test.sol",
    'dapple/debug.sol': __dirname+"/../defaults/dapple_virtual_package/debug.sol"
}

class DappfileManager {
    constructor(package_root) {
        this.package_root = package_root;
        this.obj = yaml.sync(package_root +"/"+ DAPPFILE_FILENAME);
    }
    SolSourceDir() {
        var source_dir = this.package_root +"/"+ this.obj.sol_sources;
        return source_dir;
    }
}

module.exports = class Workspace {
    constructor(path) {
        if( path === undefined ) {
            path = process.cwd();
        }
        // TODO traverse upwards until you hit root or dapplerc
        this.dappfile_dir = path;
        this.dappfile = new DappfileManager(this.dappfile_dir);
        this._dapple_class_sources = DAPPLE_CLASS_SOURCES;
    }
    dapple_class_sources() {
        var out = {};
        for( let path in this._dapple_class_sources ) {
            out[path] = fs.readFileStringSync(this._dapple_class_sources[path]);
        }
        return out;
    }
    // get solidity source files for just this package - no sub-packages
    loadWorkspaceSources() {
        var dir = this.dappfile.SolSourceDir();
        var files = readdir(dir);
        files = files.filter(function(file) {
            return file.endsWith(".sol");
        });
        var sources = {};
        files.forEach(function(file) {
            var origin = dir +"/"+ file;
            sources[file] = fs.readFileStringSync(origin);
        });
        return sources;
    }
}
