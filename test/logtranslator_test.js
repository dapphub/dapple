'use strict';

var assert = require('chai').assert;
var LogTranslator = require('../lib/logtranslator.js');

describe("LogTranslator", function() {
    var abi = [{
        "anonymous":false,
        "inputs": [{"indexed": false, "name":"val", "type":"bytes"}],
        "name": "logs",
        "type":"event"
    }, {
        "anonymous":false,
        "inputs": [{"indexed": false, "name":"val", "type":"bool"}],
        "name": "log_bool",
        "type":"event"
    }, {
        "anonymous":false,
        "inputs": [{"indexed": false, "name":"val", "type":"address"}],
        "name": "log_address",
        "type":"event"
    }];
    var translator = new LogTranslator(abi);

    var log_entries = {
        'logs': {
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
        },
        'log_address': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0xc1e39bafd3de1c37ea2c4e82548fbe77'
                             + 'e1fa412938457a9d46e2ec23ba55101b',
            blockHash: '0x188df4ea75f5ce9ad4a9475c0ad4168fd44e3a'
                       + '372adebd4a7a678751c3fdf7a7',
            blockNumber: 3,
            address: '0x1e2d829c0a3007f785a41699a6b392c31f045c7f',
            data: '0x0000000000000000000000001e2d829c0'
                  + 'a3007f785a41699a6b392c31f045c7f',
            topics: [ '0x7ae74c527414ae135fd97047b12921a5e'
                      + 'c3911b804197855d67e25c7b75ee6f3' ],
            type: 'mined'
        },
        'log_bool_true': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0x52f6ce006ebbef9ddc913c2d2'
                             + 'c81227c606131c00d9bae564e5d5ec2b655c417',
            blockHash: '0xf0223b2dafb83a2e53780b6c58bcdba1735'
                       + 'af09b5e04cf2f7e1559ea4e6d0b84',
            blockNumber: 3,
            address: '0xeb115290493e7bfc360758ab772cb4d7c8034333',
            data: '0x00000000000000000000000000000000'
                  + '00000000000000000000000000000001',
            topics: [ '0xd44f90c0efdac6a7cdc8d4b8c65b80dcb'
                      + '84777650810e2395affa7566d4fbb5d' ],
            type: 'mined'
        },
        'log_bool_false': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0x52f6ce006ebbef9ddc913c2d2'
                             + 'c81227c606131c00d9bae564e5d5ec2b655c417',
            blockHash: '0xf0223b2dafb83a2e53780b6c58bcdba1735'
                       + 'af09b5e04cf2f7e1559ea4e6d0b84',
            blockNumber: 3,
            address: '0xeb115290493e7bfc360758ab772cb4d7c8034333',
            data: '0x00000000000000000000000000000000'
                  + '00000000000000000000000000000000',
            topics: [ '0xd44f90c0efdac6a7cdc8d4b8c65b80dcb'
                      + '84777650810e2395affa7566d4fbb5d' ],
            type: 'mined'
        }
    };

    var log_translations = {
        'logs': {
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
        },
        'log_address': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0xc1e39bafd3de1c37ea2c4e82548'
                             + 'fbe77e1fa412938457a9d46e2ec23ba55101b',
            blockHash: '0x188df4ea75f5ce9ad4a9475c0ad4168fd44e3a'
                       + '372adebd4a7a678751c3fdf7a7',
            blockNumber: 3,
            address: '0x1e2d829c0a3007f785a41699a6b392c31f045c7f',
            type: 'mined',
            event: 'log_address',
            args: { val: '0x1e2d829c0a3007f785a41699a6b392c31f045c7f' }
        },
        'log_bool_true': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0x52f6ce006ebbef9ddc913c2d2'
                             + 'c81227c606131c00d9bae564e5d5ec2b655c417',
            blockHash: '0xf0223b2dafb83a2e53780b6c58bcdba1735'
                       + 'af09b5e04cf2f7e1559ea4e6d0b84',
            blockNumber: 3,
            address: '0xeb115290493e7bfc360758ab772cb4d7c8034333',
            type: 'mined',
            event: 'log_bool',
            args: { val: true }
        },
        'log_bool_false': {
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: '0x52f6ce006ebbef9ddc913c2d2'
                             + 'c81227c606131c00d9bae564e5d5ec2b655c417',
            blockHash: '0xf0223b2dafb83a2e53780b6c58bcdba1735'
                       + 'af09b5e04cf2f7e1559ea4e6d0b84',
            blockNumber: 3,
            address: '0xeb115290493e7bfc360758ab772cb4d7c8034333',
            type: 'mined',
            event: 'log_bool',
            args: { val: false }
        }
    };

    it("can translate a log entry object", function() {
        for (let key in log_entries){
            assert.deepEqual(
                translator.translate(log_entries[key]),
                log_translations[key],
                "failed to translate " + key + " log entry");
        }
    });

    it("can translate an array of log entry objects", function() {
        let entries = [];
        let translations = [];
        for (let key in log_entries) {
            entries.push(log_entries[key]);
            translations.push(log_translations[key]);
        }
        assert.deepEqual(translator.translateAll(entries), translations,
            "failed to translate log entries");
    });

    it("does not mutate the entry object", function() {
        for (let key in log_entries){
            var clone = JSON.parse(JSON.stringify(log_entries[key]));
            translator.translate(clone);
            assert.deepEqual(clone, log_entries[key],
                "log entry '" + key + "' was mutated");
        }
    });
});
