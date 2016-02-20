/* global it, describe */
'use strict';

var assert = require('chai').assert;
var schemas = require('../lib/schemas.js');

describe('schemas.js', function () {
  it('automatically loads all the schema definitions in /specs', function () {
    assert.deepEqual(Object.keys(schemas).sort(), [
      'dappfile', 'dapplerc', 'definitions', 'hyper-schema', 'schema'
    ]);
  });
});
