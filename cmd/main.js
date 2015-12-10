#!/usr/bin/env node
"use strict";

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

var docopt = require('docopt');
var fs = require('fs');
var path = require("path");
var pipelines = require("../lib/pipelines");
var Workspace = require("../lib/workspace");

var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();
var cli = docopt.docopt(doc);

// If the user set the `--build` flag, we're going to open the current directory
// as if it were a package and commence with building.
if( cli.build ) {
    var workspace = new Workspace();

    // Run our build pipeline.
    pipelines.BuildPipeline(workspace.getSourceDir(),
                            workspace.getIgnoreGlobs())

        // Write output to filesystem.
        .pipe(workspace.getBuildDest());


// If they set the `--init` flag, we just set up the current directory as a
// Dapple package and exit.

} else if (cli.init) {
    console.log(process.cwd());
    Workspace.initialize(process.cwd());

}
