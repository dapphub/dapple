var jison = require('jison');
var fs = require('fs');

var bnf = fs.readFileSync('./specs/dsl.y','utf8');
console.log(bnf);

var parser = new jison.Parser(bnf);

module.exports = parser;
