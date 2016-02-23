'use strict';

var through = require('through2');
var _ = require('lodash');
var Ipfs = require('../ipfs.js');
var path = require('path');
var schemas = require('../schemas.js');
var Dapphubdb = require('../dapphub_registry.js');
var Web3Factory = require('../web3Factory.js');

var createPackageHeader = function (contracts, rootHash, dappfile, schema) {
  // TODO - validate dappfile

  // TODO - include solc version
  var header = {
    schema: schema,
    name: dappfile.name,
    summery: dappfile.summery || '',
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
  return through.obj(function (file, enc, cb) {
    if (file.path === 'classes.json') {
      var json = JSON.parse(String(file.contents));
      var contracts = {};
      _.each(json, (obj, key) => {
        var Class = {
          bytecode: obj.bytecode,
          interface: JSON.parse(obj.interface),
          solidity_interface: obj.solidity_interface
        };

        var link = ipfs.addJsonSync(Class);
        contracts[key] = link;
      });
      let absPath = path.resolve(opts.path);
      var splitPath = absPath.split(path.sep);
      var dirname = splitPath[splitPath.length - 1];
      var schemaHash = ipfs.addJsonSync(schemas.package.schema);
      var rootHash = ipfs.addSync(absPath, {'r': true, 'w': true})
        .filter(p => p.Name === dirname)[0].Hash;
      var header = createPackageHeader(contracts, rootHash, opts.dappfile, schemaHash);
      var headerHash = ipfs.addJsonSync(header);
      // TODO - call db and add pkg
      var web3 = Web3Factory.JSONRPC(opts);
      var dapphubdb = new Dapphubdb.Class(web3, 'morden');
      var dapphub = dapphubdb.objects.dapphubdb;
      var version = header.version.split('.');
      // TODO - test if auth is valid and version is bigger then on the db
      let major = version[0];
      let minor = version[1];
      let patch = version[2];
      console.log(`PUBLISH ${header.name}@${major}.${minor}.${patch}: ${headerHash}`);
      dapphub.setPackage(header.name, major, minor, patch, headerHash, {
        from: web3.eth.coinbase,
        gas: 200000
      }, function (err, res) {
        if (err) throw err;
        var filter = dapphub.allEvents(function (err, res) {
          console.log(err, res);
          filter.stopWatching();
          cb();
        });
      });
    } else {
      this.push(file);
      cb();
    }
  });
};
