'use strict';

var _ = require('lodash');
var File = require('vinyl');
var Linker = require('../linker.js');
var through = require('through2');
var Workspace = require('../workspace.js');

// This stream converts all Dapple import statements into their absolute paths.
module.exports = function () {
    var files = [];

    return through.obj(function (file, enc, cb) {
        files.push(file);
        cb();

    }, function(cb) {
        let sourceMap = _.object(
            _.map(files, (f) => [f.path, String(f.contents)]));
        let linkedSources = Linker.link(new Workspace(files), sourceMap);

        for (let sourcePair of _.pairs(linkedSources)) {
            this.push(new File({
                path: sourcePair[0],
                contents: new Buffer(sourcePair[1])
            }));
        }
        cb();
    });
};
