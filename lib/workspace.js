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

var req = require('lazreq')({
    vinyl: 'vinyl-fs'
})

var constants = require("./constants");
var DappleRC = require('../lib/dapplerc.js');
var fs = require("./file");
var path = require("path");
var readyaml = require("read-yaml");

module.exports = class Workspace {

    constructor(wsPath) {
        if( wsPath === undefined ) {
            wsPath = process.cwd();
        }
        this.package_root = Workspace.findWorkspaceRoot(wsPath);
        if( this.package_root === undefined ) {
            throw new Error("Couldn't find workspace. Use `dapple init`");
        }
        this._dappfile = this.loadDappfile();
    }

    static initialize(root_dir) {
        fs.writeFileSync(path.join(root_dir, constants.DAPPFILE_FILENAME),
                         constants.DEFAULT_DAPPFILE_CONTENTS);
        var dappfile = constants.DEFAULT_DAPPFILE_OBJECT;
        var layout = dappfile.layout || {};
        for( let dir in layout ) {
            fs.mkdirp.sync(path.join(root_dir, layout[dir]));
        }
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

    static getDappleRC(opts) {
        return new DappleRC(opts);
    }

    static writeDappleRC(rcPath, data) {
        return DappleRC.writeSync(rcPath, data);
    }

    get dappfile() {
        return this._dappfile || {};
    }

    getLayout() {
        return this.dappfile.layout || {};
    }

    getBuildDir() {
        return path.join(this.package_root,
                         this.getLayout().build_dir || 'build');
    }

    getBuildDest() {
        return req.vinyl.dest(this.getBuildDir());
    }

    getSourceDir() {
        return this.getLayout().sol_sources;
    }

    getSourcePath() {
        var sourceRoot = this.package_root;

        if (this.getLayout().sol_sources) {
            sourceRoot = path.join(sourceRoot, this.getSourceDir());
        }

        return sourceRoot;
    }

    getPackagesDir() {
        return this.getLayout().packages_director || "dapple_packages";
    }

    getPackagesPath() {
        return path.join(this.package_root, this.getPackagesDir());
    }

    getIgnoreGlobs() {
        var globs = [];
        for (let glob of (this.dappfile.ignore || [])) {
            globs.push(path.join(this.getSourceDir(), glob));
        }
        return globs;
    }

    getPreprocessorVars() {
        return this.dappfile.preprocessor_vars;
    }

    getEnvironment() {
        return this.dappfile.environment || 'default';
    }

    getEnvironments() {
        return this.dappfile.environments;
    }

    getDappfilePath() {
        return path.join(this.package_root, constants.DAPPFILE_FILENAME);
    }

    loadDappfile(dappfile_path) {
        if( dappfile_path === undefined ) {
            dappfile_path = this.getDappfilePath();
        }
        return readyaml.sync(dappfile_path);
    }

    writeDappfile() {
        return fs.writeYamlSync(this.getDappfilePath(), this.dappfile);
    }

    addDependency(packagePath) {
        if ( !this.dappfile.dependencies ) {
            this.dappfile.dependencies = {};
        }
        this.dappfile.dependencies[path.basename(packagePath)] = packagePath;
    }

    getDependencies() {
        return this.dappfile.dependencies || {};
    }
}
