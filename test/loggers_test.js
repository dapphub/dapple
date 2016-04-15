/* global it, describe */
'use strict';

var assert = require('chai').assert;
var loggers = require('../lib/loggers.js');

describe('class MapAwareLogger', function () {
  it('replaces instances of map keys with values in logs', function (done) {
    var streams = {};
    streams[loggers.LEVELS.info] = {
      write: function (data) {
        assert.equal(data, 'value string\n');
        done();
      }
    };
    var mapAwareLogger = new loggers.MapAwareLogger({streams: streams});
    mapAwareLogger.maps = [{'key': 'value'}];
    mapAwareLogger.log('key string');
  });
});
