/* global it, describe */
'use strict';

var assert = require('chai').assert;
var schemas = require('../lib/schemas.js');

describe('package', function () {
  it('should accept valide package description', function (done) {
    // IPFS link: QmcVb2DkBVJqT4Pw3X9Ge3dzbgSzW7pvDBsxhVs1xGPLV3
    var pkg_definition = {
      'schema': 'QmXuaDz3Nwmiz38FzG4GpxKAF4fGML1YxZPbKa6pYQcQ9B',
      'name': 'foobar',
      'summary': 'this is a test package',
      'version': '12.0.34',
      'solc': {
        'version': 'Version: 0.2.2-37381072/.-Darwin/unknown/JIT linked to libethereum-1.1.1-8138fe14/.-Darwin/unknown/JIT',
        'flags': '--optimize'
      },
      'tags': ['foo', 'bar', 'test'],
      'root': 'QmXuaDz3Nwmiz38FzG4GpxKAF4fGML1YxZPbKa6pYQcQ9B',
      'contracts': {
        'OMG': 'this is another ipfs hash'
      },
      'dependencies': {
        'some other pkg': 'this should be an ipfs link'
      },
      'environments': {
        'morden': {
          'objects': {
            'wow': {
              'class': 'much',
              'address': 'package'
            }
          }
        }
      }
    };
    var valide = schemas.package.validateResult(pkg_definition);
    assert(valide.valid);
    done();
  });
});
