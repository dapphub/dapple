'use strict';

var _ = require('lodash');
var SolidityEvent = require('web3/lib/web3/event.js');
var Web3 = require('web3');
var web3utils = require('web3/lib/utils/utils.js');

const web3 = new Web3();
const hexTranslators = {
  'bool': (hex) => hex,
  'bytes': (hex) => hex,
  'logs': (hex) => web3.toAscii(hex).replace(/\u0000/g, ''),
  'string': (hex) => hex,
  'int': (hex) => web3.toBigNumber(hex).toString(),
  'uint': (hex) => web3.toBigNumber(hex).toString(),
  'address': (hex) => hex,
  'bytes[]': (hex) => hex.map(b => b.slice(2)).join(''),
  'uint[]': (hex) => hex.join(', ')

};

module.exports = class LogTranslator {

  static addGenericLog (name, type, format) {
    if (!LogTranslator.logs) LogTranslator.logs = {};
    LogTranslator.logs[name] = {type, format};
  }

  static format (entry) {
    let type = LogTranslator.logs[entry.event].type;
    let out = LogTranslator.logs[entry.event].format;
    out = out
      .replace(/\\`/g, '\0')
      .split('`')
      .map((str, num) => {
        if (num % 2 === 0) return str.replace(/\0/g, '`');
        let name = str
          .replace(/\0/g, '`')
          .split(' ')[1] // get the name
          .replace(/\.|\[|\]|\)|\(|\+|\-|\s+|\=|\<|\>/g, '_'); // substitude illigal chars
        return entry.args[name];
      });
    if (type === 'doc') {
      return out.join('');
    } else {
      return type.toUpperCase() + ':  ' + out.join('');
    }
  }

  constructor (abi) {
    var that = this;

    // Create a mapping of event topics to SolidityEvent objects
    // that can be used to translate them.
    that.eventsJSON = _.filter(abi, function (json) {
      return json.type === 'event';
    });
    that.events = _.object(_.map(this.eventsJSON, function (json) {
      var solidityEvent = new SolidityEvent(null, json, null);
      return [
        '0x' + web3.sha3(web3utils.transformToFullName(json)),
        {
          decode: solidityEvent.decode.bind(solidityEvent),
          hexTranslators: that._hexTranslatorsFor(json)
        }
      ];
    }));
  }

  translate (_entry) {
    var eventObj;

    // Clone the entry object. Otherwise it gets mutated.
    var entry = JSON.parse(JSON.stringify(_entry));

    for (let topic of entry.topics) {
      eventObj = this.events[web3.toHex(topic)];
      if (eventObj !== undefined) break;
    }
    if (eventObj === undefined) return;

    var decoded = eventObj.decode(entry);
    decoded.args = _.mapValues(decoded.args, function (hex, key) {
      return eventObj.hexTranslators[key](hex);
    });
    return decoded;
  }

  translateAll (entries) {
    if (!entries) return [];
    return _.filter(
      _.map(entries, this.translate.bind(this)),
            (x) => x !== undefined);
  }

  _hexTranslatorsFor (json) {
    var numbers = /[0-9]*/g;
    return _.zipObject(_.map(json.inputs, (input) => [
      input.name, hexTranslators[json.name] ||
                  hexTranslators[input.type.replace(numbers, '')]]));
  }
};
