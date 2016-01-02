'use strict';

var _ = require('lodash');
var Linker = require('../linker.js');
var through = require('through2');

module.exports = function(attr, logger) {
    if (!attr) attr = "path";
    if (!logger) logger = console;

    return through.obj(function (file, enc, cb) {
        logger.log(file[attr]);
        this.push(file);
        cb();
    });
};
