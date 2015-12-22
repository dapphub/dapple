"use strict";
var _ = require("lodash");
var fs = require("./file");
var solc = require("solc");
var constants = require("./constants");
var path = require("path");

// This is a static helper class for our streams.
module.exports = class Builder {
    static compileJsModule(header) {
        //TODO constants
        var template = _.template(constants.JS_HEADER_TEMPLATE());
        return template({header: JSON.stringify(header)});
    }

    static extractClassHeaders(classes) {
        return _.mapValues(classes, function(_class, classname) {
            return _.pick(_class, ["interface", "solidity_interface", "bytecode"]);
        });
    }

    static buildSources(sources) {
        var solc_out = solc.compile({sources:sources});
        if( solc_out.errors ) {
            throw solc_out.errors;
        }
        return solc_out;
    }

    // Filters out useless solc output
    static removeSolcClutter(sources) {
        var bad_keys =  ["assembly", "opcodes"];
        return _.mapValues(sources, function(_class, classname) {
            var omitted = _.omit(_class, bad_keys);
            return omitted;
        });
    }
};
