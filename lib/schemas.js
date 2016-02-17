'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var tv4 = require('tv4');

class Schema {
  constructor (schema) {
    this.schema = schema;
  }

  validate () {
    var args = Array.prototype.slice.call(arguments);
    args.splice(1, 0, this.schema);
    return tv4.validate.apply(tv4, args);
  }

  toJSON () {
    return this.schema;
  }

  toString () {
    return JSON.stringify(this.toJSON());
  }
}

function buildSchemas () {
  var schemas = {};
  var specs = _.filter(fs.readdirSync(path.join(__dirname, '..', 'specs')),
                       (p) => p.endsWith('.json'));

  for (let i = 0; i < specs.length; i += 1) {
    let spec = specs[i];
    let schema = require(path.join('..', 'specs', spec));
    let schemaName = spec.slice(0, -5);
    schemas[schemaName] = new Schema(schema);
    tv4.addSchema(schemaName, schema);
  }
  return schemas;
}

module.exports = buildSchemas();
