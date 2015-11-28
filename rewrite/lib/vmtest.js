"use strict"
var EVM = require('ethereumjs-lib').VM;
var deasync = require("deasync");

module.exports = class VMTest {
    static run(class_definition) {
        var evm = new EVM();
        var code = class_definition.bytecode;
        code = new Buffer(code, 'hex');
        var results = deasync(evm.runCode)({
            code: code,
            gasLimit: new Buffer('ffffffff', 'hex')
        }, function(err, results) {
            // runCode:  send a trx
            console.log(results);
        });
    }
}
