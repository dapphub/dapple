'use strict';

var _ = require('lodash');
var buffer = require('vinyl-buffer');
var multimatch = require('multimatch');
var path = require('path');
var through = require('through2');
var vinyl = require('vinyl-fs');
var Workspace = require('../workspace.js');

// This stream gathers all the files relevant to the package in the current
// directory.
module.exports = function (packageRoot) {
  if (packageRoot && !packageRoot.endsWith(path.sep)) {
    packageRoot += path.sep;
  }

  let getSourcePatterns = function (workspace, sources) {
    var patterns = [];

    for (let i = 0; i < sources.length; i += 1) {
      let file = sources[i];
      let sourceRoot = workspace.getSourcePath(file.path);
      let packageRoot = workspace.getPackageRoot(file.path);

      patterns.push(path.join(sourceRoot, '*.sol'));
      patterns.push(path.join(sourceRoot, '**', '*.sol'));
      patterns.push(path.join(packageRoot, 'Dappfile'));
      patterns.push(path.join(packageRoot, 'dappfile'));
    }

    for (let glob of workspace.getIgnoreGlobs()) {
      patterns.push('!' + glob);
    }
    return _.uniq(patterns);
  };

  let src = vinyl.src([
    // '.dapple#<{(||)}>#Dappfile',
    // '.dapple#<{(||)}>#dappfile',
    // '.dapple#<{(||)}>#*.sol',
    '**/Dappfile',
    '**/dappfile',
    '*.sol',
    '**/*.sol'
  ], {
    cwd: packageRoot,
    dot: true
  });

  var sources = [];
  return src.pipe(through.obj(function (file, enc, cb) {
    sources.push(file);
    cb();
  }, function (cb) {
    var workspace = new Workspace(sources);
    var patterns = getSourcePatterns(workspace, sources);

    for (let i = 0; i < sources.length; i += 1) {
      if (multimatch(sources[i].path, patterns).length > 0) {
        this.push(sources[i]);
      }
    }

    cb();
  }))
    .pipe(buffer());
};
