/* global it, describe */
'use strict';

var assert = require('chai').assert;
var utils = require('../lib/utils.js');

describe('utils.optionalCallback', function () {
  var exampleValue = 42;

  var exampleFunc = function (cb) {
    cb = utils.optionalCallback(cb);
    return cb(null, exampleValue);
  };

  var errorFunc = function (cb) {
    cb = utils.optionalCallback(cb);
    cb('Error message!');
  };

  it('returns values when no callback is provided', function () {
    assert.equal(exampleFunc(), exampleValue);
  });

  it('passes values to the callback when one is provided', function (done) {
    exampleFunc(function (err, val) {
      assert.notOk(err);
      assert.equal(val, exampleValue);
      done();
    });
  });

  it('throws exceptions when there is an error and no callback', function () {
    assert.throws(errorFunc);
  });

  it('passes errors to the callback when one is provided', function (done) {
    errorFunc(function (err, val) {
      assert(err);
      done();
    });
  });
});
