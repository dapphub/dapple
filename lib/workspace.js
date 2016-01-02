// dapple workspace and dev environment object
// ======
// Most interactions with the filestystem should be contained to this module.
// (`.dapplerc`, `dappfile`, subpackages, etc.) This should be one of the few
// stateful modules in all of `lib/dapple`.

/*
A workspace will be initialized when you run any `dapple` command. It is
dapple's internal configuration object and single point of interaction with the
filesystem.

It will look for the `.dapplerc` file in `DAPPLERC` env var or `~/.dapplerc` It
will look for the `dappfile` in all parents in order (like `git` command and
`.git` folder)
*/

"use strict";

var _ = require('lodash');
var constants = require("./constants");
var fs = require("./file");
var glob = require("glob-fs");
var path = require("path");
var process = require('process');
var readyaml = require("read-yaml");
var vinyl = require("vinyl-fs");

module.exports = class Workspace {

    constructor(path) {
        if( path === undefined ) {
            path = process.cwd();
        }
        this.package_root = Workspace.findWorkspaceRoot(path);
        if( this.package_root === undefined ) {
            throw new Error("Couldn't find workspace. Use `dapple init`");
        }
        this.dappfile = this.loadDappfile();
    }

    static initialize(root_dir) {
        fs.writeFileSync(path.join(root_dir, constants.DAPPFILE_FILENAME),
                         constants.DEFAULT_DAPPFILE_CONTENTS);
        var dappfile = constants.DEFAULT_DAPPFILE_OBJECT;
        for( let dir in dappfile.layout ) {
            fs.mkdirp.sync(path.join(root_dir, dappfile.layout[dir]));
        }
    }

    getBuildDir() {
        return path.join(this.package_root, this.dappfile.layout.build_dir);
    }

    static findWorkspaceRoot(command_dir) {
        var location = command_dir;
        do {
            var dappfile_path = path.join(location, constants.DAPPFILE_FILENAME );
            if( fs.existsSync(dappfile_path) ) {
                return location;
            }
            location = path.join(location, "..");
        } while( location != "/" );
        return undefined;
    }

    getBuildDest() {
        return vinyl.dest(this.getBuildDir());
    }

    getSourceDir() {
        var sourceRoot = this.package_root;

        if (this.dappfile.layout.sol_sources) {
            sourceRoot = path.join(sourceRoot, this.dappfile.layout.sol_sources);
        }

        return sourceRoot;
    }

    getIgnoreGlobs() {
        var that = this;
        return _.map(this.dappfile.ignore, function(glob) {
            return path.join(that.getSourceDir(), glob);
        });
    }

    getPreprocessorVars() {
        return this.dappfile.preprocessor_vars;
    }

    loadDappfile(dappfile_path) {
        if( dappfile_path === undefined ) {
            dappfile_path = path.join(this.package_root, constants.DAPPFILE_FILENAME);
        }
        return readyaml.sync(dappfile_path);
    }
}
