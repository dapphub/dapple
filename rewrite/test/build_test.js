var assert = require('assert');
var Workspace = require("../lib/workspace");
var testenv = require("./testenv");

describe('testing Builder class on Example package', function() {
    var workspace = new Workspace(testenv.example_package_dir);
    var Builder = require('../lib/build');
    b = new Builder(workspace);

    it("", function() {
    });
});
