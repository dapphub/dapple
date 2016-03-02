// Extensions for the `fs` module which we use often.
// Everything in here should work its way into someone else's library.
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var readyaml = require('read-yaml');
var tmp = require('tmp');
var writeyaml = require('write-yaml');

fs.readFileStringSync = function (path) {
  return fs.readFileSync(path).toString();
};

fs.readJsonSync = function (path) {
  return JSON.parse(fs.readFileStringSync(path));
};

fs.writeJsonSync = function (path, data) {
  return fs.writeFileSync(path, JSON.stringify(data));
};

fs.existsSync = function (path) {
  try {
    fs.lstatSync(path);
    return true;
  } catch (e) {
    if (e.errno === -2) {
      return false;
    }
    throw e;
  }
};

fs.readYamlSync = function (path) {
  return readyaml.sync(path);
};

fs.writeYamlSync = function (path, data) {
  return writeyaml.sync(path, data);
};

fs.tmpdir = function () {
  return tmp.dirSync().name;
};

fs.mkdirp = mkdirp;

module.exports = fs;
