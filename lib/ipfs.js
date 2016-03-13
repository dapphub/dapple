'use strict';

var ipfs = require('ipfs-js');
var ipfsAPI = require('ipfs-api');
var deasync = require('deasync');
var async = require('async');
var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');

module.exports = class IPFS {

  constructor (opts) {
    ipfs.setProvider(
      ipfsAPI(opts.ipfs.host, opts.ipfs.port));
  }

  getSync (hash, destination_path, recursive) {
    if (recursive !== undefined) {
    }
  }

  // addSync (hash, source_path, recursive) {}
  addJsonSync () { return deasync(ipfs.addJson).apply(this, arguments); }
  lsSync () { return deasync(ipfs.api.ls).apply(this, arguments); }
  catSync () { return deasync(ipfs.cat).apply(this, arguments); }
  addSync () { return deasync(ipfs.api.add).apply(this, arguments); }
  catJsonSync () { return deasync(ipfs.catJson).apply(this, arguments); }

  // IPFS-Hash -> [PATH]
  mapAddressToFileSync () {
    var self = this;
    var mapAddressToFile = function (addr, absPath, cb) {
      var node = self.lsSync(addr);
      var dirs = node.Objects[0].Links
      .filter(n => { return n.Type === 1; })
      .map(n => {
        return (cb) => {
          mapAddressToFile(n.Hash, absPath + n.Name + '/', cb);
        };
      });
      var files_ = node.Objects[0].Links
      .filter(n => { return n.Type === 2; })
      // .map( n => { return absPath + n.Name; });
      .map(n => { return {[absPath + n.Name]: n.Hash}; });
      async.parallel(dirs, (err, files) => {
        let objArr = _.flatten(files.concat(files_));
        let obj = objArr.reduce((e, o) => _.extend(o, e), {});
        cb(err, obj);
      });
    };
    return deasync(
      (addr, cb) => mapAddressToFile(addr, '', cb)).apply(this, arguments);
  }

  // PATH x [(PATH x IPFS-Hash)] -> Bool
  // Ckecks out all files to first directory
  checkoutFilesSync () {
    var self = this;
    var checkoutFiles = function (working_dir, files, cb) {
      _.each(files, (hash, path) => {
        var data = self.catSync(hash);
        // Don't overwrite existing files
        if (fs.existsSync(path)) {
          // console.log(`File ${path} already exists.`.red);
        }
        fs.outputFileSync(working_dir + '/' + path, data);
      });
      cb();
    };
    return deasync(checkoutFiles).apply(this, arguments);
  }

  addDirSync (relPath) {
    var absPath = path.resolve(relPath);
    var splitPath = absPath.split(path.sep);
    var dirname = splitPath[splitPath.length - 1];
    return this.addSync(absPath, {'r': true, 'w': true})
    .filter(p => p.Name === dirname)[0].Hash;
  }

};
