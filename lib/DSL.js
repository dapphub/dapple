'use strict';
var jison = require('jison');
var fs = require('fs');

var bnf = fs.readFileSync(__dirname + '/../specs/dsl.y','utf8');

var parser = new jison.Parser(bnf);

module.exports = parser;
