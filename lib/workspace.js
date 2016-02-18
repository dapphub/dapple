// dapple workspace and dev environment object
// ======
// Most interactions with the filestystem should be contained to this module.
// (`.dapplerc`, `dappfile`, subpackages, etc.) This should be one of the few
// stateful modules in all of `lib/dapple`.

/*
A workspace will be initialized when you run any `dapple` command. It is
dapple's internal configuration object and single point of interaction with the
filesystem.

It will look for the `.dapplerc` file in `DAPPLERC` env var or `~/.dapplerc` It
will look for the `dappfile` in all parents in order (like `git` command and
`.git` folder)
*/

'use strict';

var req = require('lazreq')({
  _: 'lodash',
  File: 'vinyl',
  vinyl: 'vinyl-fs'
});

var constants = require('./constants');
var DappleRC = require('./dapplerc.js');
var fs = require('./file');
var path = require('path');
var schemas = require('./schemas.js');
var yaml = require('js-yaml');

module.exports = class Workspace {
  constructor (sources) {
    var _ = req._;
    var dappfiles = _.filter(
      sources, (file) => path.basename(file.path) === 'dappfile');

    if (dappfiles.length === 0) {
      throw new Error('No dappfile found!');
    }

    this.sorted_dappfiles = _.sortBy(dappfiles, function (file) {
      return file.path.split('/').length;
    });

    this._dappfile = {};
    this.package_root = process.cwd();
    if (dappfiles.length > 0) {
      this._dappfile = yaml.safeLoad(
        String(this.sorted_dappfiles[0].contents));
      this.package_root = path.dirname(this.sorted_dappfiles[0].path);
    }
    if (this.package_root === undefined) {
      throw new Error("Couldn't find workspace. Use `dapple init`");
    }
    this.subDappfiles = _.object(_.map(this.sorted_dappfiles,
      (file) => [file.path, yaml.safeLoad(String(file.contents))]));

    var validation = schemas.dappfile.validateResult(this.dappfile);

    if (!validation.valid) {
      throw new Error(
          'Invalid dappfile: ' + this.sorted_dappfiles[0].path + ' : ' +
          (validation.error.dataPath ? validation.error.dataPath + ': ' : '') +
          validation.error.message);
    }
  }

  static create (sources) {
    return new Workspace(sources);
  }

  static initialize (root_dir) {
    fs.writeFileSync(path.join(root_dir, constants.DAPPFILE_FILENAME),
      constants.DEFAULT_DAPPFILE_CONTENTS);
    var dappfile = constants.DEFAULT_DAPPFILE_OBJECT;
    var layout = dappfile.layout || {};
    for (let dir in layout) {
      fs.mkdirp.sync(path.join(root_dir, layout[dir]));
    }
  }

  static atPackageRoot (root) {
    if (!root) {
      root = this.findPackageRoot();
    }

    let file = new req.File({
      path: 'dappfile',
      base: root,
      contents: fs.readFileSync(path.join(root, 'dappfile'))
    });
    return new Workspace([file]);
  }

  static findPackageRoot (command_dir) {
    if (command_dir === undefined) {
      command_dir = process.cwd();
    }

    var location = command_dir;
    do {
      var dappfile_path = path.join(location, constants.DAPPFILE_FILENAME);
      if (fs.existsSync(dappfile_path)) {
        return location;
      }
      location = path.join(location, '..');
    } while (location !== '/');
    return undefined;
  }

  static findBuildPath (command_dir) {
    let root = this.findPackageRoot(command_dir);
    if (!root) {
      return root;
    }

    let dappfile = fs.readYamlSync(path.join(root, 'dappfile')) || {};
    let layout = dappfile.layout || {};
    return path.join(root, layout.build_dir);
  }

  static getDappleRC (opts) {
    return DappleRC.create(opts);
  }

  static writeDappleRC (rcPath, data) {
    return DappleRC.writeSync(rcPath, data);
  }

  get dappfile () {
    return this._dappfile || {};
  }

  getDappfile (filePath) {
    var dappfile;
    if (filePath) {
      dappfile = this.subDappfiles[this.getDappfilePath(filePath)];
    }
    if (!dappfile) {
      dappfile = this.dappfile;
    }
    return dappfile;
  }

  getDappfilePath (filePath) {
    if (!this.sorted_dappfiles || this.sorted_dappfiles.length === 0) {
      return;
    }

    if (!filePath) {
      return this.sorted_dappfiles[0].path;
    }

    for (let i = this.sorted_dappfiles.length - 1; i >= 0; i -= 1) {
      if (filePath.startsWith(path.dirname(
          this.sorted_dappfiles[i].path))) {
        return this.sorted_dappfiles[i].path;
      }
    }
  }

  getPackageRoot (filePath) {
    var dappfilePath = this.getDappfilePath(filePath);
    return dappfilePath ? path.dirname(dappfilePath) : process.cwd();
  }

  getLayout (filePath) {
    return this.getDappfile(filePath).layout || {};
  }

  getBuildDir () {
    return path.join(this.package_root,
      this.getLayout().build_dir || 'build');
  }

  getSourceDir (filePath) {
    return this.getLayout(filePath).sol_sources;
  }

  getSourcePath (filePath) {
    var sourceRoot = this.getPackageRoot(filePath);

    if (this.getSourceDir(filePath)) {
      sourceRoot = path.join(sourceRoot, this.getSourceDir(filePath));
    }

    return sourceRoot;
  }

  getPackagesDir (filePath) {
    return this.getLayout(filePath).packages_directory || 'dapple_packages';
  }

  getPackagesPath (filePath) {
    return path.join(
      this.getPackageRoot(filePath),
      this.getPackagesDir(filePath));
  }

  getIgnoreGlobs () {
    var globs = [];
    for (let dappfilePath in this.subDappfiles) {
      for (let glob of (this.subDappfiles[dappfilePath].ignore || [])) {
        globs.push(path.join(this.getSourcePath(dappfilePath), glob));
      }
    }

    for (let glob of (this.dappfile.ignore || [])) {
      globs.push(path.join(this.getSourceDir(), glob));
    }
    return globs;
  }

  getSourcePaths () {
    var paths = [];
    for (let dappfilePath in this.subDappfiles) {
      let layout = this.getLayout(dappfilePath);
      paths.push(path.resolve(path.join(
        path.dirname(dappfilePath),
        layout.sol_source || '.')));
    }
    return paths;
  }

  getPreprocessorVars (filePath) {
    return this.getDappfile(filePath).preprocessor_vars || {};
  }

  getEnvironment (filePath) {
    return this.getDappfile(filePath).environment || 'default';
  }

  getEnvironments (filePath) {
    return this.getDappfile(filePath).environments;
  }

  resolveEnvironmentName (env) {
    var seen = [];
    while (!(env in seen) && typeof env === 'string') {
      seen.push(env);
      env = this.dappfile.environments[env];
    }
    if (typeof env === 'string') {
      throw new Error('Could not resolve environment "' + env + '"');
    }
    return seen[seen.length-1];
  }

  writeDappfile () {
    return fs.writeYamlSync(this.getDappfilePath(), this.dappfile);
  }

  addObject (env, name, className, address) {
    if (!('environments' in this.dappfile)) {
      this.dappfile.environments = {};
    }
    if (!(env in this.dappfile.environments)) {
      this.dappfile.environments[env] = {};
    }
    env = this.resolveEnvironmentName(env);
    if (!('objects' in this.dappfile.environments[env])) {
      this.dappfile.environments[env].objects = {};
    }
    this.dappfile.environments[env].objects[name] = {
      class: className,
      address
    };
  }

  addDependency (packagePath) {
    if (!this.dappfile.dependencies) {
      this.dappfile.dependencies = [];
    }
    this.dappfile.dependencies.push(packagePath);
    this.dappfile.dependencies.sort();
  }

  addSubDappfile (packagePath, dappfile) {
    if (!fs.statSync(packagePath).isDirectory()) {
      packagePath = path.dirname(packagePath);
    }
    this.subDappfiles[packagePath] = dappfile;
  }

  getDependencies () {
    return this.dappfile.dependencies || [];
  }
};
