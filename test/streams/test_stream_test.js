/* global it, describe */
'use strict';

var assert = require('chai').assert;
var path = require('path');
var streams = require('../../lib/streams.js');
var testenv = require('../testenv');
var through = require('through2');
var vinyl = require('vinyl-fs');

describe('streams.test', function () {
  var classesPath = path.join(testenv.stream_test_dir, 'build', 'classes.json');

  it('[SLOW] emits one file for every failing test', function (done) {
    this.timeout(7000);

    var output = [];

    vinyl.src([classesPath])
      .pipe(streams.test({
        web3: 'internal'
      }))
      .pipe(through.obj(function (file, enc, cb) {
        output.push(file.path);
        cb();
      }, function (cb) {
        cb();
        assert.deepEqual(output.sort(), [
          'Fails/test1 fails.stderr',
          'Fails/test2 fails.stderr',
          'FailsToo/test3 fails.stderr'
        ]);
        done();
      }));
  });
});
