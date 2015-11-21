"use strict";
var fs = require("fs");

module.exports = class Builder {
    constructor(workspace) {
        // Sources files.
        // Keys are aliased path (the path as it appears in solidity file).
        // Values are source file in string form.
        this.workspace = workspace;
        this.sources = {};
    }
    addDappleVirtualPackage() {
        for( path in this.workspace.dapple_class_sources ) {
            this.sources[path] = this.workspace.dapple_class_sources[path];
        }
    }
    readSourceFiles(path_list) {
        var out = {};
        for( var path of path_lis ) {
            out[path] = fs.readFileSync(path).toString();
        }
        return out;
    }
    buildWithDapplePackage(sources) {
        var solc = require("solc");
        var out = solc.compile({sources:sources}, 1);
        if( out.errors ) {
            throw out.errors;
        }
        return out.contracts;
    }
}
