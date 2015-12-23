"use strict"

var deasync = require("deasync");
var EtherSim = require('ethersim');
var utils = require('./utils');
var Web3 = require('web3');
const DEFAULT_GAS = 900000000;

module.exports = {
    JSONRPC: function (connection_string, cb) {
        if (typeof(connection_string) == 'function' && typeof(cb) == 'undefined') {
            cb = connection_string;
            connection_string = "http://localhost:8544";
        }
        cb = utils.optionalCallback(cb);

        var web3 = new Web3(new Web3.providers.HttpProvider(connection_string));

        if( web3.eth.coinbase === undefined ) {
            return cb(new Error(
                "Couldn't connect to test web3 provider, or it set no coinbase"));
        }
        web3.eth.defaultAccount = web3.eth.accounts[0];

        return cb(null, web3);
    },

    EVM: function (cb) {
        const INITIAL_WEI = Math.pow(2, 256);
        cb = utils.optionalCallback(cb);

        var provider = EtherSim.web3Provider();
        provider.manager.blockchain.setGasLimit(DEFAULT_GAS);

        // Set a no-op logger. We're not interested in EtherSim's output ATM.
        provider.manager.blockchain.setLogger({
            log: function() {},
            error: function() {}
        });

        var web3 = new Web3(provider);

        // Create a tester account and give it an arbitrary amount of ether.
        // Any amount necessary to run all the tests should be fine.
        deasync(function (cb) {
            provider.manager.blockchain.addAccount(function () {
                web3.eth.defaultAccount = web3.eth.accounts[0];
                provider.manager.blockchain.setBalance(
                        web3.eth.defaultAccount, INITIAL_WEI, cb);
            });
        })();

        return cb(null, web3);
    }
}
