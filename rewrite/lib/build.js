"use strict";
var fs = require("./file");
var solc = require("solc");
var defaults = require("./defaults");

module.exports = class Builder {
    constructor(workspace) {
        this.workspace = workspace;
    }
    _addDappleVirtualPackage(sources) {
        var dapple = defaults.DAPPLE_PACKAGE_SOURCES;
        for( let path in dapple ) {
            sources[path] = dapple[path];
        }
        return sources;
    }
    build(build_dir) {
        var sources = this.workspace.loadWorkspaceSources();
        sources = this._addDappleVirtualPackage(sources);
        var classes = this.buildSources(sources);
        if( build_dir ) {
            fs.writeJsonSync(build_dir + "/classes.json", classes);
        }
        return classes;
    }
    buildSources(sources) {
        var solc_out = solc.compile({sources:sources});
        if( solc_out.errors ) {
            throw solc_out.errors;
        }
        var classes = solc_out.contracts;
        return classes;
    }
}
