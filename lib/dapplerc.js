'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var fs = require('../lib/file.js');
var path = require('path');
var userHome = require('user-home');

module.exports = class DappleRC {

    static writeSync(path, data) {
        return fs.writeYamlSync(path, data);
    }

    static validate(rc) {
        assert(rc, "dapplerc has no data!");
        assert('environments' in rc, "dapplerc has no environments key!");
    }

    validateSelf() {
        DappleRC.validate(this.data);
    }

    constructor(opts) {
        // Set default values for unspecified options.
        opts = _.assign({
            paths: ['/etc/dapple/config', path.join(userHome, '.dapplerc')]
        }, opts);

        // Find the first path that exists.
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

        // Throw an exception if our configuration doesn't
        // conform to the Dapple config schema.
        this.validateSelf();

        // Fill in default values.
        // First make sure our "default" key is set.
        if (!("default" in this.data.environments)) {
            this.data.environments.default = {};
        }

        // Then fill in any options that have been left out
        // with our default values.
        for (let env in this.data.environments) {
            if (this.data.environments[env] == "default") {
                this.data.environments[env] = this.data.environments.default;

            } else {
                this.data.environments[env] = _.assign(
                    _.cloneDeep(this.data.environments.default),
                    this.data.environments[env]);
            }
        }
    }
}
