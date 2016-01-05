'use strict';

var assert = require('chai').assert;
var DappleRC = require('../lib/dapplerc.js');
var path = require('path');

describe('DappleRC', function() {
    var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');

    it('loads the first YAML file that exists in the array given', function() {
        var wrong = path.join(__dirname, '_fixtures', 'nonexistent');
        var rc = new DappleRC({paths: [wrong, fixtureRC]});
        assert.equal(rc.path, fixtureRC, "rc did not load from " + fixtureRC);
    });

    it('leaves `path` undefined if no file could be read', function() {
        var wrong = path.join(__dirname, '_fixtures', 'nonexistent');
        var rc = new DappleRC({paths: [wrong]});
        assert.isUndefined(rc.path, "path should have been undefined!");
    });

    it('loads configuration files into its data property', function() {
        var rc = new DappleRC({paths: [fixtureRC]});
        assert.deepEqual(rc.data, {
            environments: {
                live: {
                    ipfs: {
                        host: 'localhost',
                        port: '4001'
                    },
                    eth: {
                        host: 'localhost',
                        port: '8545'
                    }
                }
            }
        })
    })
})
