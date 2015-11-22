// dapple workspace and dev environment object
// all interactions with the filestystem should be contained to this module
// dapplerc, dappfile, subpackages, etc
"use strict";
var yaml = require("read-yaml");
var fs = require("./file");
var readdir = require("fs-readdir-recursive");

let DAPPFILE_FILENAME = "dappfile";
let dapple_class_sources = {
    'dapple/test.sol': __dirname+"/../defaults/dapple_virtual_package/test.sol",
    'dapple/debug.sol': __dirname+"/../defaults/dapple_virtual_package/debug.sol"
}

class Dappfile {
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
        this.dappfile = new Dappfile(this.dappfile_dir);
        this.dapple_class_sources = dapple_class_sources;
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
