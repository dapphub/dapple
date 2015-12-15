"use strict"
var deasync = require("deasync");
var EVM = require('ethereumjs-lib').VM;
var utils = require('./utils');

// TODO use ethersim
// TODO use chain manager
 
module.exports = class VMTest {
    // **TODO**: Chain snapshotting and async/parallel tests.
    // Needs to be faster.
    
    // Takes a web3 instance, a compiled contract (`class_definition`),
    // and a callback. Collects all the tests in the class definition,
    // deploys an instance of the contract for each test on the given
    // web3 object, runs "setUp", and then runs the test. The callback
    // takes an error string as its first argument and an object
    // containing the results of each test. The callback gets called
    // once per test. The test results object includes flags indicating the
    // number of tests to be run (`testCount`) and the number of the test being
    // reported on (`testNumber`).
    static run(web3, class_definition, cb) {

        cb = utils.optionalCallback(cb);

        if( !class_definition.bytecode ) {
            return cb(new Error("Test class definition has no bytecode"));
        }

        if( !class_definition.interface ) {
            return cb(new Error("Test class definition has no interface"));
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
            for( var i=0; i < tests.length; i+=1 ) {
                var instance = web3.eth.contract(abi);
                instance.bytecode = class_definition.bytecode;
                results.push(runSingleSync(web3, instance, tests[i]));
            }
        } catch(err) {
            return cb(err);
        }

        return cb(null, results);
    }

    static run_single(web3, test, testname, cb) {
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
}
