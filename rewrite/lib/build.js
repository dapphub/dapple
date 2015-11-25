"use strict";
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");
var _ = require("underscore")._;

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
        var classes = Builder.buildSources(sources);
        fs.writeJsonSync(build_dir + "/classes.json", classes);
        return classes;
    }
    static buildSources(sources) {
        var solc_out = solc.compile({sources:sources});
        if( solc_out.errors ) {
            throw solc_out.errors;
        }
        var classes = solc_out.contracts;
        return classes;
    }
    // Filters out useless solc output
    static filterSolcOut(sources) {
        var bad_keys =  ["assembly", "opcodes"];
        return _.mapObject(sources, function(_class, classname) {
            var omitted = _.omit(_class, bad_keys);
            return omitted;
        });
    }
}
