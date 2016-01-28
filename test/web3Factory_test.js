/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Web3Factory = require('../lib/web3Factory.js');

describe('Web3Factory.EVM', function () {
  it('returns a Web3 object with the first account as default', function () {
    var web3 = Web3Factory.EVM();
    assert.equal(web3.eth.defaultAccount, web3.eth.accounts[0]);
  });
});
