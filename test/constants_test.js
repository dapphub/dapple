/* global it, describe */
'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var constants = require('../lib/constants.js');

describe('constants', function () {
  it("returns 'virtual' package sources", function () {
    var packages = constants.DAPPLE_PACKAGE_SOURCES;
    assert(Object.keys(packages).length > 0,
      'zero virtual packages retrieved');
    assert(_.every(_.values(packages)), 'virtual packages were empty');
  });
});
