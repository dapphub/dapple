'use strict';

var _ = require('lodash');

class Contract {
  static create (classDefinition) {
    if (!('bytecode' in classDefinition) && !('bin' in classDefinition)) {
      throw new Error('Test class definition has no bytecode');
    }

    if (!('interface' in classDefinition) && !('abi' in classDefinition)) {
      throw new Error('Test class definition has no interface');
    }

    return new Contract(classDefinition);
  }

  constructor (classDefinition) {
    if ('bin' in classDefinition) {
      this.abi = classDefinition.abi || classDefinition.interface;
    } else {
      this.abi = classDefinition.interface || classDefinition.abi;
    }

    if (typeof (this.abi) === 'string') {
      this.abi = JSON.parse(this.abi);
    }
    this.bytecode = classDefinition.bytecode || classDefinition.bin;
    this.asm = classDefinition.asm;
    this.opcodes = classDefinition.opcodes;
    this.bin_runtime = classDefinition.bin_runtime;
  }

  get signatures () {
    // filter out the constructor and return the signatures of the contract
    return _.map(_.filter(this.abi, i => i.type !== 'constructor'), o => {
      var types = _.map(o.inputs, 'type').join(',');
      return o.name + '(' + types + ')';
    });
  }
}

module.exports = Contract;
