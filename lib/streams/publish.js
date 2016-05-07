'use strict';

var through = require('through2');
var _ = require('lodash');
var Ipfs = require('../ipfs.js');
var schemas = require('../schemas.js');
var Dapphub = require('dapphub');
// var Dapphubdb = require('../dapphub_registry.js');
var Web3Factory = require('../web3Factory.js');

var createPackageHeader = function (contracts, rootHash, dappfile, schema) {
  // TODO - validate dappfile

  // TODO - include solc version
  var header = {
    schema: schema,
    name: dappfile.name,
    summary: dappfile.summary || '',
    version: dappfile.version,
    solc: {
      version: '--',
      flags: '--'
    },
    tags: dappfile.tags || [],
    root: rootHash,
    contracts: contracts,
    dependencies: dappfile.dependencies || {},
    environments: dappfile.environments || {}
  };
  var valid = schemas.package.validate(header);
  if (!valid) throw Error('header is not valid');
  return header;
};

module.exports = function (opts) {
  var ipfs = new Ipfs(opts);
  var processClasses = function (_classes) {
    var classes = {};
    _.each(JSON.parse(_classes), (obj, key) => {
      var Class = {
        bytecode: obj.bytecode,
        interface: JSON.parse(obj.interface),
        solidity_interface: obj.solidity_interface
      };
      try {
        var link = ipfs.addJsonSync(Class);
      } catch (e) {
        console.log(`ERROR: Could not connect to ipfs: is the daemon running on "${opts.ipfs.host}:${opts.ipfs.port}"?`);
        process.exit();
      }
      classes[key] = link;
    });
    return classes;
  };
  return through.obj(function (file, enc, cb) {
    if (file.path === 'classes.json') {
      // Build Package Header
      var contracts = processClasses(String(file.contents));
      var rootHash = ipfs.addDirSync(opts.path);
      var schemaHash = ipfs.addJsonSync(schemas.package.schema);
      var header = createPackageHeader(contracts, rootHash, opts.dappfile, schemaHash);
      var headerHash = ipfs.addJsonSync(header);

      // Add package to dapphubDb
      var web3 = Web3Factory.JSONRPC(opts);

      let address;
      if ('registries' in opts.environment && opts.environment.registries.length > 0) {
        address = opts.environment.registries[0];
      } else {
        address = Dapphub.getDappfile().environments.morden.objects.simplecontroller.address;
      }
      let registryClass = Dapphub.getClasses().DappHubSimpleController;
      let dapphub = web3.eth.contract(JSON.parse(registryClass.interface)).at(address);

      // var dapphubdb = new Dapphubdb.Class(web3, 'morden');
      // var dapphub = dapphubdb.objects.dapphubdb;

      var version = header.version.split('.');
      let major = version[0];
      let minor = version[1];
      let patch = version[2];
      if (!/^\d+$/.test(major) || !/^\d+$/.test(major) || !/^\d+$/.test(patch)) {
        throw new Error(`Problem with your semver version in header: "${header.version}" has to match /\\d+\\.\\d+\\.\\d+/ e.g. (1.5.1)`);
      }

      var fromAccount;
      if (typeof opts === 'object' &&
          'web3' in opts &&
          'account' in opts.web3) {
        fromAccount = opts.web3.account;
      } else {
        fromAccount = web3.eth.coinbase || web3.eth.accounts[0];
      }

      // PUBLISH the actual package
      // TODO - test if auth is valid and version is bigger then on the db
      dapphub.setPackage(header.name, major, minor, patch, headerHash, {
        from: fromAccount,
        gas: 200000
      }, function (err, res) {
        if (err) throw err;
        if (opts.environment.confirmationBlocks > 0) {
          var filter = dapphub.allEvents(function (err, res) {
            if (err || !res) throw err;
            console.log(`PUBLISH ${header.name}@${major}.${minor}.${patch}: ${headerHash}`);
            filter.stopWatching();
            cb();
          });
        } else {
          console.log(res);
          console.log(`PUBLISH ${header.name}@${major}.${minor}.${patch}: ${headerHash}`);
          cb();
        }
      });
    } else {
      this.push(file);
      cb();
    }
  });
};
