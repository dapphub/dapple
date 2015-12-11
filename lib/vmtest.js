"use strict"
const EVM = require('ethereumjs-vm');
const deasync = require("deasync");
const Trie = require('merkle-patricia-tree/secure');

module.exports = class VMTest {
    static run(class_definition, evm) {
        if (typeof(evm) == 'undefined') {
            evm = new EVM(new Trie());
        }

        var runCode = deasync(evm.runCode)
        var code = class_definition.bytecode;
        code = new Buffer(code, 'hex');

        // Deploy the test contract.
        try {
            var results = runCode({
                code: code,
                gasLimit: new Buffer('ffffffff', 'hex')
            });

        } catch (e) {
            console.error(e.stack);
            return {
                message: "FAILED TO DEPLOY",
                error: e
            };
        }

        // **TODO**: Run all the test functions.
        console.log(results);

    }
}
