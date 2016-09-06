/* global it, describe */
'use strict';

var assert = require('chai').assert;
var schemas = require('../lib/schemas.js');

describe('schemas.js', function () {
  it('automatically loads all the schema definitions in /specs', function () {
    assert.deepEqual(Object.keys(schemas).sort(), [
      'dappfile', 'definitions', 'hyper-schema', 'package', 'schema'
    ]);
  });

  it('should only contain valid schemas', function (done) {
    var valid = ['dappfile', 'definitions', 'package']
      .map(name => schemas['hyper-schema'].validate(schemas[name]))
      .reduce((a, b) => a && b, true);
    assert.ok(valid);
    done();
  });
});
