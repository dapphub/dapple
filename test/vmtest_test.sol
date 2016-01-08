var vmtest = require("../lib/vmtest");
var t = require("./testenv");

describe('VM tests', function() {
    it("instantiates base Test class", function(done) {
        var classes = t.golden_solc_output();
        var result = vmtest.run(classes["Test"], function(err, results) {
            if(err) throw err;
            done();
        });
    });
    it("runs ExampleTest tests", function(done) {
        var classes = t.golden_solc_output();
        vmtest.run(classes["ExampleTest"], function(err, results) {
            if(err) throw err;
            console.log(results);
            done();
        });
    });
    it("can test the example build output", function(done) {
        var classes = t.golden_solc_output();
        var results = vmtest.run_suite(classes);
        console.log(results);
    });
});
