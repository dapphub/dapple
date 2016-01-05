'use strict';

var _ = require('lodash');
var File = require('vinyl');
var Linker = require('../linker.js');
var through = require('through2');

// This stream converts all Dapple import statements into their absolute paths.
module.exports = function () {
    var sources = {};

    return through.obj(function (file, enc, cb) {
        sources[file.path] = String(file.contents);
        cb();

    }, function(cb) {
        var linkedSources = Linker.link(sources);
        for (let sourcePair of _.pairs(linkedSources)) {
            this.push(new File({
                path: sourcePair[0],
                contents: new Buffer(sourcePair[1])
            }));
        }
        cb();
    });
};
