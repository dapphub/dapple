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
        logger.log('Retrieving ' + (pair[0] || pair[1]));
        let dependency = Dependency.fromShortPath(pair[1], pair[0]);
        dependency.install();
        logger.log('Installed ' + dependency.getName() + ' at ' +
                   dependency.installedAt);
      } catch (e) {
        logger.error(String(e));
      }
    }
  }
};
