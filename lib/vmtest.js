"use strict"
var EVM = require('ethereumjs-lib').VM;
var deasync = require("deasync");
var Web3 = require("web3");
var web3 = new Web3();

// TODO use ethersim
// TODO use chain manager
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8544"));
 
module.exports = class VMTest {
    // currently uses deasync and no VM snapshotting, causing tests to be even slower
    static run(class_definition, cb) {
        if( web3.eth.coinbase === undefined ) {
            cb(new Error("Couldn't connect to test web3 provider, or it set no coinbase"));
        }
        if( !class_definition.bytecode ) {
            cb(new Error("Test class definition has no bytecode"));
        }
        if( !class_definition.interface ) {
            cb(new Error("Test class definition has no interface"));
        }

        var abi = class_definition.interface;
        if( typeof(abi) === "string" ) {
            abi = JSON.parse(abi);
        }

        var tests = [];
        for( var item of abi ) {
            if( item.name && item.name.indexOf("test") == 0 ) {
                tests.push(item.name);
            }
        }
        var runSingleSync = deasync(VMTest.run_single);
        var results = [];
        try {
            for( var testname of tests ) {
                var instance = web3.eth.contract(abi);
                instance.bytecode = class_definition.bytecode;
                results.push(runSingleSync(instance, testname));
            }
        } catch(err) {
            cb(err);
        }
        cb(null, results);
    }
    static run_single(test, testname, cb) {
        web3.eth.defaultAccount = web3.eth.accounts[0];
        var failed = false;
        test.new({
            from: web3.eth.accounts[0],
            data: "0x" + test.bytecode,
            gas: 900000000
        }, function(err, instance) {
            if(err) cb(err);
            if( instance.address ) {
                if( instance.setUp !== undefined ) {
                    instance.setUp()
                }
                var trxid = instance[testname]();
                var failed = instance.failed();
                var receipt = web3.eth.getTransactionReceipt(trxid);
                cb(null, failed);
            }
        });
    }

    static run_suite() {
    }

    // ethereumjs-lib version - potentially skip RPC layer completely
    static run_ethjs(class_definition) {
        var evm = new EVM();
        var code = class_definition.bytecode;
        code = new Buffer(code, 'hex');
        var results = deasync(evm.runCode)({
            code: code,
            gasLimit: new Buffer('ffffffff', 'hex')
        }, function(err, results) {
            // runCode:  send a trx
        });
    }
}
