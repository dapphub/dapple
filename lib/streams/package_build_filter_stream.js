'use strict';

var _ = require('lodash');
var constants = require('../constants.js');
var File = require('vinyl');
var PackageBuildFilter = require('../package_build_filter.js');
var through = require('through2');
var Workspace = require('../workspace.js');

module.exports = class PackageBuildFilterStream {
  constructor () {
    this._filter = new PackageBuildFilter();
  }

  seed () {
    var that = this;
    that.sources = [];

    return through.obj(function (file, enc, cb) {
      that.sources.push(file);
      this.push(file);
      cb();
    }, function (cb) {
      that._filter.seed(
        new Workspace(that.sources),
        _.assign.apply(this, _.map(that.sources, (f) => ({[f.path]: f.contents}))));
      cb();
    });
  }

  filter () {
    var that = this;

    return through.obj(function (file, enc, cb) {
      if (file.path.endsWith('.json')) {
        let json = JSON.parse(file.contents);
        let keys = that._filter.filter(_.keys(json))
          .concat(constants.DAPPLE_HEADERS);
        let newJSON = _.pickBy(
          json, (val, key) => _.includes(keys, key)
        );
        this.push(new File({
          base: file.base,
          path: file.path,
          contents: new Buffer(JSON.stringify(newJSON))
        }));
      } else {
        this.push(file);
      }
      cb();
    });
  }
};

