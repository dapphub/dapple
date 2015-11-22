var fs = require("fs");
fs.readFileStringSync = function(path) {
    return fs.readFileSync(path).toString();
}
fs.readJsonSync = function(path) {
    return JSON.parse(fs.readFileSyncToString());
}
module.exports = fs;
