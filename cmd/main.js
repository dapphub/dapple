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
  DappleRCPrompter: '../lib/dapplerc_prompter.js',
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
var rc = Workspace.getDappleRC();

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

let workspace = Workspace.atPackageRoot();
state.initLocalDb(workspace.package_root);

if (cli.config || typeof (rc.path) === 'undefined') {
  console.log(' config deprecated ');

  // let homeRC = req.path.join(req.userHome, '.dapplerc');
  // let confirmed;
  // let chosen = false;
  //
  // if (rc.path !== undefined && rc.path === homeRC) {
  //   console.log('You already have a .dapplerc in your home directory!');
  //   req.inquirer.prompt([{
  //     type: 'confirm',
  //     message: 'Proceeding will overwrite ~/.dapplerc. Proceed?',
  //     name: 'confirmed',
  //     default: false
  //   }], function (res) {
  //     chosen = true;
  //     confirmed = res.confirmed;
  //   });
  //   req.deasync.loopWhile(function () { return !chosen; });
  //
  //   if (confirmed) {
  //     Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
  //   }
  // } else {
  //   console.log('No configuration found! Generating...');
  //   Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
  // }
  // rc = Workspace.getDappleRC();
}

// If the user ran the `install` command, we're going to walk the dependencies
// in the dappfile and pull them in as git submodules, if the current package is
// a git repository. Otherwise we'll just clone them.
if (cli.install) {
  // let env = cli['--environment'] || workspace.getEnvironment();
  let env = 'morden';

  if (!(env in rc.data.environments)) {
    console.error('Environment not defined: ' + env);
    process.exit(1);
  }
  let web3 = rc.environment(env).ethereum || 'internal';
  let dappfileEnv = workspace.dappfile.environments &&
                  workspace.dappfile.environments[env] ||
                  {};
  let environment = _.merge({}, rc.environment(env), dappfileEnv);

  let packages;
  if (cli['<package>']) {
    if (!cli['<url-or-version>']) {
      // asume dapphub package
      cli['<url-or-version>'] = 'latest';
      // console.error('No version or URL specified for package.');
      // process.exit(1);
    }
    packages = {};
    packages[cli['<package>']] = cli['<url-or-version>'];
  } else {
    packages = workspace.getDependencies();
  }

  let success = req.Installer.install(packages, console, web3, environment);

  if (success && cli['--save'] && cli['<package>']) {
    workspace.addDependency(cli['<package>'], cli['<url-or-version>']);
    workspace.writeDappfile();
  }

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
} else if (cli.build) {
  console.log('Building...');

  let env = cli['--environment'] || workspace.getEnvironment();
  let environments = workspace.getEnvironments();

  if (env && environments && !(env in environments)) {
    console.error('Could not find environment in dappfile: ' + env);
    process.exit(1);
  }

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
      environment: env,
      optimize: cli['--optimize'],
      environments: environments,
      globalVar: cli['--global'],
      template: cli['--template'],
      name: workspace.dappfile.name,
      nameFilter: nameFilter,
      include_tests: cli['--tests'],
      subpackages: cli['--subpackages'] || cli['-s'],
      modules: state.modules
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
  let env = cli['--environment'] || workspace.getEnvironment();
  let report = cli['--report'] || false;

  if (!(env in rc.data.environments)) {
    console.error('Environment not defined: ' + env);
    process.exit(1);
  }

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
    web3: rc.data.environments[env].ethereum || 'internal',
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
} else if (cli.publish) {
  let env = cli['--environment'] || 'morden';
  let dappfileEnv = workspace.dappfile.environments &&
                  workspace.dappfile.environments[env] ||
                  {};
  let environment = _.merge({}, rc.environment(env), dappfileEnv);
  // TODO - find a nicer way to inherit and normalize environments: dapplerc -> dappfile -> cli settings
  req.pipelines
      .BuildPipeline({
        modules: state.modules,
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s']
      })
      .pipe(req.pipelines.PublishPipeline({
        dappfile: workspace.dappfile,
        ipfs: rc.environment(env).ipfs,
        path: workspace.package_root,
        web3: (rc.environment(env).ethereum || 'internal'),
        environment: environment
      }));
} else if (cli.add) {
  workspace.addPath(cli['<path>']);
} else if (cli.ignore) {
  workspace.ignorePath(cli['<path>']);
} else if (cli.doctor) {
  let root = Workspace.findPackageRoot();
  req.doctor(root);
// TODO make this modular
} else if (cli.chain) {
  state.modules.chain.controller.cli(cli, workspace, state);
} else if (cli.script) {
  // TODO - create one big global environmet out of State
  let envName = cli['--environment'] || workspace.getEnvironment();
  let dappfileEnv = workspace.dappfile.environments &&
    workspace.dappfile.environments[envName] ||
      {};
  let environment = _.merge({}, rc.environment(envName), dappfileEnv);

  let env = {
    name: envName,
    environment: environment,
    modules: state.modules
  };

  state.modules.script.controller.cli(state, cli, workspace, env, req.pipelines.BuildPipeline);
}

state.modules.core.controller.cli(cli, workspace, state);
