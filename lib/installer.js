'use strict';

var _ = require('lodash');
var Dependency = require('./dependency.js');

module.exports = class Installer {
  static install (dependencies, logger) {
    if (Array.isArray(dependencies)) {
      dependencies = _.map(dependencies, (d) => [null, d]);
    } else {
      dependencies = _.pairs(dependencies);
    }

    for (let pair of dependencies) {
      try {
        logger.log('Installing ' + (pair[0] || pair[1]));
        Dependency.fromShortPath(pair[1], pair[0]).install();
        logger.log('Done');
      } catch (e) {
        logger.error(String(e));
      }
    }
  }
};
