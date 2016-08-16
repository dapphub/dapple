/* global it, describe */
'use strict';
var assert = require('chai').assert;
var tv4 = require('tv4');

var hyper_schema = require('../specs/hyper-schema.schema.json');
var schema = require('../specs/schema.schema.json');

var definitions = require('../specs/definitions.schema.json');
var dappfileSchema = require('../specs/dappfile.schema.json');

describe('specs', function () {
  it('definitions.json should be a valid json schema', function (done) {
    var valid = tv4.validate(definitions, hyper_schema);
    assert.isTrue(valid);
    done();
  });

  it('dappfile should be a valid json schema ', function (done) {
    tv4.addSchema('definitions', definitions);
    tv4.addSchema('http://json-schema.org/draft-04/hyper-schema', hyper_schema);
    tv4.addSchema('http://json-schema.org/draft-04/schema', schema);

    var valid = tv4.validate(dappfileSchema, hyper_schema);

    assert(valid, 'dapple.json is not a valid schema');
    assert(tv4.missing.length === 0,
      'some references are missing: ' + JSON.stringify(tv4.missing));

    done();
  });
});
