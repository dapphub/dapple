#!/usr/bin/env node
"use strict";

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

var docopt = require('docopt');
var fs = require('fs');
var ignore = require('gulp-ignore');
var path = require("path");
var streams = require('../lib/streams');
var through = require('through2');
var vinyl = require("vinyl-fs");
var Workspace = require("../lib/workspace");

var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();
var cli = docopt.docopt(doc);

// If the user set the `--build` flag, we're going to open the current directory
// as if it were a package and commence with building.
if( cli.build ) {
    var workspace = new Workspace();
    var sourceRoot = workspace.package_root;

    if (workspace.dappfile.layout.sol_sources) {
        sourceRoot = path.join(sourceRoot, workspace.dappfile.layout.sol_sources);
    }

    // Grab all the files relevant to the package.
    streams.package_stream(sourceRoot)

        // Inject a couple built-in contracts.
        .pipe(streams.inject_virtual_contracts())

        // **TODO**: Either implement a hierarchical ignore
        // filter, or determine that files in the "ignore"
        // pattern get filtered out during publishing.
        // Using gulp-ignore directly for now.
        .pipe(ignore.exclude(workspace.dappfile.ignore))

        // **TODO**: Preprocessors.
        //.pipe(streams.preprocessor())
        
        // **TODO**: File linking.
        //.pipe(streams.link_files())

        // **TODO**: Contract linking.
        //.pipe(streams.link_contracts())
        
        // **TODO**: Add any missing steps.
        //.pipe(...)

        // Build!
        .pipe(streams.build())

        // Write output to filesystem.
        .pipe(vinyl.dest(workspace.getBuildDir()));


// If they set the `--init` flag, we just set up the current directory as a
// Dapple package and exit.

} else if (cli.init) {
    console.log(process.cwd());
    Workspace.initialize(process.cwd());
}
