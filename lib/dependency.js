'use strict';

var child_process = require('child_process');
var fs = require('./file.js');
var path = require('path');
var req = require('lazreq')({
  constants: './constants.js',
  // dapphub: './dapphub_registry.js',
  deasync: 'deasync',
  ipfsAPI: 'ipfs-api',
  os: 'os',
  Web3Factory: './web3Factory.js',
  Workspace: './workspace.js',
  ipfs: './ipfs.js'
});
var Dapphub = require('dapphub');
var semver = require('semver');

module.exports = class Dependency {
  constructor (path, version, name) {
    this.setName(name || '');
    this.path = path || '';
    this.version = version || '';
    this.packagesDirectory = req.constants.PACKAGES_DIRECTORY;
    this.installedAt = '';

    if (this.hasGitPath() && !version) {
      throw new Error('Git paths must include an exact commit hash!');
    }
  }

  static fromDependencyString (path, name) {
    if (typeof path === 'object') {
      return new Dependency(path.name, path.version, name);
    }

    let gitPathRegex = /^(.+.git)(?:@([a-z0-9]+))$/i;
    if (gitPathRegex.test(path)) {
      let pathPieces = gitPathRegex.exec(path);
      let version = pathPieces[2];
      path = pathPieces[1];
      return new Dependency(path, version, name);
    }
    let pathRegex = /^([^0-9@#][^@#]*)?(?:@?(.+)?)?$/;
    let pathPieces = pathRegex.exec(path);
    let version = pathPieces[2] || path;
    path = pathPieces[1];

    if (name && (semver.valid(version) || version === 'latest')) {
      if (version !== 'latest') {
        version = semver.clean(version);
      }
      path = path || name;
      return new Dependency(path, version, name);
    }

    if (/^@?(ipfs:\/\/)?Qm[A-Za-z0-9]+$/i.test(version || path)) {
      if (!name) {
        name = version ? path : '';
      }
      version = (version || path).replace(/^@?ipfs:\/\//i, '');
      path = 'ipfs://' + version;
    }
    return new Dependency(path, version, name);
  }

  install (opts) {
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
      let installedAt = path.join(this.packagesDirectory, this.getName());
      this.pull(installedAt, opts);
      this.installedAt = installedAt;
      return true;
    }

    let tmpDir = this._getTmpDir();
    this.pull(tmpDir);
    this.setName(req.Workspace.atPackageRoot(tmpDir).dappfile.name);

    let installedAt = path.join(this.packagesDirectory, this.getName());
    fs.copySync(tmpDir, installedAt);
    this.installedAt = installedAt;

    try {
      fs.removeSync(tmpDir);
    } catch (e) {
      throw new Error(this.getName() + ' installed at ' + installedAt +
                      ', but cleanup failed. Please manually delete ' + tmpDir);
    }
    return true;
  }

  hasDappHubPath () {
    return this.getName() && (semver.valid(this.getVersion()) || this.getVersion() === 'latest');
  }

  hasGitPath () {
    return /\.git$/i.test(this.path);
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

  pull (destination, opts) {
    if (this.hasDappHubPath()) {
      console.log(`installing ${this.name}@${this.version} from dapphub`);
      this._pullDappHub(opts, destination);
    } else if (this.hasGitPath()) {
      this._pullGit(destination);
    } else if (this.hasIPFSPath()) {
      let hash = this.getPath().replace(/^ipfs:\/\//i, '');
      this._pullIPFS(hash, destination);
    } else {
      throw new Error('Could not make sense of "' + this.getPath() + '"');
    }
  }

  _pullGit (target) {
    if (!this.hasVersion()) {
      throw new Error('Git paths must include an exact commit hash!');
    }

    let commit = this.getVersion().replace(/^@/, '');

    if (!/^[a-f0-9]+$/i.test(commit)) {
      throw new Error('Invalid commit hash: ' + commit);
    }

    child_process.execSync('git clone ' + this.getPath() + ' ' + target);
    child_process.execSync('git reset --hard ' + commit, {cwd: target});
    child_process.execSync('git submodule init', {cwd: target});
    child_process.execSync('git submodule update', {cwd: target});
  }

  _pullIPFS (rootHash, target) {
    if (!this.__ipfs) {
      let settings = req.Workspace.getDappleRC().environment('live');
      // fuck you semistandard
      let Ipfs = req.ipfs;
      this.__ipfs = new Ipfs(settings);
    }

    // Test connection before proceeding.
    try {
      this.__ipfs.lsSync(rootHash);
    } catch (e) {
      throw new Error('Unable to retrieve directory from IPFS! ' +
                      'Please make sure your IPFS connection settings ' +
                      'in ~/.dapplerc are correct and that you have ' +
                      'supplied the correct IPFS hash.');
    }

    var fileMap = this.__ipfs.mapAddressToFileSync(rootHash);
    console.log(Object.keys(fileMap).length);
    this.__ipfs.checkoutFilesSync(target, fileMap);
  }

  _pullDappHub (opts, target) {
    var _web3;
    if (opts.web3 === 'internal') {
      throw new Error('DappHub registry is not available on internal chains.');
    } else {
      try {
        _web3 = req.Web3Factory.JSONRPC({web3: opts.web3});
      } catch (e) {
        try {
          _web3 = req.Web3Factory.JSONRPC({web3: {host: '104.236.215.91', port: 8545}});
        } catch (e) {
          throw new Error('Unable to connect to Ethereum client: ' + e);
        }
      }
    }

    // TODO - iterate through the list
    let address = opts.environment.registries[0];
    let registryClass = Dapphub.getClasses().DappHubSimpleController;
    let dbClass = Dapphub.getClasses().DappHubDB;
    let dapphub = _web3.eth.contract(JSON.parse(registryClass.interface)).at(address);
    let dapphubdbAddress = dapphub._package_db();
    let dapphubdb = _web3.eth.contract(JSON.parse(dbClass.interface)).at(dapphubdbAddress);
    // let dapphub = new req.dapphub.Class(_web3, 'morden');

    if (this.getVersion() === 'latest') {
      this.path = this.getName();
      this.version = dapphubdb.getLastVersion.call(this.getPath()).join('.');
    }

    // TODO - DEBUG why the fuck this takes so long to call
    let packageHash = dapphubdb.getPackageHash.call(
        this.getPath(), semver.major(this.getVersion()),
        semver.minor(this.getVersion()), semver.patch(this.getVersion()));

    if (!packageHash || /^0x0?$/.test(packageHash)) {
      throw new Error('No IPFS hash found for ' + this.getPath() +
                      '@' + this.getVersion());
    }
    let packageHeaderHash = _web3.toAscii(packageHash);
    console.log(`package id: ${packageHeaderHash}`);

    if (!this.__ipfs) {
      let settings = req.Workspace.getDappleRC().environment('live');
      // fuck you semistandard
      let Ipfs = req.ipfs;
      this.__ipfs = new Ipfs(settings);
    }
    let header = this.__ipfs.catJsonSync(packageHeaderHash);
    // TODO - recursively get the dependencies and install the as well
    this._pullIPFS(header.root, target);
    console.log('rdy');
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
