'use strict';

var _ = require('lodash');

module.exports = class PackageBuildFilter {
  filter (names) {
    if (!this.contractNames) return [];
    return _.intersection(this.contractNames, names);
  }

  seed (workspace, sources) {
    this.contractNames = [];

    let localSources = _.pick(sources, (_, path) => {
      return path.startsWith(workspace.getSourcePath()) &&
        !path.startsWith(workspace.getPackagesPath());
    });

    // TODO: Find a clean way to share this regex with Linker.
    let contractRegex = /(^\s*(contract|library)\s*)([^\{\s]+)/gm;

    for (let path in localSources) {
      let source = localSources[path];

      let match;
      while ((match = contractRegex.exec(source)) !== null) {
        this.contractNames.push(match[3]);
      }
    }
  }
};
