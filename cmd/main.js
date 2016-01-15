#!/usr/bin/env node
"use strict";

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var fs = require('fs')
var docopt = require('docopt');
var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();
var cli = docopt.docopt(doc);

// These requires take a lot of time to import.
var req = require('lazreq')({
    DappleRCPrompter: "../lib/dapplerc_prompter.js",
    deasync: 'deasync',
    Installer: '../lib/installer.js',
    inquirer: 'inquirer',
    path: 'path',
    pipelines: '../lib/pipelines.js',
    userHome: 'user-home'
});

var Workspace = require("../lib/workspace");
var rc = Workspace.getDappleRC();

if (cli.config || typeof(rc.path) === 'undefined') {
    var homeRC = req.path.join(req.userHome, '.dapplerc');

    var confirmed;
    var chosen = false;
    if (rc.path !== undefined && rc.path === homeRC) {
        console.log("You already have a .dapplerc in your home directory!");
        req.inquirer.prompt([{
            type: 'confirm',
            message: "Proceeding will overwrite that file. Proceed?",
            name: "confirmed",
            default: false
        }], function(res) {
            chosen = true;
            confirmed = res.confirmed;
        })
        req.deasync.loopWhile(function() {return !chosen;});

        if (confirmed) {
            Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
        }

    } else {
        console.log("No configuration found! Generating...");
        Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
    }
    rc = Workspace.getDappleRC();
}

// If the user ran the `install` command, we're going to walk the dependencies
// in the dappfile and pull them in as git submodules, if the current package is
// a git repository. Otherwise we'll just clone them.
if( cli.install ) {
    var workspace = new Workspace();

    var packages;
    if ( cli['<package>'] ) {
        packages = [cli['<package>']];
    } else {
        packages = workspace.getDependencies();
    }

    req.Installer.install(packages, console);

    if ( cli['--save'] && cli['<package>'] ) {
        workspace.addDependency(cli['<package>']);
        workspace.writeDappfile();
    }

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
} else if( cli.build ) {
    console.log("Building...");

    var workspace = new Workspace();

    // Run our build pipeline.
    var jsBuildPipeline = req.pipelines
        .JSBuildPipeline({
            environment: cli['--environment'] || workspace.getEnvironment(),
            environments: workspace.getEnvironments(),
            ignore: workspace.getIgnoreGlobs(),
            packageRoot: workspace.package_root,
            preprocessorVars: workspace.getPreprocessorVars(),
            sourceRoot: workspace.getSourceDir()
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
    var env = cli['--environment'] || workspace.getEnvironment();
    var nameFilter = ( cli['--name'] && new RegExp( cli['--name'].toLowerCase() ) ) || undefined;
    var initStream;

    if (cli['--skip-build']) {
        initStream = req.pipelines.BuiltClassesPipeline(
            workspace.getBuildDir());

    } else {
        initStream = req.pipelines
            .BuildPipeline({
                ignore: workspace.getIgnoreGlobs(),
                packageRoot: workspace.package_root,
                preprocessorVars: workspace.getPreprocessorVars(),
                sourceRoot: workspace.getSourceDir()
            })
            .pipe(workspace.getBuildDest());
    }

    if (!(env in rc.data.environments)) {
        console.error("Environment not defined: " + env);

    } else {
        initStream
            .pipe(req.pipelines.TestPipeline({
                web3: rc.data.environments[env].ethereum || 'internal',
                nameFilter: nameFilter 
            }));
    }
}
