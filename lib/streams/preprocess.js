'use strict';

var _ = require("lodash");
var through = require('through2');

// Runs and expands any Lodash template directives in the source code.
module.exports = function (preprocessorVars) {
    return through.obj(function (file, enc, cb) {
        file.contents = new Buffer(
            _.template(String(file.contents))(preprocessorVars));
        this.push(file);
        cb();
    });
};

