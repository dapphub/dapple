#!/usr/bin/env node
'use strict';

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var docopt = require('docopt');
var cliSpec = require('../specs/cli.json');
var State = require('dapple-core/state.js');
var utils = require('dapple-core/utils.js');
var packageSpec = require('../package.json');

var chainModule = require('dapple-chain');
var scriptModule = require('dapple-script');
var coreModule = require('dapple-core');
var testModule = require('dapple-test');
var pkgModule = require('dapple-pkg');
// var nssModule = require('dapple-nss');
// var execModule = require('dapple-exec');

var state = new State(cliSpec);

// Register modules
state.registerModule(chainModule);
state.registerModule(scriptModule);
state.registerModule(coreModule);
state.registerModule(testModule);
state.registerModule(pkgModule);
// state.registerModule(nssModule);
// state.registerModule(execModule);

state.dapple_version = packageSpec.version;

var cli = docopt.docopt(utils.getUsage(state.cliSpec), {
  version: packageSpec.version,
  help: false
});

// These requires take a lot of time to import.
var req = require('lazreq')({
  path: 'path',
  pipelines: '../lib/pipelines.js',
  userHome: 'user-home',
  vinyl: 'vinyl-fs',
  doctor: '../lib/doctor.js'
});

var Workspace = require('../lib/workspace');
// var VMTest = require('../lib/vmtest');

if (cli['--help']) {
  utils.getHelp(__dirname, cliSpec, packageSpec);
  process.exit();
} else if (cli.init) {
  try {
    Workspace.initialize(process.cwd());
  } catch (e) {
    console.error('ERROR: ' + e.message);
  }
  process.exit();
}

// TODO - add flag to cli's which indicates wether this command is run out
//        of a dapple package folder or globally. Take this flag to initialize
//        a workspace. Remove migrate test since it is part of core.
var workspace;
workspace = Workspace.atPackageRoot();

// TODO - refactor this
state.initWorkspace({workspace, cli}, () => {
  if (cli.build) {
    console.log('Building...');

    var contractFilter = /.*/;
    var functionFilter = /.*/;
    if (cli['-r']) {
      let filter = cli['<filter>'].split('.');
      contractFilter = new RegExp('^' + filter[0].split('*').join('.*') + '$', 'i');
      if (filter.length > 1) {
        functionFilter = new RegExp('^' + filter[1].split('*').join('.*') + '$', 'i');
      } else {
        functionFilter = /.*/;
      }
    }

    // Run our build pipeline.
    let jsBuildPipeline = req.pipelines
      .JSBuildPipeline({
        deployData: !cli['--no-deploy-data'],
        optimize: cli['--no-optimize'],
        globalVar: cli['--global'],
        template: cli['--template'],
        name: workspace.dappfile.name,
        contractFilter,
        functionFilter,
        include_tests: cli['--tests'],
        subpackages: cli['--subpackages'] || cli['-s'],
        dumpFile: cli['--dumpFile'],
        dumpDir: cli['--dumpDir'],
        modules: state.modules,
        state,
        packageRoot: state.workspace.package_root
      });

    if (!jsBuildPipeline) process.exit(1);

    // Write output to filesystem.
    jsBuildPipeline.pipe(req.vinyl.dest(Workspace.findBuildPath()));

  // If they ran the `init` command, we just set up the current directory as a
  // Dapple package and exit.
  //

  // If they ran the `new test` command, we're going to generate the boilerplate
  // sol files. This command is checked for before the `test` command otherwise
  // that test would be triggered instead.
  //
  } else if (cli.doctor) {
    let root = Workspace.findPackageRoot();
    req.doctor(root);
  } else { // Module invocation
    var module = Object.keys(state.modules).find(m => cli[m] === true);
    if (typeof module === 'string') {
      state.modules[module].controller.cli(state, cli, req.pipelines.BuildPipeline);
    }
  }

  state.modules.core.controller.cli(cli, workspace, state);
});

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
