'use strict';

var DappleRC = require('../lib/dapplerc.js');
var deasync = require('deasync');
var inquirer = require('inquirer');
var defaults = require('json-schema-defaults');
var dapplercSchema = require('../specs/dapplerc.schema.json');

module.exports = class DappleRCPrompter {
  static prompt () {
    var questions = [
      {
        'type': 'input',
        'name': 'ipfs_host',
        'message': 'IPFS hostname:',
        'default': 'localhost'
      },
      {
        'type': 'input',
        'name': 'ipfs_port',
        'message': 'IPFS port:',
        'default': '5001'
      },
      {
        'type': 'input',
        'name': 'eth_host',
        'message': 'Ethereum JSON-RPC hostname:',
        'default': 'localhost'
      },
      {
        'type': 'input',
        'name': 'eth_port',
        'message': 'Ethereum JSON-RPC port:',
        'default': '8545'
      },
      {
        'type': 'input',
        'name': 'default_account',
        'message': 'Default Ethereum account:'
      }
    ];

    var rc;
    var done = false;
    inquirer.prompt(questions, function (res) {
      rc = defaults(dapplercSchema);

      // TODO - add ipfs to default environment?
      // why is ipfs bound to an environment anyway?

      if (typeof rc.environments === 'undefined') {
        rc.environments = {};
      }

      rc.environments.live = {
        ethereum: {
          host: res.eth_host,
          port: res.eth_port,
          account: res.default_account
        },
        ipfs: {
          host: res.ipfs_host,
          port: res.ipfs_port
        }
      };

      done = true;
    });
    deasync.loopWhile(function () { return !done; });
    DappleRC.validate(rc);
    return rc;
  }
};
