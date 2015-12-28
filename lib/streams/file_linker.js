'use strict';

var through = require('through2');

// This stream converts all Dapple import statements into their absolute paths.
module.exports = function () {
    return through.obj(function (file, enc, cb) {

        // **TODO**: Grab `src` attribute from package
        // being imported and use it when calculating
        // absolute import paths. This will require
        // some internal state. For now, we'll be naive.

        cb();
    });
};
