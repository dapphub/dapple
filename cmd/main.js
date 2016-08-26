#!/usr/bin/env node
'use strict';

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var docopt = require('docopt');
var cliSpec = require('../specs/cli.json');
var State = require('dapple-core/state.js');
var utils = require('dapple-core/utils.js');

var chainModule = require('dapple-chain');
var scriptModule = require('dapple-script');
var coreModule = require('dapple-core');
var testModule = require('dapple-test');
// var pkgModule = require('dapple-pkg');

var state = new State(cliSpec);

// Register modules
state.registerModule(chainModule);
state.registerModule(scriptModule);
state.registerModule(coreModule);
state.registerModule(testModule);
// state.registerModule(pkgModule);

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
  doctor: '../lib/doctor.js',
  packageSpec: '../package.json'
});

var Workspace = require('../lib/workspace');

if (cli['--help']) {
  utils.getHelp(__dirname, cliSpec, req.packageSpec);
  process.exit();
} else if (cli.init) {
  try {
    Workspace.initialize(process.cwd());
  } catch (e) {
    console.error('ERROR: ' + e.message);
  }
  process.exit();
}

// TODO - refactor this
let workspace = Workspace.atPackageRoot();
state.initWorkspace(workspace);
// state.initLocalDb(workspace.package_root);
// state.workspace = workspace;

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
if (cli.build) {
  console.log('Building...');

  var nameFilter;
  if (cli['-r']) {
    // if filter String contains upper case letters special regex chars,
    // assume the filtering is case sensitive, otherwise its insensitive
    nameFilter = new RegExp(cli['<RegExp>'],
      /[A-Z\\\.\[\]\^\$\*\+\{\}\(\)\?\|]/.test(cli['<RegExp>']) ? '' : 'i');
  }

  // Run our build pipeline.
  let jsBuildPipeline = req.pipelines
    .JSBuildPipeline({
      deployData: !cli['--no-deploy-data'],
      optimize: cli['--optimize'],
      globalVar: cli['--global'],
      template: cli['--template'],
      name: workspace.dappfile.name,
      nameFilter: nameFilter,
      include_tests: cli['--tests'],
      subpackages: cli['--subpackages'] || cli['-s'],
      modules: state.modules,
      state
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
} else if (cli.test) {
  state.modules.test.controller.cli(state, cli, req.pipelines.BuildPipeline);
} else if (cli.doctor) {
  let root = Workspace.findPackageRoot();
  req.doctor(root);
// TODO make this modular
} else if (cli.chain) {
  state.modules.chain.controller.cli(cli, state);
} else if (cli.script) {
  state.modules.script.controller.cli(state, cli, req.pipelines.BuildPipeline);
} else if (cli.pkg) {
  // state.modules.pkg.controller.cli(state, cli, req.pipelines.BuildPipeline);
}

state.modules.core.controller.cli(cli, workspace, state);
