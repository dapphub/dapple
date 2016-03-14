'use strict';

var through = require('through2');
var _ = require('lodash');
var Ipfs = require('../ipfs.js');
var schemas = require('../schemas.js');
var Dapphubdb = require('../dapphub_registry.js');
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
      var link = ipfs.addJsonSync(Class);
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
      var dapphubdb = new Dapphubdb.Class(web3, 'morden');
      var dapphub = dapphubdb.objects.dapphubdb;

      var version = header.version.split('.');
      let major = version[0];
      let minor = version[1];
      let patch = version[2];

      // PUBLISH the actual package
      // TODO - test if auth is valid and version is bigger then on the db
      dapphub.setPackage(header.name, major, minor, patch, headerHash, {
        from: web3.eth.coinbase,
        gas: 200000
      }, function (err, res) {
        if (err) throw err;
        var filter = dapphub.allEvents(function (err, res) {
          if (err || !res) throw err;
          console.log(`PUBLISH ${header.name}@${major}.${minor}.${patch}: ${headerHash}`);
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
