'use strict';

var _ = require('lodash');
var fs = require('../lib/file.js');
var path = require('path');
var userHome = require('user-home');

module.exports = class DappleRC {
    constructor(opts) {
        // Set default values for unspecified options.
        opts = _.assign({
            paths: ['/etc/dapple/config', path.join(userHome, '.dapplerc')]
        }, opts);

        for (let p of opts.paths) {
            try {
                fs.accessSync(p, fs.R_OK);
                this.path = p;
                break;
            } catch (e) {}
        }

        // Stop now if we could not load a config file.
        if (!this.path) return;

        // Load config
        this.data = fs.readYamlSync(this.path);
    }
}
