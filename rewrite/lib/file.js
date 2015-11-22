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
fs.existsSync = function(path) {
    try {
        var stats = fs.lstatSync(path);
        return true;
    } catch (e) {
        if (e.errno == -2) {
            return false;
        }
        throw e;
    }
}
fs.tmpdir = os.tmpdir;
module.exports = fs;
