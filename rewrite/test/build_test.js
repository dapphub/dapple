var assert = require('assert');
var Workspace = require("../lib/workspace");
var testenv = require("./testenv");
var fs = require("../lib/file");
var path = require("path");

describe('class Builder', function() {
    var workspace = new Workspace(testenv.golden_package_dir);
    var Builder = require('../lib/build');
    b = new Builder(workspace);

    it.skip("[SLOW] .build recreates example solc_output (returns and writes)", function(done) {
        this.timeout(10000);

        var tmpdir = fs.tmpdir();
        var returned = b.build(tmpdir);
        // Uncomment to make new golden record
        //fs.writeJsonSync(testenv.GOLDEN_SOLC_OUT_PATH, returned);
        var written = fs.readJsonSync(path.join(tmpdir, "classes.json"));
        var golden = testenv.golden.SOLC_OUT();

        assert.deepEqual( returned, golden );
        assert.deepEqual( written, golden );
        done();
    });
});
