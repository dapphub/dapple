#!/usr/bin/env node
'use strict';

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var fs = require('fs');
var docopt = require('docopt');
var doc = fs.readFileSync(__dirname + '/docopt.txt').toString();
var cli = docopt.docopt(doc);
var _   = require('lodash');

// These requires take a lot of time to import.
var req = require('lazreq')({
  DappleRCPrompter: '../lib/dapplerc_prompter.js',
  deasync: 'deasync',
  Installer: '../lib/installer.js',
  inquirer: 'inquirer',
  path: 'path',
  pipelines: '../lib/pipelines.js',
  userHome: 'user-home',
  vinyl: 'vinyl-fs'
});

var Workspace = require('../lib/workspace');
var VMTest = require('../lib/vmtest');
var rc = Workspace.getDappleRC();

if (cli.config || typeof (rc.path) === 'undefined') {
  let homeRC = req.path.join(req.userHome, '.dapplerc');
  let confirmed;
  let chosen = false;

  if (rc.path !== undefined && rc.path === homeRC) {
    console.log('You already have a .dapplerc in your home directory!');
    req.inquirer.prompt([{
      type: 'confirm',
      message: 'Proceeding will overwrite ~/.dapplerc. Proceed?',
      name: 'confirmed',
      default: false
    }], function (res) {
      chosen = true;
      confirmed = res.confirmed;
    });
    req.deasync.loopWhile(function () { return !chosen; });

    if (confirmed) {
      Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
    }
  } else {
    console.log('No configuration found! Generating...');
    Workspace.writeDappleRC(homeRC, req.DappleRCPrompter.prompt());
  }
  rc = Workspace.getDappleRC();
}

// If the user ran the `install` command, we're going to walk the dependencies
// in the dappfile and pull them in as git submodules, if the current package is
// a git repository. Otherwise we'll just clone them.
if (cli.install) {
  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();

  if (!(env in rc.data.environments)) {
    console.error('Environment not defined: ' + env);
    process.exit(1);
  }
  let web3 = rc.environment(env).ethereum || 'internal';

  let packages;
  if (cli['<package>']) {
    if (!cli['<url-or-version>']) {
      console.error('No version or URL specified for package.');
      process.exit(1);
    }
    packages = {};
    packages[cli['<package>']] = cli['<url-or-version>'];
  } else {
    packages = workspace.getDependencies();
  }

  let success = req.Installer.install(packages, console, web3);

  if (success && cli['--save'] && cli['<package>']) {
    workspace.addDependency(cli['<package>'], cli['<url-or-version>']);
    workspace.writeDappfile();
  }

// If the user ran the `build` command, we're going to open the current directory
// as if it were a package and commence with building.
//
} else if (cli.build) {
  console.log('Building...');

  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();
  let environments = workspace.getEnvironments();

  if (env && environments && !(env in environments)) {
    console.error('Could not find environment in dappfile: ' + env);
    process.exit(1);
  }

  // Run our build pipeline.
  let jsBuildPipeline = req.pipelines
    .JSBuildPipeline({
      environment: env,
      environments: environments,
      subpackages: cli['--subpackages'] || cli['-s']
    });

  if (!jsBuildPipeline) process.exit(1);

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
  console.log('Testing...');

  let nameFilter;
  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();

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
} else if (cli.run) {
  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();
  let fileName = cli['<script>'];
  // TODO - refactor to wirkspace
  let file = fs.readFileSync(workspace.getPackageRoot() + '/' + fileName, 'utf8');
  req.pipelines
      .BuildPipeline({
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s']
      })
    .pipe(req.pipelines.RunPipeline({
      environment: env,
      script: file,
      simulate: !cli['--no-simulation'],
      throws: !cli['--force'],
      web3: (rc.environment(env).ethereum || 'internal'),
      workspace: workspace
    }));
} else if (cli.step) {
  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();
  let file = cli['<string>'];
  req.pipelines
      .BuildPipeline({
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s']
      })
    .pipe(req.pipelines.RunPipeline({
      environment: env,
      environments: workspace.getEnvironments(),
      script: file,
      simulate: !cli['--no-simulation'],
      throws: !cli['--force'],
      web3: (rc.data.environments[env].ethereum || 'internal'),
      workspace: workspace
    }));
} else if (cli.publish) {
  let workspace = Workspace.atPackageRoot();
  let env = cli['--environment'] || workspace.getEnvironment();
  // TODO - find a nicer way to inherit and normalize environments: dapplerc -> dappfile -> cli settings
  req.pipelines
      .BuildPipeline({
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s']
      })
      .pipe(req.pipelines.PublishPipeline({
        environment: env,
        dappfile: workspace.dappfile,
        ipfs: rc.environment(env).ipfs,
        path: workspace.package_root,
        web3: (rc.environment(env).ethereum || 'internal'),
      }));

}
