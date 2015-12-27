'use strict';

var Builder = require('./build.js');
var File = require('vinyl');
var through = require('through2');

// This stream wraps built contracts in JSON and Javascript,
// making them easier for frontend developers to work with.
module.exports = function (opts) {
    opts = _.assign({
        export_dapple_headers: false
    }, opts);

    return through.obj(function (file, enc, cb) { 
        var raw_solc_output = JSON.parse(String(file.contents));
        var classes = Builder.removeSolcClutter(raw_solc_output);
        var headers = Builder.extractClassHeaders(classes);

        if (!opts.export_dapple_headers) {
            headers = _.omit(headers, ["Test", "Debug", "Tester"]);
        }

        this.push(new File({
            path: 'js_module.js',
            contents: new Buffer(Builder.compileJsModule(headers))
        }));

        this.push(new File({
            path: 'classes.json',
            contents: new Buffer(JSON.stringify(classes))
        }));

        cb();
    });
};
