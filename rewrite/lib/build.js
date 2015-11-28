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
    build(build_dir, opts) {
        if( opts === undefined ) {
            opts= {
                export_dapple_headers: false
            };
        }
        if( build_dir === undefined ) {
            build_dir = this.workspace.getBuildDir();
        }
        var sources = this.workspace.loadWorkspaceSources();
        sources = this.addDappleVirtualPackage(sources);
        var unfiltered_classes = Builder.buildSources(sources);
        var classes = Builder.filterSolcOut(unfiltered_classes);
        fs.writeJsonSync(build_dir + "/classes.json", classes);
        var headers = Builder.assembleDappHeader({testobj:"0x0"}, classes);
        if( ! opts.export_dapple_headers ) {
            headers.class_headers = _.omit(headers.class_headers, ["Test", "Debug", "Tester"]);
        }
        fs.writeJsonSync(build_dir+"/header.json", headers);
        return classes;
    }
    static assembleDappHeader(objects, classes) {
        var headers = Builder.extractClassHeaders(classes);
        return {
            objects: objects,
            class_headers: Builder.extractClassHeaders(classes)
        }
    }
    static extractClassHeaders(classes) {
        return _.mapObject(classes, function(_class, classname) {
            return _.pick(_class, ["interface", "solidity_interface"]);
        });
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
