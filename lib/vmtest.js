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
    // Run `test.setUp()` and `test["testname"]()`, return logs for
    // test that sets `failed` to true.
    static run_single(test, testname, cb) {
        web3.eth.defaultAccount = web3.eth.accounts[0];
        var failed = false;
        test.new({
            from: web3.eth.accounts[0],
            data: "0x" + test.bytecode,
            gas: 500000000
        }, function(err, instance) {
            var logs = [];
            if(err) throw err;//cb(err);
            if( instance.address ) {
                if( instance.setUp !== undefined ) {
                    instance.setUp()
                }
                instance[testname]();
                var failed = instance.failed();
                if( failed ) {
                    cb(null, ["failed event logs not captured yet"]);
                } else {
                    cb(null, null);
                }
            }
        });
    }

    // Run anything that inherits from Test from a given build output
    static run_suite(build_out) {
        var results = [];
        for( var classname in build_out ) {
            var type = build_out[classname];
            var abi = JSON.parse(type.interface);
            var is_test = false;
            for( var i in abi ) {
                if( abi[i].name == "IS_TEST" ) {
                    is_test = true;
                }
            }
            if( is_test && classname != "Test" ) {
                var run = deasync(VMTest.run);
                results.push(run(type));
            }
        }
        return results;
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
