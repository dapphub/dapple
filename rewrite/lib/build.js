var fs = require("fs");
module.exports = class Builder {
    readSourceFiles(paths) {
        var out = {};
        for( var path of paths ) {
            out[path] = fs.readFileSync(path).toString();
        }
        return out;
    }
    buildWithDapplePackage(sources) {
        var test_path = "defaults/dapple_virtual_package/test.sol";
        var debug_path = "defaults/dapple_virtual_package/debug.sol";
        sources["dapple/test.sol"] = fs.readFileSync(test_path).toString();
        sources["dapple/debug.sol"] = fs.readFileSync(debug_path).toString();
        var solc = require("solc");
        var out = solc.compile({sources:sources}, 1);
        if( out.errors ) {
            throw out.errors;
        }
        return out.contracts;
    }
}
