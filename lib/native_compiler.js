'use strict';

var _ = require('lodash');
var child_process = require('child_process');
var fs = require('fs-extra');
var os = require('os');
var path = require('path');

module.exports = class NativeCompiler {
  static isAvailable () {
    try {
      child_process.execSync('solc --version');
    } catch (err) {
      return false;
    }
    return true;
  }

  static setDefaults (opts) {
    return _.assign({
      errorHandler: console.error,
      sources: {}
    }, opts);
  }

  static compile (opts) {
    opts = NativeCompiler.setDefaults(opts);

    var sources = opts.sources;
    var tmpDir = path.join(os.tmpdir(), 'dapple',
      String(Math.random()).slice(2));
    fs.emptyDirSync(tmpDir); // Create or empty the directory.

    _.forIn(sources, (val, key) => {
      fs.outputFileSync(path.join(tmpDir, key), val);
    });

    var solcc = `${opts.solc_path} ${opts.optimize ? '--optimize' : ''} --combined-json abi,bin,bin-runtime,interface,opcodes,asm -o *.sol`;

    var output;
    try {
      output = child_process.execSync(solcc, {
        cwd: tmpDir
      });
    } catch (e) {
      return opts.errorHandler(String(e.stderr));
    }

    try {
      output = JSON.parse(output);
    } catch (e) {
      console.log(`ERROR: Could not compile! Try navigating to ${tmpDir} and executing "${solcc}"`);
      process.exit(1);
    }
    fs.removeSync(tmpDir); // Clean up.

    let contracts = {};
    _.each(output.contracts, function (contract, name) {
      let cname = name.split(':');
      if (cname.length > 1) {
        cname = cname[1];
      } else {
        cname = cname[0];
      }
      contracts[cname] = {
        'bytecode': contract.bin,
        'interface': contract.abi,
        'solidity_interface': contract.interface,
        'asm': contract.asm,
        'opcodes': contract.opcodes,
        'runtimeBytecode': contract['bin-runtime']
      };
    });
    output.contracts = contracts;

    return output;
  }
};
