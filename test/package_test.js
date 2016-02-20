/* global it, describe */
'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var fs = require('../lib/file');
var path = require('path');
var testenv = require('./testenv');
var schemas = require('../lib/schemas.js');

describe('package', function() {
  
  it("should accept valide package description", function(done){
    
    // IPFS link: QmcVb2DkBVJqT4Pw3X9Ge3dzbgSzW7pvDBsxhVs1xGPLV3
    var pkg_definition = {
      "name": "foobar",
      "description": "this is a test package",
      "version": "12.0.34",
      "tags": ["foo", "bar", "test"],
      "root": "QmXuaDz3Nwmiz38FzG4GpxKAF4fGML1YxZPbKa6pYQcQ9B",
      "dependencies": {
        "some other pkg": "this should be an ipfs link"
      },
      "environments": {
        "morden": {
          "objects": {
            "wow": {
              "class": "much",
              "address": "package"
            }
          }
        }
      }
    };
    
    var valide = schemas.packfile.validate(pkg_definition);
    
    assert(valide);
    
    done();
  });
  
  
});
