'use strict';

var DappleRC = require('../lib/dapplerc.js');
var deasync = require('deasync');
var inquirer = require('inquirer');

module.exports = class DappleRCPrompter {
    static prompt() {
        var questions = [
            {
                "type": "input",
                "name": "ipfs_host",
                "message": "IPFS hostname:",
                "default": "localhost"
            },
            {
                "type": "input",
                "name": "ipfs_port",
                "message": "IPFS port:",
                "default": "4001"
            },
            {
                "type": "input",
                "name": "eth_host",
                "message": "Ethereum JSON-RPC hostname:",
                "default": "localhost"
            },
            {
                "type": "input",
                "name": "eth_port",
                "message": "Ethereum JSON-RPC port:",
                "default": "8545"
            }
        ];

        var rc;
        var done = false;
        inquirer.prompt(questions, function(res) {
            rc = {
                environments: {
                    default: {
                        ethereum: {
                            host: res.eth_host,
                            port: res.eth_port
                        },
                        ipfs: {
                            host: res.ipfs_host,
                            port: res.ipfs_port
                        }
                    },
                    evm: {
                        ethereum: "internal"
                    },
                    live: "default"
                }
            };
            done = true;
        });
        deasync.loopWhile(function() {return !done;})
        DappleRC.validate(rc);
        return rc;
    }
};
