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

    static compileJsModule(header) {
        //TODO constants
        var template = _.template(constants.JS_HEADER_TEMPLATE());
        return template({header: JSON.stringify(header)});
    }

    static extractClassHeaders(classes) {
        return _.mapObject(classes, function(_class, classname) {
            return _.pick(_class, ["interface", "solidity_interface", "bytecode"]);
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
