'use strict';

var _ = require('lodash');
var fs = require('../lib/file.js');
var path = require('path');
var userHome = require('user-home');
var schemas = require('../lib/schemas');

class DappleRC {
  static create (opts) {
    return new DappleRC(opts);
  }

  static writeSync (path, data) {
    return fs.writeYamlSync(path, data);
  }

  static validate (rc) {
    var valid = schemas.dapplerc.validate(rc);

    if (!valid) {
      // TODO: implement a custom error reporter which is displaying a
      // human readable message, the caused data which is foud ad `dataPath`
      // and the plain or formatted shema description for that data found at
      // schemaPath
    //   throw new Error(
    //     tv4.error.message + '\n' +
    //     'error in data: ' + tv4.error.dataPath + '\n' +
    //     'error in schema: ' + tv4.error.schemaPath);
    }
  }

  validateSelf () {
    DappleRC.validate(this.data);
  }

  constructor (opts) {
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
    if (!('default' in this.data.environments)) {
      this.data.environments.default = {};
    }

    // Then fill in any options that have been left out
    // with our default values.
    for (let env in this.data.environments) {
      if (typeof this.data.environments[env] === 'string') continue;
      this.data.environments[env] = _.assign(
        _.cloneDeep(this.data.environments.default),
        this.data.environments[env]);
    }
  }

  environment (name) {
    while (typeof name === 'string') {
      name = this.data.environments[name];
    }
    return name;
  }
}

module.exports = DappleRC;
