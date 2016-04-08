'use strict';
var jison = require('jison');
var fs = require('fs');
var Interpreter = require('./interpreter.js');
var bnf = fs.readFileSync(__dirname + '/../specs/dsl.y', 'utf8');
var _ = require('lodash');
var Web3Interface = require('./web3Interface.js');

class Parser {

  constructor (opts) {
    this.opts = opts;
  }

  parse (script, cb) {
    var self = this;
    //
    // If real chain => simulate first
    if (this.opts.web3 !== 'internal' && this.opts.simulate) {
      var internalWeb3 = new Web3Interface({ web3: 'internal' });
      var interpreter = new Interpreter(
          _.extend({}, this.opts, {web3Interface: internalWeb3, silent: true}));
      var parser = new jison.Parser(bnf);
      parser.yy.i = interpreter;

      // Facilitate introspection
      this.interpreter = interpreter;

      interpreter.run(parser.parse(script), function (err, res) {
        if (err) throw err;
        console.log('simulated successfully');
        // TODO - add gas costs and comare with total funds on the account
        self._parseExternal(script, cb);
      });
    } else {
      this._parseExternal(script, cb);
    }
  }

  _parseExternal (script, cb) {
    var self = this;
    var web3Interface = new Web3Interface(this.opts);
    var interpreter = new Interpreter(_.extend({}, this.opts, {web3Interface}));
    var parser = new jison.Parser(bnf);
    parser.yy.i = interpreter;

    // Facilitate introspection
    this.interpreter = interpreter;

    interpreter.run(parser.parse(script), function (err, global_scope) {
      if (err) throw err;
      if (self.opts.workspace) {
        _.each(global_scope, (obj, name) => {
          self.opts.workspace.addObject(
            self.opts.environment, name, obj.class, obj.address);
        });
        self.opts.workspace.writeDappfile();
      }

      cb(null, {
        globals: global_scope,
        success: interpreter.success
      });
    });
  }
}

module.exports = Parser;
