var assert = require('assert');
var Workspace = require("../lib/workspace");
var testenv = require("./testenv");
var fs = require("../lib/file");

describe('testing Builder class on Example package:  ', function() {
    var workspace = new Workspace(testenv.example_package_dir);
    var Builder = require('../lib/build');
    b = new Builder(workspace);

    it("[SLOW] build recreates example solc_output (returns and writes)", function(done) {
        this.timeout(10000);

        var tmpdir = fs.tmpdir();
        var returned = b.build(tmpdir);
        // Uncomment to make new golden record
        // fs.writeJsonSync(testenv.TEST_SOLC_OUT_PATH, returned);
        var written = fs.readJsonSync(tmpdir+"/classes.json");
        var golden = testenv.example_solc_output();

        assert.deepEqual( returned, golden );
        assert.deepEqual( written, golden );
        done();
    });
});
