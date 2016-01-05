'use strict';

var buffer = require('vinyl-buffer');
var File = require('vinyl');
var path = require('path');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This stream gathers all the files relevant to the package in the current
// directory.
module.exports = function (packageRoot) {
    if (packageRoot && !packageRoot.endsWith(path.sep)) {
        packageRoot += path.sep;
    }

    return vinyl.src([
        'dappfile', '**/dappfile', '*.sol', '**/*.sol'
    ], {cwd: packageRoot}).pipe(buffer());
};

