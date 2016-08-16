#!/usr/bin/env node
'use strict';

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var docopt = require('docopt');
var cliSpec = require('../specs/cli.json');
var packageSpec = require('../package.json');
var _ = require('lodash');
var State = require('dapple-core/state.js');
var utils = require('dapple-core/utils.js');

var chainModule = require('dapple-chain');
var scriptModule = require('dapple-script');
var coreModule = require('dapple-core');

var state = new State(cliSpec);

// Register modules
state.registerModule(chainModule);
state.registerModule(scriptModule);
state.registerModule(coreModule);

var cli = docopt.docopt(utils.getUsage(state.cliSpec), {
  version: packageSpec.version,
  help: false
});

// These requires take a lot of time to import.
var req = require('lazreq')({
  deasync: 'deasync',
  Installer: '../lib/installer.js',
  inquirer: 'inquirer',
  path: 'path',
  pipelines: '../lib/pipelines.js',
  userHome: 'user-home',
  vinyl: 'vinyl-fs',
  doctor: '../lib/doctor.js'
});

var Workspace = require('../lib/workspace');
var VMTest = require('../lib/vmtest');

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

// TODO - refactor this
let workspace = Workspace.atPackageRoot();
state.initLocalDb(workspace.package_root);
state.workspace = workspace;

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
} else if (cli.new && cli.test) {
  VMTest.writeTestTemplate(cli['<class>']);

// If they ran the `test` command, we're going to run our build pipeline and
// then pass the output on to our test pipeline, finally spitting out the
// results to stdout and stderr (in case of failure).
//
} else if (cli.test) {
  console.log('Testing...');

  let nameFilter;
  let report = cli['--report'] || false;

  if (cli['-r']) {
    // if filter String contains upper case letters special regex chars,
    // assume the filtering is case sensitive, otherwise its insensitive
    nameFilter = new RegExp(cli['<RegExp>'],
      /[A-Z\\\.\[\]\^\$\*\+\{\}\(\)\?\|]/.test(cli['<RegExp>']) ? '' : 'i');
  }

  // var provider = chainModule.web3Provider({
  //   mode: 'temporary'
  // });
  // provider.manager.blockchain.setGasLimit(900000000);
  // var web3 = new Web3(provider);
  // web3.eth.defaultAccount = provider.manager.blockchain.defaultAccount();

  var testPipeline = req.pipelines.TestPipeline({
    nameFilter: nameFilter,
    mode: cli['--persistent'] ? 'persistent' : 'temporary',
    state
  });

  let initStream;
  if (cli['--skip-build']) {
    initStream = req.pipelines.BuiltClassesPipeline({
      buildRoot: Workspace.findBuildPath(),
      packageRoot: Workspace.findPackageRoot(),
      subpackages: cli['--subpackages'] || cli['-s']
    });
  } else {
    initStream = req.pipelines
      .BuildPipeline({
        modules: state.modules,
        optimize: cli['--optimize'],
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s'],
        report,
        state
      })
      .pipe(req.vinyl.dest(Workspace.findBuildPath()));
  }

  initStream.pipe(testPipeline);
} else if (cli.doctor) {
  let root = Workspace.findPackageRoot();
  req.doctor(root);
// TODO make this modular
} else if (cli.chain) {
  state.modules.chain.controller.cli(cli, state);
} else if (cli.script) {
  state.modules.script.controller.cli(state, cli, req.pipelines.BuildPipeline);
}

state.modules.core.controller.cli(cli, workspace, state);
