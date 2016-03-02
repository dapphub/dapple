/* global it, describe */
'use strict';

var assert = require('chai').assert;
var Contract = require('../lib/contract');

describe('class Contract', function () {
  var bytecode = '606060405260338060106000396000f3606060' +
         '40523615600d57600d565b601d5b6000600090' +
         '50601a565b90565b6040518082815260200191' +
         '505060405180910390f3';
  var abi = [];
  var solidity_interface = 'contract False{}';

  it('throws an error when class definition has no bytecode', function () {
    try {
      Contract.create({
        'interface': abi,
        'solidity-interface': solidity_interface
      });
      assert(false);
    } catch (err) {
      assert(true);
    }
  });

  it('throws an error when class definition has no interface', function () {
    try {
      Contract.create({
        'bytecode': bytecode,
        'solidity-interface': solidity_interface
      });
      assert(false);
    } catch (err) {
      assert(true);
    }
  });

  it('succeeds when the class definition is complete', function () {
    try {
      Contract.create({
        'bytecode': bytecode,
        'interface': abi,
        'solidity-interface': solidity_interface
      });
      assert(true);
    } catch (err) {
      assert(false, err);
    }
  });

  it('accepts raw native-solc JSON-style output', function () {
    try {
      Contract.create({
        'bin': bytecode,
        'abi': abi,
        'interface': solidity_interface
      });
      assert(true);
    } catch (err) {
      assert(false, err);
    }
  });
});
