var fs = require("fs");
var os = require("os");
fs.readFileStringSync = function(path) {
    return fs.readFileSync(path).toString();
}
fs.readJsonSync = function(path) {
    return JSON.parse(fs.readFileStringSync(path));
}
fs.writeJsonSync = function(path, data) {
    return fs.writeFileSync(path, JSON.stringify(data));
}
fs.tmpdir = os.tmpdir;
module.exports = fs;
