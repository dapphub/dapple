"use strict";
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");

module.exports = class Builder {
    constructor(workspace) {
        this.workspace = workspace;
    }
    addDappleVirtualPackage(sources) {
        var dapple = constants.DAPPLE_PACKAGE_SOURCES;
        for( let path in dapple ) {
            sources[path] = dapple[path];
        }
        return sources;
    }
    build(build_dir) {
        if( build_dir === undefined ) {
            build_dir = this.workspace.getBuildDir();
        }
        var sources = this.workspace.loadWorkspaceSources();
        sources = this.addDappleVirtualPackage(sources);
        var classes = this.buildSources(sources);
        fs.writeJsonSync(build_dir + "/classes.json", classes);
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
