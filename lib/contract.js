"use strict";

module.exports = class Contract {
    constructor(classDefinition) {
        if( !classDefinition.bytecode ) {
            throw new Error("Test class definition has no bytecode");
        }

        if( !classDefinition.interface ) {
            throw new Error("Test class definition has no interface");
        }

        this.abi = classDefinition.interface;
        if( typeof(this.abi) === "string" ) {
            this.abi = JSON.parse(this.abi);
        }
        this.bytecode = classDefinition.bytecode;
    }
};
