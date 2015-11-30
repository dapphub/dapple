var vmtest = require("../lib/vmtest");
var t = require("./testenv");

describe('VM tests', function() {
    it.skip("instantiates base Test class", function(done) {
        var classes = t.golden_solc_output();
        var result = vmtest.run(classes["Test"]);
    });
});
