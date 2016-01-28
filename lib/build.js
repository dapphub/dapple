'use strict';
var _ = require('lodash');
var gutil = require('gulp-util');
var solc = require('solc');
var constants = require('./constants');
var NativeCompiler = require('./native_compiler');

// This is a static helper class for our streams.
module.exports = class Builder {
  static compileJsModule (header, env) {
    // TODO constants
    var template = _.template(constants.JS_HEADER_TEMPLATE());
    return template({
      env: JSON.stringify(env || {}, null, 2)
              .replace(/\n/g, '\n  ')
              .replace(/"/g, '\''),
      header: JSON.stringify(header, null, 2)
              .replace(/\n/g, '\n  ')
              .replace(/"/g, '\'')
    });
  }

  static extractClassHeaders (classes) {
    return _.mapValues(classes, function (_class, classname) {
      return _.pick(_class, ['interface', 'solidity_interface', 'bytecode']);
    });
  }

  // Compiles the passed-in mapping of Solidity source paths to
  // Solidity source code. Prefers a native `solc` installation
  // if one is available. Fails over to a Javascript `solc`
  // implementation if one is not.
  static buildSources (sources, opts) {
    var compiler = solc;
    opts = _.assign({
      logger: console,
      errorHandler: function (err) {
        throw gutil.PluginError('Dapple Build', err);
      }
    }, opts);

    if (NativeCompiler.isAvailable()) {
      opts.logger.info('Using local solc installation...');
      compiler = NativeCompiler;
    } else {
      opts.logger.info('No local solc found. Failing over to JS compiler...');
    }

    var solc_out = compiler.compile({
      sources: sources,
      errorHandler: opts.errorHandler,
      logger: opts.logger
    });

    if (solc_out.errors) {
      return opts.errorHandler(solc_out.errors);
    }
    return solc_out;
  }

  // Filters out useless solc output
  static removeSolcClutter (sources) {
    var bad_keys = ['assembly', 'opcodes'];
    return _.mapValues(sources, function (_class, classname) {
      var omitted = _.omit(_class, bad_keys);
      return omitted;
    });
  }
};
