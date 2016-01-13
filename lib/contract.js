"use strict";

var _ = require('lodash');

module.exports = class Contract {
    constructor(classDefinition) {
        if( !classDefinition.bytecode && !classDefinition.bin ) {
            throw new Error("Test class definition has no bytecode");
        }

        if( !classDefinition.interface && !classDefinition.abi ) {
            throw new Error("Test class definition has no interface");
        }

        if (classDefinition.bin) {
            this.abi = classDefinition.abi || classDefinition.interface;

        } else {
            this.abi = classDefinition.interface || classDefinition.abi;
        }

        if( typeof(this.abi) === "string" ) {
            this.abi = JSON.parse(this.abi);
        }
        this.bytecode = classDefinition.bytecode || classDefinition.bin;
    }
    
    get signatures() {
      // filter out the constructor and return the signatures of the contract
      return _.map( _.filter( this.abi, i => i.type != 'constructor' ) , o => { 
        var types = _.map(o.inputs,'type').join(',');
        return o.name+"("+types+")";
      });
    }
};
