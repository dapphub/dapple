'use strict';

var _ = require('lodash');
var constants = require('../constants.js');
var Builder = require('../build.js');
var File = require('vinyl');
var path = require('path');
var through = require('through2');

// This stream wraps built contracts in JSON and Javascript,
// making them easier for frontend developers to work with.
module.exports = function (opts) {
  opts = _.assign({
    exportDappleHeaders: false
  }, opts);

  return through.obj(function (file, enc, cb) {
    if (file.path.endsWith('dappfile')) return cb();

    var raw_solc_output = JSON.parse(String(file.contents));
    var classes = Builder.removeSolcClutter(raw_solc_output);

    if (opts.nameFilter) {
      classes = _.pick(classes, _.filter(_.keys(classes), function (name) {
         return opts.nameFilter.test(name);
      }));
    }

    var headers = Builder.extractClassHeaders(classes);

    if (!opts.exportDappleHeaders) {
      headers = _.omit(headers, constants.DAPPLE_HEADERS);
    }

    var env;
    if (opts.environment && opts.environments) {
      env = opts.environments[opts.environment];
    }

    var _opts = {
      env: env, envs: opts.environments, headers: headers, name: opts.name,
      deploy_data: opts.deploy_data
    };

    this.push(new File({
      path: 'js_module.js',
      contents: new Buffer(Builder.compileJsModule(_opts))
    }));

    this.push(new File({
      path: 'classes.json',
      contents: new Buffer(JSON.stringify(classes))
    }));

    for (var envName in opts.environments) {
      this.push(new File({
        path: path.join('environments', envName + '.json'),
        contents: new Buffer(JSON.stringify(opts.environments[envName]))
      }));
    }
    cb();
  });
};
