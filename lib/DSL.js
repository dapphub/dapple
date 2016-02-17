'use strict';
var jison = require('jison');
var fs = require('fs');
var Interpreter = require('./interpreter.js');
var bnf = fs.readFileSync(__dirname + '/../specs/dsl.y', 'utf8');
var _ = require('lodash');
var Web3Interface = require('./web3Interface.js');

class Parser {

  constructor (opts) {
    
    var web3Interface = new Web3Interface({ web3: opts.web3 });
    this.opts = opts;
    this.parser = new jison.Parser(bnf);
    this.interpreter = new Interpreter(_.extend({}, opts, {web3Interface}));
    this.parser.yy.i = this.interpreter;
    this.env = opts.env;
    this.workspace = opts.workspace;
    this.web3 = opts.web3;
  }

  parse (script, cb) {
    var ast = this.parser.parse(script);
    var self = this;
    // 
    // If real chain => simulate first
    if( this.web3 !== 'internal' ) {
      var internalWeb3 = new Web3Interface({ web3: 'internal' });
      var testrun = new Interpreter(_.extend(this.opts, {web3Interface:internalWeb3, silent:true}));
      testrun.run(ast, function(err, res) {
        if (err) throw err;
        console.log('simulated successfully');
        // TODO - add gas costs and comare with total funds on the account
        self.interpreter.run(ast, function( err, global_scope ){
          if ( err ) throw err;
          _.each(global_scope, (obj, name) => {
            self.workspace.addObject(self.env, name, obj.class, obj.address);
          } );
          self.workspace.writeDappfile();
          cb();
        });
      });
    } else {
      this.interpreter.run(ast, function( err, global_scope ){
        if ( err ) throw err;
        _.each(global_scope, (obj, name) => {
          self.workspace.addObject(self.env, name, obj.class, obj.address);
        } );
        self.workspace.writeDappfile();
        cb();
      });
    }
  }

}

module.exports = Parser;
