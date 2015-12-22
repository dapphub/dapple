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

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
if( cli.build ) {
    var workspace = new Workspace();

    // Run our build pipeline.
    pipelines
        .JSBuildPipeline(workspace.getSourceDir(),
                         workspace.getIgnoreGlobs())

        // Write output to filesystem.
        .pipe(workspace.getBuildDest());


// If they ran the `init` command, we just set up the current directory as a
// Dapple package and exit.
//
} else if (cli.init) {
    console.log(process.cwd());
    Workspace.initialize(process.cwd());

// If they ran the `test` command, we're going to run our build pipeline and
// then pass the output on to our test pipeline, finally spitting out the
// results to stdout and stderr (in case of failure).
//
} else if (cli.test) {
    var workspace = new Workspace();
    var initStream;

    if (cli['--skip-build']) {
        initStream = pipelines.BuiltClassesPipeline(workspace.getBuildDir());

    } else {
        initStream = pipelines
            .BuildPipeline(workspace.getSourceDir(),
                           workspace.getIgnoreGlobs(),
                           workspace.getPreprocessorVars())
            .pipe(workspace.getBuildDest());
    }

    initStream.pipe(pipelines.TestPipeline());
}
