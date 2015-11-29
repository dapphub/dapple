"use strict";
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");
var _ = require("underscore")._;
var path = require("path");

module.exports = class Builder {
    constructor(workspace) {
        this.workspace = workspace;
    }
    static addDappleVirtualPackage(sources) {
        var dapple = constants.DAPPLE_PACKAGE_SOURCES;
        for( let path in dapple ) {
            sources[path] = dapple[path];
        }
        return sources;
    }
    // TODO make static
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

        var ignore = this.workspace.dappfile.ignore;
        if( ignore === undefined ) {
            ignore = [];
        }
        sources = _.filter(sources, function(src, path) {
            return _.all(ignore, function(regex) {
                return (new RegExp(regex)).test(path);
            });
        });
        sources = Builder.addDappleVirtualPackage(sources);
        var unfiltered_classes = Builder.buildSources(sources);
        var classes = Builder.filterSolcOut(unfiltered_classes);
        var headers = Builder.extractClassHeaders(classes);
        fs.writeJsonSync(build_dir + "/classes.json", classes);
        if( ! opts.export_dapple_headers ) {
            headers.class_headers = _.omit(headers.class_headers, ["Test", "Debug", "Tester"]);
        }
        var js_module = Builder.compileJsModule(headers);
        fs.writeFileSync(path.join(build_dir, "js_module.js"), js_module);
        return classes;
    }
    static compileJsModule(header) {
        //TODO constants
        var template = _.template(constants.JS_HEADER_TEMPLATE());
        return template({header: JSON.stringify(header)});
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
