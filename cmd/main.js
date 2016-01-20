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
    userHome: 'user-home',
    vinyl: 'vinyl-fs'
});

var Workspace = require("../lib/workspace");
var VMTest = require("../lib/vmtest");
var rc = Workspace.getDappleRC();

if (cli.config || typeof(rc.path) === 'undefined') {
    var homeRC = req.path.join(req.userHome, '.dapplerc');
    var confirmed;
    var chosen = false;

    if (rc.path !== undefined && rc.path === homeRC) {
        console.log("You already have a .dapplerc in your home directory!");
        req.inquirer.prompt([{
            type: 'confirm',
            message: "Proceeding will overwrite ~/.dapplerc. Proceed?",
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
    var workspace = Workspace.atPackageRoot();

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

    var workspace = Workspace.atPackageRoot();
    var env = cli['--environment'] || workspace.getEnvironment();
    var environments = workspace.getEnvironments();

    if (env && environments && !(env in environments)) {
        console.error("Could not find environment in dappfile: " + env);
        return;
    }

    // Run our build pipeline.
    var jsBuildPipeline = req.pipelines
        .JSBuildPipeline({
            environment: env,
            environments: environments,
            subpackages: cli['--subpackages'] || cli['-s']
        });

    if (!jsBuildPipeline) return;

    // Write output to filesystem.
    jsBuildPipeline.pipe(req.vinyl.dest(Workspace.findBuildPath()));


// If they ran the `init` command, we just set up the current directory as a
// Dapple package and exit.
//
} else if (cli.init) {
    Workspace.initialize(process.cwd());

// If they ran the `new test` command, we're going to generate the boilerplate
// sol files. This command is checked for before the `test` command otherwise
// that test would be triggered instead.
//
} else if (cli.new && cli.test) {
    VMTest.writeTestTemplate(cli['<class>']);

// If they ran the `test` command, we're going to run our build pipeline and
// then pass the output on to our test pipeline, finally spitting out the
// results to stdout and stderr (in case of failure).
//
} else if (cli.test) {
    console.log("Testing...");

    var workspace = Workspace.atPackageRoot();
    var env = cli['--environment'] || workspace.getEnvironment();
    var nameFilter = undefined;

    if (!(env in rc.data.environments)) {
        console.error("Environment not defined: " + env);
        process.exit(1);
    }

    if( cli['-r'] ) {
        // if filter String contains upper case letters special regex chars,
        // assume the filtering is case sensitive, otherwise its insensitive
        nameFilter = new RegExp( cli['<RegExp>'],
          /[A-Z\\\.\[\]\^\$\*\+\{\}\(\)\?\|]/.test(cli['<RegExp>'])?'':'i' );
    }

    var initStream;
    if (cli['--skip-build']) {
        initStream = req.pipelines.BuiltClassesPipeline(
            req.vinyl.dest(Workspace.findBuildPath()),
            cli['--subpackages'] || cli['-s']);

    } else {
        initStream = req.pipelines
            .BuildPipeline({
                packageRoot: Workspace.findPackageRoot(),
                subpackages: cli['--subpackages'] || cli['-s']
            })
            .pipe(req.vinyl.dest(Workspace.findBuildPath()));
    }

    initStream
        .pipe(req.pipelines.TestPipeline({
            web3: rc.data.environments[env].ethereum || 'internal',
            nameFilter: nameFilter
        }));

}
