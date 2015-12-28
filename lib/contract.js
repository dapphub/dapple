"use strict";

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
};
