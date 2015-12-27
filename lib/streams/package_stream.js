'use strict';

var buffer = require('vinyl-buffer');
var File = require('vinyl');
var path = require('path');
var through = require('through2');
var vinyl = require("vinyl-fs");

// This stream gathers all the files relevant to the package in the current
// directory.
module.exports = function (sourceRoot) {
    if (sourceRoot && !sourceRoot.endsWith(path.sep)) {
        sourceRoot += path.sep;
    }

    return vinyl
        .src(['**/*.sol', '**/dappfile'], {cwd: sourceRoot})
        .pipe(buffer())
        .pipe(through.obj(function (file, enc, cb) {

            // Move every file so its path is relative to the
            // `sourceRoot` path passed in.

            // **TODO**: Find a more elegant way of doing this.
            // Perhaps hook into each package's dappfile during
            // the file linking step and handle it then.
            var newPath = file.path;
            if (file.path.startsWith(sourceRoot)) {
                newPath = newPath.replace(sourceRoot, "");
            }

            this.push(new File({
                path: newPath,
                contents: file.contents
            }));
            
            cb();
        }));
};

