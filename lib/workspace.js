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
var defaults = require('json-schema-defaults');
var file = require('file');
var _ = require('lodash');

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

  // static getDappfilePath (dir) {
  //   if (existsDappfile) {
  //     var dappfilepath = path.join(root, 'Dappfile');
  //   } else {
  //     console.log(clc.yellow(`WARN: Please rename your "dappfile" to "Dappfile" with a capital D, since the name "dappfile" is deprecated.`));
  //     var dappfilepath = path.join(root, 'dappfile');
  //   }
  // }

  static initialize (root_dir) {
    var dappfilePath = path.join(root_dir, constants.DAPPFILE_FILENAME);
    if (fs.existsSync(dappfilePath)) {
      throw new Error('dappfile already exists');
    }

    var dappfile = req._.extend(
        defaults(schemas.dappfile.schema),
        {name: root_dir.split(path.sep).pop()});
    fs.writeYamlSync(dappfilePath, dappfile);
    fs.mkdirp.sync(path.join(root_dir, '.dapple'));
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
      path: root + '/dappfile',
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

  // DIR_PATH -> [FILES]
  // returns a set of relative pathes
  static getFileSet (dist) {
    var fileset = [];
    file.walkSync(dist, (dirPath, dirs, files) => {
      let fset = files.map(f => dirPath + '/' + f);
      fileset = fileset.concat(fset);
    });
    return fileset;
  }

  // PATH -> [FILES]
  static getFiles (dist) {
    // Edge Cases
    if (!fs.existsSync(dist)) {
      return [];
    } else if (fs.lstatSync(dist).isDirectory()) {
      return Workspace.getFileSet(dist);
    } else {
      return [dist];
    }
  }

  // [FILES] -> [FILES]
  // Filter relevant files
  filterFiles (files) {
    var self = this;
    return files
    .filter((f) => {
      return f !== '' &&
        f !== './dappfile' && // ignore spore.json
        !(/dapple_packages\//).test(f) && // ignore spore_packages dirs
        !(/\/\.|^\./).test(f) && // ignores dot directories
        (self.dappfile.ignore || [])
          .map(ignore => !(new RegExp(ignore)).test(f))
          .reduce((a, b) => a && b, true);
    });
  }

  get dappfile () {
    return this._dappfile || {};
  }

  getName (filePath) {
    return this.getDappfile(filePath).name;
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
    return this.getLayout(filePath).packages_directory ||
           constants.PACKAGES_DIRECTORY;
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
    return seen[seen.length - 1];
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

  addDependency (name, version) {
    if (!this.dappfile.dependencies) {
      this.dappfile.dependencies = {};
    }
    if (name in this.dappfile.dependencies) {
      throw new Error(`Package "${name}" is already listed as a dependency.`);
    }
    this.dappfile.dependencies[name] = version;
  }

  addSubDappfile (packagePath, dappfile) {
    if (!fs.statSync(packagePath).isDirectory()) {
      packagePath = path.dirname(packagePath);
    }
    this.subDappfiles[packagePath] = dappfile;
  }

  getDependencies () {
    return this.dappfile.dependencies || {};
  }

  // recieves a path String, resolves it and whitelists all paths for inclusion
  // to a package
  addPath (path) {
    var files = this.filterFiles(Workspace.getFiles(path));
    if (!this.dappfile.files) {
      this.dappfile.files = [];
    }
    let diff = _.difference(files, this.dappfile.files);

    if (diff.length > 0) {
      this.dappfile.files = diff.concat(this.dappfile.files);
      console.log(`added: \n  ${ diff.join('\n  ') }`);
      this.writeDappfile();
    }
  }

  // recieves a path String, adds it to the current ignore list and removes
  // all added packages which are now marked as ignored
  ignorePath (path) {
    if (!this.dappfile.ignore) {
      this.dappfile.ignore = [];
    }
    if (this.dappfile.ignore.indexOf(path) === -1) {
      this.dappfile.ignore.push(path);
      let filtered = this.filterFiles(this.dappfile.files);
      let diff = _.difference(this.dappfile.files, filtered);
      this.dappfile.files = filtered;
      console.log(`ignoring "${path}": \n  ${ diff.join('\n  ') }`);
      this.writeDappfile();
    }
  }

};
