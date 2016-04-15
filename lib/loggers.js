'use strict';

var _ = require('lodash');
var path = require('path');
var through = require('through2');

const LEVELS = {
  'debug': 1,
  'info': 2,
  'warn': 4,
  'error': 8
};

// A basic logger class. Provides a layer of logging abstraction.
class Logger {
  constructor (opts) {
    var defaults = {
      level: LEVELS.info | LEVELS.error,
      fatal: LEVELS.error,
      streams: {}
    };
    defaults.streams[LEVELS.debug] = process.stdout;
    defaults.streams[LEVELS.info] = process.stdout;
    defaults.streams[LEVELS.warn] = process.stderr;
    defaults.streams[LEVELS.error] = process.stderr;

    this.opts = _.assign(defaults, opts);
  }

  getErrorHandler () {
    var that = this;
    return function (error) {
      that.error(error);
    };
  }

  log (msg) {
    return this._log(msg, LEVELS.info);
  }

  info (msg) {
    return this.log(msg);
  }

  warn (msg) {
    return this._log(msg, LEVELS.warn);
  }

  error (msg) {
    return this._log(msg, LEVELS.error);
  }

  _log (msg, level) {
    if (!Boolean(this.opts.level & level)) return;

    this.opts.streams[level].write(msg + '\n');

    if (Boolean(this.opts.fatal & level)) {
      process.exit(1);
    }
    return this;
  }
}

// Builds on our logging abstraction to provide a logger that can take source
// maps (as output by Dapple) via a through stream and then replace hashes in
// all its logging output with the original data in the map.
class MapAwareLogger extends Logger {
  constructor (opts) {
    super(opts);
    this.maps = [];
  }

  seedStream () {
    var that = this;
    return through.obj(function (file, enc, cb) {
      if (/^__.*map__$/.test(path.basename(file.path))) {
        that.maps.push(JSON.parse(String(file.contents)));
      }
      this.push(file);
      cb();
    });
  }

  _log (msg, level) {
    super._log(_.reduce(this.maps, function (str, map) {
      for (let hash in map) {
        str = str.join ? str.join('') : str;
        str = str.replace(new RegExp(hash, 'g'), map[hash]);
      }
      return str;
    }, msg), level);
  }
}

module.exports = {
  Logger: Logger,
  MapAwareLogger: MapAwareLogger,
  LEVELS: LEVELS
};
