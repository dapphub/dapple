'use strict';

var _ = require("lodash");
var filter = require('gulp-filter');
var through = require('through2');

// Runs and expands any Lodash template directives in the source code.
module.exports = function (preprocessorVars) {
    return through.obj(function (file, enc, cb) {
        try {
            file.contents = new Buffer(
                _.template(String(file.contents))(preprocessorVars));

        } catch (err) {
            throw new Error("Error preprocessing '" + file.path + "': " + err);
        }

        this.push(file);
        cb();
    });
};

