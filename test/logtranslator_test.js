'use strict';

var assert = require('chai').assert;
var LogTranslator = require('../lib/logtranslator.js');

describe("LogTranslator", function() {
    var abi = [{
        "anonymous":false,
        "inputs": [{"indexed": false, "name":"val", "type":"bytes"}],
        "name": "logs",
        "type":"event"
    }];
    var translator = new LogTranslator(abi);

    var logs_entry = {
        logIndex: 0,
        transactionIndex: 0,
        transactionHash: '0x5dfc4d017929d1593bc6bd5b9c866'
                         + 'dd870668479c254fe28bb93c86b6ee95d72',
        blockHash: '0x1ad427ad1b770e3d74843331d976f8ce'
                    + '39cb027ad439b875387f831f75c8d122',
        blockNumber: 4,
        address: '0x4f2d16edaa5a3f4d5d60c2c015cb0ee9b03091ed',
        data: '0x0000000000000000000000000000000000000000000'
              + '0000000000000000000200000000000000000000000'
              + '0000000000000000000000000000000000000000146'
              + '1737365727454727565207761732066616c73650000'
              + '00000000000000000000',
        topics: [
            '0xe7950ede0394b9f2ce4a5a1bf5a7e18524'
            + '11f7e6661b4308c913c4bfd11027e4'
        ],
        type: 'mined'
    };

    var logs_translation = {
        logIndex: 0,
        transactionIndex: 0,
        transactionHash: '0x5dfc4d017929d1593bc6bd5b9c866'
                         + 'dd870668479c254fe28bb93c86b6ee95d72',
        blockHash: '0x1ad427ad1b770e3d74843331d976f8ce'
                   + '39cb027ad439b875387f831f75c8d122',
        blockNumber: 4,
        address: '0x4f2d16edaa5a3f4d5d60c2c015cb0ee9b03091ed',
         type: 'mined',
        event: 'logs',
        args: {
            val: 'assertTrue was false'
        }
    };

    it("can translate a log entry object", function() {
        assert.deepEqual(translator.translate(logs_entry), logs_translation,
                         "failed to translate log entry");
    });

    it("can translate an array of log entry objects", function() {
        assert.deepEqual(translator.translateAll(
            [logs_entry]), [logs_translation],
            "failed to translate log entries");
    });

    it("does not mutate the entry object", function() {
        var clone = JSON.parse(JSON.stringify(logs_entry));
        translator.translate(logs_entry);
        assert.deepEqual(logs_entry, clone, "log entry was mutated");
    });
});
