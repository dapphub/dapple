'use strict';
var _ = require('lodash');
var gutil = require('gulp-util');
var solc = require('solc');
var constants = require('./constants');
var NativeCompiler = require('./native_compiler');

// This is a static helper class for our streams.
module.exports = class Builder {
  static compileJsModule (opts) {
    // TODO constants
    var omit = ['solidity_interface'];
    var template = _.template(constants.JS_HEADER_TEMPLATE(opts.template));
    var headers = {};

    if (!opts.deployData) {
      omit.push('bytecode');
    }

    for (var key in opts.headers) {
      headers[key] = _.omit(opts.headers[key], omit);

      if (headers[key].interface) {
        headers[key].interface = JSON.parse(headers[key].interface);
      }
    }

    return template({
      env: JSON.stringify(opts.env || {}, null, 2)
           .replace(/^/gm, '  ')
           .replace(/^ {2}/, '')
           .replace(/\n/g, '\n  ')
           .replace(/"/g, '\''),
      envs: JSON.stringify(opts.envs || {}, null, 2)
            .replace(/^/gm, '  ')
            .replace(/^ {2}/, '')
            .replace(/\n/g, '\n  ')
            .replace(/"/g, '\''),
      headers: JSON.stringify(headers, null, 2)
               .replace(/^/gm, '  ')
               .replace(/^ {2}/, '')
               .replace(/\n/g, '\n  ')
               .replace(/"/g, '\''),
      name: opts.name,
      globalVar: opts.globalVar,
      deployData: opts.deployData
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
    var compilerOpts = {
      sources: sources
    };

    opts = _.assign({
      logger: console,
      errorHandler: function (err) {
        throw gutil.PluginError('Dapple Build', err);
      }
    }, opts);

    if (NativeCompiler.isAvailable()) {
      opts.logger.info('Using local solc installation...');
      compiler = NativeCompiler;
      compilerOpts = _.assign({
        errorHandler: opts.errorHandler,
        logger: opts.logger,
        optimize: opts.optimize
      }, compilerOpts);
    } else {
      opts.logger.info('No local solc found. Failing over to JS compiler...');
    }

    var solc_out = compiler.compile(compilerOpts);

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
