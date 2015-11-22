var assert = require('assert');
var Workspace = require("../lib/workspace");
var testenv = require("./testenv");
var fs = require("fs");

describe('testing Builder class on Example package:  ', function() {
    var workspace = new Workspace(testenv.example_package_dir);
    var Builder = require('../lib/build');
    b = new Builder(workspace);

    it("build recreates example solc_output", function() {
        console.log("Slow test: Verifying solc output");
        this.timeout(10000);
        var classes = b.build();
        // Uncomment to make new golden record
        //fs.writeFileSync(testenv.TEST_SOLC_OUT, JSON.stringify(classes));
        var golden = testenv.example_solc_output();
        assert.deepEqual( classes, golden );
    });
});
