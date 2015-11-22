"use strict";
var fs = require("./file");
var solc = require("solc");

module.exports = class Builder {
    constructor(workspace) {
        // Sources files.
        // Keys are aliased path (the path as it appears in solidity file).
        // Values are source file in string form.
        this.workspace = workspace;
        this.sources = {};
    }
    _addDappleVirtualPackage() {
        var sources = this.workspace.dapple_class_sources();
        for( let path in sources ) {
            this.sources[path] = sources[path];
        }
    }
    build() {
        this.sources = this.workspace.loadWorkspaceSources();
        this._addDappleVirtualPackage();
        var solc_out = solc.compile({sources:this.sources});
        if( solc_out.errors ) {
            throw solc_out.errors;
        }
        var built_classes = solc_out.contracts;
        return built_classes;
    }
}
