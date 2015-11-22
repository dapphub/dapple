"use strict"
/* TODO ethereumjs-lib module is broken
var EVM = require('ethereumjs-vm');

modules.exports = class VMTestRunner {
    constructor(tests) {
    }
    run(typeInfo) {
        var evm = new EVM();
        var code = typeInfo.bin;
        code = new Buffer(typeInfo.bin, 'hex');
        evm.runCode({
            code: code,
            gasLimit: new Buffer('ffffffff', 'hex')
        }, function(err, results) {
            // runCode:  send a trx
            console.log(results);
        });
    }
}
*/
