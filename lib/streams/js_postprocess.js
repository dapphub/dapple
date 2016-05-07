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

    if (!opts.include_tests && 'Test' in classes) {
      var testSignatures = JSON.parse(classes['Test'].interface).map(i => i.name);
      var testRelated = _.map(classes, (obj, name) => {
        let sig = JSON.parse(classes[name].interface).map(i => i.name);
        // console.log(sig);
        if (_.intersection(sig, testSignatures).length > 100) {
          return name;
        }
        return null;
      }).filter(n => n !== null).concat(['Reporter', 'Tester', 'Debug']);
      let goodContracts = _.difference(Object.keys(classes), testRelated);
      classes = _.pick(classes, goodContracts);
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
      deployData: opts.deployData,
      env: env,
      envs: opts.environments,
      globalVar: opts.globalVar,
      headers: headers,
      template: opts.template || 'js_module',
      name: opts.name
    };

    this.push(new File({
      path: _opts.template + '.js',
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
