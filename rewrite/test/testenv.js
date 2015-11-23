var fs = require("../lib/file");
var path = require("path");
module.exports = {
    golden_package_dir: __dirname+"/testenv/golden_package",
    GOLDEN_SOLC_OUT_PATH: path.join(__dirname,"/golden/golden_solc_classes_out.json"),
    golden_solc_output: function() {
        return fs.readJsonSync(this.GOLDEN_SOLC_OUT_PATH);
    }
}
