'use strict';

// TODO - temporary hack with deasync, refactor to actualy real ast structure
//
var _ = require('lodash');

var TYPE = {
  //
  //                          Monotype
  CALL: { atom: false },
  LOG: { atom: false },
  STRING: { atom: true },  // string  - `"asd"`
  NUMBER: { atom: true },  // number  - `1`
  EXPORT: { atom: false }, // export makes object publicly available
  IMPORT: { atom: false }, // import makes dappfile objects locally available
  DEPLOY: { atom: false }, // deployment - `new Contract(...)`
  ASSIGN: { atom: false }, // assignment - `a = b`
  REFERENCE: { atom: true },  // symbol - internal reference
  SEQ: { atom: true }, // sequence of expressions
  //
  //                          Polytype
  //
  OBJECT: function (name) { this.name = name; }
};

class Expr {
  constructor (_value, _args, _type, _meta) {
    this.value = _value;
    this.type = _type;
    this.args = _args;
    this.meta = _meta;
  }
}

class Interpreter {

  constructor (opts) {
    // global is a real subset of local
    this.local = {};
    this.global = {};
    this.logs = [];
    this.success = true;
    this.Expr = Expr;
    this.TYPE = TYPE;

    let envs = opts.environments || {};
    let env = envs[opts.environment] || {objects: {}};

    this.importable = {};
    _.each(env.objects, (value, key) => {
      var type;
      switch (typeof value) {
        case 'string':
          type = TYPE.STRING;
          break;
        case 'number':
          type = TYPE.NUMBER;
          break;
        case 'object': // asume contract object
          type = new TYPE.OBJECT(type.class);
          break;
        default:
          throw new Error('unknown type in evironment object: ' + value);
      }
      this.importable[key] = new Expr(value, [], type);
    });

    // todo - process somehow
    this.classes = opts.classes;
    this.isLogging = !opts.silent;
    this.throws = opts.throws;

    // Ensure that classes.interfaces is not a string
    _.each(this.classes, (classObject, className) => {
      if (typeof classObject.interface === 'string') {
        classObject.interface = JSON.parse(classObject.interface);
      }
    });
    this.web3Interface = opts.web3Interface;
    this.log(`Deploying to environment "${ opts.env }"...\n`);
    if (opts.web3 === 'internal') {
      this.log('Using internal EVM...\n');
    }
    this.log(`Connected to RPC client, block height is ${this.web3Interface._web3.eth.blockNumber}\n`);
  }

  // process the ast
  run (ast, cb) {
    var self = this;
    // var scope = _.extend({ local: {}, global: {} }, this);
    // TODO: make scope independent of the interpreter
    var interpret = function (ast) {
      if (!(ast instanceof Expr)) {// VALUE
        return ast;
      } else if (ast.type === TYPE.REFERENCE) {
        return self.local[ast.value];
      } else if (ast.type === TYPE.SEQ) { // SEQUENCE
        return ast.value.map(interpret);
      } else if (ast.type.atom) { // AST - ATOM
        return ast;
      } else { // AST - FUNCTION
        return ast.value.apply(self, ast.args.map(interpret).concat([ast]));
      }
    };
    interpret(ast);
    //
    // export global_scope to workspace
    var global_scope = {};
    _.each(this.global, (variable, name) => {
      if (variable.type instanceof TYPE.OBJECT) {
        global_scope[name] = {
          class: variable.type.name,
          address: variable.value
        };
      } else {
        global_scope[name] = variable;
      }
    });
    cb(null, global_scope);
  }

  error (string) {
    this.success = false;
    this.log('ERROR: ' + string);

    if (this.throws) {
      throw new Error(string);
    }
  }

  log (string) {
    if (this.isLogging) {
      process.stdout.write(string);
    }
    this.logs.push(string);
  }

  log_atom (atom) {
    return this.log(this.serializeAtom(atom) + '\n');
  }

  assign (key, value) {
    if (key in this.local) {
      this.error(`${key} is already declared in local env!`);
    } else {
      this.local[key] = value;
    }
    return this.success;
  }

  serialize (args) {
    var self = this;
    return args.map(atom => {
      return self.serializeAtom(atom);
    });
  }

  serializeAtom (atom) {
    if (typeof atom === 'string') {
      if (typeof this.local[atom].value === 'undefined') {
        return this.local[atom];
      }
      return this.local[atom].value;
    }
    // atom
    return atom.value;
  }

  export (key) {
    if (key in this.global) {
      this.error(`ERROR: ${key} is already declared in global environment!`);
    } else if (!(key in this.local)) {
      this.error(`ERROR: ${key} is not declared in local environment!`);
    } else {
      this.global[key] = this.local[key];
    }
    return this.success;
  }

  import (key) {
    if (key in this.local) {
      this.error(`ERROR: ${key} is already declared in local environment!`);
    } else if (!(key in this.importable)) {
      this.error(`ERROR: ${key} is not declared in dappfile environment!`);
    } else {
      this.local[key] = this.importable[key];
    }
    return this.success;
  }

  deploy (className, args, txOptions, ast) {
    if (className in this.classes) {
      var numConfirmations = 1;
      var receipt = this.web3Interface.deploy({
        className,
        abi: this.classes[className].interface,
        bytecode: this.classes[className].bytecode,
        args: this.serialize(args),
        value: txOptions.value,
        gas: txOptions.gas
      });
      var address = receipt.contractAddress;
      this.log(`DEPLOYED: ${ className } = ${ address }\n`);
      this.log(`GAS COST: ${ parseInt(receipt.gasUsed, 10) } for "new ${ className }"\n`);
      this.web3Interface.waitForBlock(receipt.blockNumber + numConfirmations);
      if (this.web3Interface.confirmCode(address)) {
        this.log(`CONFIRMED deploy after ${numConfirmations} blocks!\n`);
      }
      var meta = {
        address,
        gas: receipt.gasUsed
      };
      // ast.meta = meta;
      // if no gas is specified override with emulated gas
      if (!ast.args[2].gas) ast.args[2].gas = receipt.gasUsed;
      return new Expr(address, [], new TYPE.OBJECT(className), meta);
    } else {
      this.error(`Unknown contract type: ${className}`);
      return null;
    }
  }

  call (contract, fName, _args, txOptions, ast) {
    // TODO - assertion and detailed error handling
    if (contract instanceof Expr && contract.type instanceof TYPE.OBJECT) {
      var className = contract.type.name;
      var address = contract.value;
      var abi = this.classes[className].interface;
      // TODO - get function interface by signature and not by name
      var functionInterface = this.classes[className].interface.filter(i => {
        return i.name === fName;
      })[0];
      if (!functionInterface) throw new Error(`${fName} is not a valid function of class ${className}`);
      var constant = functionInterface.constant;
      var args = this.serialize(_args);
      var result = this.web3Interface.call({args, fName, constant, abi, address, txOptions});
      // REPORT
      this.log(`CALLED: ${className}("${ contract.value }").${ fName }(${args.join(',')})\n`);
      if (constant) {
        this.log(`RETURN: ${result}\n`);
      } else {
        this.log(`GAS COST: ${parseInt(result.gasUsed, 10)} for "call ${ className }.${ fName }(${args.join(',')})"\n`);
      }
      ast.meta = {
        gas: result.gasUsed
      };
      return result;
    } else {
      this.log(`ERROR: ${contract ? contract.value : contract} is not a valid address.`);
    }
  }
}

module.exports = Interpreter;
