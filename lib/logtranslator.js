"use strict";

var _ = require("lodash");
var SolidityEvent = require("web3/lib/web3/event.js");
var Web3 = require('web3');
var web3utils = require('web3/lib/utils/utils.js');

const web3 = new Web3();
const hexTranslators = {
    "bool": (hex) => Boolean(that.opts.web3.toDecimal(hex)),
    //"bytes": (hex) => hex, // TODO: string-like event values should be
                             //"string" types, not "bytes".
    "bytes": (hex) => web3.toAscii(hex).replace(/\u0000/g, ''),
    "string": (hex) => web3.toAscii(hex).replace(/\u0000/g, ''),
    "int": (hex) => web3.toBigNumber(hex).toString(),
    "uint": (hex) => web3.toBigNumber(hex).toString(),
    "address": (hex) => hex
};

module.exports = class LogTranslator {
    constructor(abi) {
        var that = this;

        // Create a mapping of event topics to SolidityEvent objects
        // that can be used to translate them.
        that.eventsJSON = _.filter(abi, function(json) {
            return json.type == "event";
        });
        that.events = _.object(_.map(this.eventsJSON, function (json) {
            var solidityEvent = new SolidityEvent(null, json, null);
            return [
                "0x" + web3.sha3(web3utils.transformToFullName(json)),
                {
                    decode: solidityEvent.decode.bind(solidityEvent),
                    hexTranslators: that._hexTranslatorsFor(json)
                }
            ]
        }));
    }

    translate(_entry) {
        var eventObj;

        // Clone the entry object. Otherwise it gets mutated.
        var entry = JSON.parse(JSON.stringify(_entry));

        for (let topic of entry.topics) {
            eventObj = this.events[web3.toHex(topic)];
            if (eventObj != undefined) break;
        }
        if (eventObj == undefined) return;

        var decoded = eventObj.decode(entry);
        decoded.args = _.mapValues(decoded.args, function (hex, key) {
            return eventObj.hexTranslators[key](hex);
        });
        return decoded;
    }

    translateAll(entries) {
        if (!entries) return [];
        return  _.filter(
                    _.map(entries, this.translate.bind(this)),
                    (x) => x != undefined);
    }

    _hexTranslatorsFor(json) {
        var numbers = /[0-9]*/g;
        return _.zipObject(_.map(json.inputs, (input) => [
            input.name, hexTranslators[input.type.replace(numbers, "")]]));
    }
};
