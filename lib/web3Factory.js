"use strict"

var Web3 = require('web3');
var utils = require('./utils');

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
        cb = utils.optionalCallback(cb);

        var web3 = new Web3(EtherSim.web3Provider());
        web3.eth.defaultAccount = web3.eth.accounts[0];

        return cb(null, web3);
    }
}
