'use strict';

var _ = require('lodash');
var Linker = require('../linker.js');
var through = require('through2');

module.exports = function(logger) {
    if (!logger) logger = console;

    return through.obj(function (file, enc, cb) {
        logger.log(file.path);
        this.push(file);
        cb();
    });
};
