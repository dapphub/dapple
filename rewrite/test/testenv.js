var fs = require("../lib/file");
module.exports = {
    example_package_dir: __dirname+"/testenv/example_package",
    TEST_SOLC_OUT_PATH: __dirname+"/files/example_solc_classes_out.json",
    example_solc_output: function() {
        return fs.readJsonSync(this.TEST_SOLC_OUT_PATH);
    }
}
