/* global it, describe */
'use strict';

var assert = require('chai').assert;
var fs = require('../lib/file.js');
var DappleRC = require('../lib/dapplerc.js');
var path = require('path');
var tv4 = require('tv4');

var definitions = require('../specs/definitions.schema.json');
var dapplercSchema = require('../specs/dapplerc.schema.json');

tv4.addSchema('definitions', definitions);

describe('DappleRC', function () {
  var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');
  var fixtureRCExpanded = fixtureRC + '.expanded';

  it('loads the first YAML file that exists in the array given', function () {
    var wrong = path.join(__dirname, '_fixtures', 'nonexistent');
    var rc = DappleRC.create({paths: [wrong, fixtureRC]});
    assert.equal(rc.path, fixtureRC, 'rc did not load from ' + fixtureRC);
  });

  it('leaves `path` undefined if no file could be read', function () {
    var wrong = path.join(__dirname, '_fixtures', 'nonexistent');
    var rc = DappleRC.create({paths: [wrong]});
    assert.isUndefined(rc.path, 'path should have been undefined!');
  });

  it('loads configuration files into its data property', function () {
    var expected = fs.readYamlSync(fixtureRCExpanded);
    var rc = DappleRC.create({paths: [fixtureRC]});
    assert.deepEqual(rc.data, expected);
    var valid = tv4.validate(rc.data, dapplercSchema);
    assert(valid, 'dapplerc is not valid by schema' + tv4.error);
  });

  it('fills in unspecified properties with defaults', function () {
    var rc = DappleRC.create({paths: [fixtureRC]});
    assert.deepEqual(
      rc.environment('default').ipfs,
      rc.environment('evm').ipfs);
  });

  it('validates itself and throws an exception if it fails', function () {
    var invalidFixtureRC = fixtureRC + '.invalid';
    assert.throws(function () {
      DappleRC.create({paths: [invalidFixtureRC]});
    });
  });
});
