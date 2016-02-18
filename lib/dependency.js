'use strict';

var child_process = require('child_process');
var fs = require('./file.js');
var path = require('path');
var req = require('lazreq')({
  deasync: 'deasync',
  ipfsAPI: 'ipfs-api',
  os: 'os',
  Workspace: './workspace.js'
});

module.exports = class Dependency {
  constructor (path, version, name) {
    this.setName(name);
    this.path = path;
    this.version = version;
    this.packagesDirectory = 'dapple_packages';
  }

  static fromShortPath (path, name) {
    // Translate from "<author>/<package>" format to a real path.
    let pathRegex = /^([^@#]+)?((#[^@#]+)?(@.+)?)$/;
    let pathPieces = pathRegex.exec(path);
    let version = pathPieces[2];
    path = pathPieces[1];

    if (/^[a-zA-Z_0-9\-]+\/[a-zA-Z_0-9\-]+$/.test(path)) {
      // Github
      path = 'https://github.com/' + path + '.git';
    } else if (/^Qm[A-Za-z0-9]+$/.test(path) && !version) {
      version = path;
      path = 'ipfs://' + path;
    } else if (/^@[a-z0-9]+$/i.test(version)) {
      // IPS
      name = path;
      version = version.slice(1).replace(/^ipfs:\/\//i, '');
      path = 'ipfs://' + version;
    }
    return new Dependency(path, version, name);
  }

  static hasSHA1Fragment (path) {
    return /#[A-Fa-f0-9]+$/.test(path);
  }

  static hasVersionFragment (path) {
    return /@[^@]+$/.test(path);
  }

  install () {
    if (this.getName()) {
      this._throwIfInstalled();
    }

    try {
      fs.accessSync(this.packagesDirectory, fs.W_OK);
    } catch (e) {
      try {
        fs.mkdirSync(this.packagesDirectory);
      } catch (e) {
        throw new Error('Could not access or create ' +
                        this.packagesDirectory + ': ' + e);
      }
    }

    if (this.getName()) {
      this.pull(path.join(this.packagesDirectory, this.getName()));
      return;
    }

    let tmpDir = this._getTmpDir();
    this.pull(tmpDir);
    this.setName(req.Workspace.atPackageRoot(tmpDir).dappfile.name);
    fs.copySync(tmpDir, path.join(this.packagesDirectory, this.getName()));

    try {
      fs.removeSync(tmpDir);
    } catch (e) {
      throw new Error('Cleanup failed! Please manually delete ' + tmpDir);
    }
  }

  hasGithubPath () {
    return (new RegExp('^https://[www\\.]?github\\.com/[a-zA-Z_0-9\\-]+' +
                       '/[a-zA-Z_0-9\\-]+\\.git$', 'i')).test(this.path);
  }

  hasIPFSPath () {
    return /^ipfs:\/\/[A-Za-z0-9]+$/i.test(this.path);
  }

  hasVersion () {
    return this.version !== '';
  }

  getVersion () {
    return this.version;
  }

  getName () {
    return this.name;
  }

  setName (name) {
    this.name = name;
  }

  getPath () {
    return this.path;
  }

  toString () {
    return this.getPath() + this.getVersion();
  }

  _getTmpDir () {
    if (!this._tmpDir) {
      this._tmpDir = path.join(req.os.tmpdir(), 'dapple', 'packages',
                               String(Math.random()).slice(2));
      fs.emptyDirSync(this._tmpDir);
    }
    return this._tmpDir;
  }

  pull (destination) {
    if (this.hasGithubPath()) {
      this._pullGit(destination);
    } else if (this.hasIPFSPath()) {
      this._pullIPFS(destination);
    } else {
      throw new Error('Could not make sense of "' + this.getPath() + '"');
    }
  }

  _pullGit (target) {
    child_process.execSync('git clone ' + this.getPath() + ' ' + target);

    if (!this.hasVersion()) return;

    let versionParts = /^(?:#([^@#]+))?(?:@(.+))?$/.exec(this.getVersion());
    let branch = versionParts[1];
    let commit = versionParts[2];

    // Below regex monstrosity swiped from
    // http://stackoverflow.com/questions/12093748
    // /how-do-i-check-for-valid-git-branch-names
    let invalidBranchRegex = new RegExp(
        '^(?!.*/\\.)(?!.*\\.\\.)(?!/)(?!.*//)(?!.*@\\{)(?!.*\\\\)' +
        '[^\\040\\177 ~^:?*[]+/[^\\040\\177 ~^:?*[]+$');

    if (invalidBranchRegex.test(branch)) {
      throw new Error('Invalid branch name: ' + branch);
    }

    if (branch) {
      child_process.execSync('git checkout ' + branch);
    }

    if (!/^[a-f0-9]+$/i.test(commit)) {
      throw new Error('Invalid commit hash: ' + commit);
    }

    if (commit) {
      child_process.execSync('git reset --hard ' + commit);
    }
  }

  _pullIPFS (target) {
    let settings = req.Workspace.getDappleRC().environment('live').ipfs;
    let ipfs = req.ipfsAPI(settings.host, settings.port);
    let rootHash = this.getPath().replace(/^ipfs:\/\//i, '');
    let ls = req.deasync(ipfs.ls);
    let cat = req.deasync(ipfs.cat);
    let types = { dir: 1, file: 2 };

    // Test connection before proceeding.
    try {
      ls(rootHash);
    } catch (e) {
      throw new Error('Unable to retrieve directory from IPFS! ' +
                      'Please make sure your IPFS connection settings ' +
                      'in ~/.dapplerc are correct and that you have ' +
                      'supplied the correct IPFS hash.');
    }

    function pullIPFS (hash, dest, type) {
      if (type === types.dir) {
        fs.ensureDirSync(dest);
        let links = ls(hash).Objects[0].Links;

        for (let i = 0; i < links.length; i += 1) {
          pullIPFS(links[i].Hash,
                   path.join(dest, links[i].Name),
                   links[i].Type);
        }
      } else if (type === types.file) {
        fs.writeFileSync(dest, cat(hash).read());
      } else {
        throw new Error('Unknown IPFS type "' + type + '" at ' +
                        hash + ' while pulling ' + rootHash);
      }
    }

    pullIPFS(rootHash, target, types.dir);
  }

  _throwIfInstalled () {
    let target = path.join(this.packagesDirectory, this.getName());
    let alreadyInstalled = false;

    try {
      fs.accessSync(target, fs.R_OK);
      alreadyInstalled = true;
    } catch (e) {}

    if (alreadyInstalled) {
      throw new Error(this.getName() + ' is already installed.');
    }
  }
};
