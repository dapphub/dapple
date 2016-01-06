#!/usr/bin/env node
"use strict";

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

var Builder = require("../lib/build");
var DappleRCPrompter = require("../lib/dapplerc_prompter.js");
var deasync = require('deasync');
var docopt = require('docopt');
var fs = require('../lib/file.js');
var inquirer = require('inquirer');
var path = require("path");
var pipelines = require("../lib/pipelines");
var userHome = require('user-home');
var VMTest = require("../lib/vmtest");
var Workspace = require("../lib/workspace");

var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();
var cli = docopt.docopt(doc);
var rc = Workspace.getDappleRC();

if (cli.config || typeof(rc.path) === 'undefined') {
    var homeRC = path.join(userHome, '.dapplerc');

    var confirmed;
    var chosen = false;
    if (rc.path !== undefined && rc.path === homeRC) {
        console.log("You already have a .dapplerc in your home directory!");
        inquirer.prompt([{
            type: 'confirm',
            message: "Proceeding will overwrite that file. Proceed?",
            name: "confirmed",
            default: false
        }], function(res) {
            chosen = true;
            confirmed = res.confirmed;
        })
        deasync.loopWhile(function() {return !chosen;});

        if (confirmed) {
            Workspace.writeDappleRC(homeRC, DappleRCPrompter.prompt());
        }

    } else {
        console.log("No configuration found! Generating...");
        Workspace.writeDappleRC(homeRC, DappleRCPrompter.prompt());
    }
}

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
if( cli.build ) {
    console.log("Building...");

    var workspace = new Workspace();

    // Run our build pipeline.
    var jsBuildPipeline = pipelines
        .JSBuildPipeline({
            environment: cli['--environment'] || workspace.getEnvironment(),
            environments: workspace.getEnvironments(),
            packageRoot: workspace.package_root,
            sourceRoot: workspace.getSourceDir(),
            ignore: workspace.getIgnoreGlobs(),
            preprocessorVars: workspace.getPreprocessorVars(),
            logger: console
        });

    if (!jsBuildPipeline) return;

    // Write output to filesystem.
    jsBuildPipeline.pipe(workspace.getBuildDest());


// If they ran the `init` command, we just set up the current directory as a
// Dapple package and exit.
//
} else if (cli.init) {
    Workspace.initialize(process.cwd());

// If they ran the `test` command, we're going to run our build pipeline and
// then pass the output on to our test pipeline, finally spitting out the
// results to stdout and stderr (in case of failure).
//
} else if (cli.test) {
    console.log("Testing...");

    var workspace = new Workspace();
    var initStream;

    if (cli['--skip-build']) {
        initStream = pipelines.BuiltClassesPipeline(workspace.getBuildDir());

    } else {
        initStream = pipelines
            .BuildPipeline({
            packageRoot: workspace.package_root,
            sourceRoot: workspace.getSourceDir(),
            ignore: workspace.getIgnoreGlobs(),
            preprocessorVars: workspace.getPreprocessorVars(),
            logger: console
        }).pipe(workspace.getBuildDest());
    }

    initStream.pipe(pipelines.TestPipeline());
}
