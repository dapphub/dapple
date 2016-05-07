#!/usr/bin/env node
'use strict';

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

// Usage first.
var fs = require('fs');
var docopt = require('docopt');
var cliSpec = require('../specs/cli.json');
var packageSpec = require('../package.json');
var clc = require('cli-color-tty')(true);
var _ = require('lodash');
var cli = docopt.docopt(getUsage(cliSpec), {
  version: packageSpec.version,
  help: false
});

// Builds the docopt usage from the spec
function getUsage (cliSpec) {
  const usage =
    '    ' +
    cliSpec.commands
      .map(c => `dapple ${c.name} ${c.options.map(o => o.name).join(' ')}`)
      .join('\n    ');
  const options =
    '    ' +
    cliSpec.options
      .map(o => o.name)
      .join('\n    ');
  return `Usage:\n${usage}\n\nOptions:\n${options}`;
}

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
  // get the package HEAD hash to identify the version
  const build = fs.readFileSync(__dirname + '/../.git/ORIG_HEAD').toString();

  // apend the charactar `char` to a given string to match the desired length `number`
  const appendChar = (str, char, number) => {
    for (let i = str.length; i < number; i++) { str += char; }
    return str;
  };

  const longestOption =
    Math.max.apply(this, cliSpec.commands.map(c => Math.max.apply(this, c.options.map(o => o.name.length))));

  const usage = cliSpec.commands
    .map(c => {
      let options = c
        .options.map(o => clc.bold(appendChar(o.name, ' ', longestOption + 4)) + o.summary);
      let required = c.options.filter(o => /^\s*\</.test(o.name)).map(o => o.name).join(' ');
      if (options.length > 0) options.push('');
      return `${appendChar(clc.green('dapple ' + c.name) + ' ' + required + ' ', ' ', longestOption + 18)}${c.summary}\n        ${options.join('\n        ')}`;
    });

  const options =
    cliSpec.options
      .map(o => o.name);

  console.log(`dapple version: ${packageSpec.version}-${build.slice(0, 10)}\n\nUSAGE: dapple COMMAND [OPTIONS]\n\nCOMMANDS:\n    ${usage.join('\n    ')}\n\nOPTIONS:\n    ${options.join('\n     ')}`);
}

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

  let workspace = Workspace.atPackageRoot();
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
      subpackages: cli['--subpackages'] || cli['-s']
    });

  if (!jsBuildPipeline) process.exit(1);

  // Write output to filesystem.
  jsBuildPipeline.pipe(req.vinyl.dest(Workspace.findBuildPath()));

// If they ran the `init` command, we just set up the current directory as a
// Dapple package and exit.
//
} else if (cli.init) {
  try {
    Workspace.initialize(process.cwd());
  } catch (e) {
    console.error('ERROR: ' + e.message);
  }

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
        optimize: cli['--optimize'],
        packageRoot: Workspace.findPackageRoot(),
        subpackages: cli['--subpackages'] || cli['-s'],
        report
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
  let confirmationBlocks = workspace.dappfile.environments[env].confirmationBlocks;
  if (typeof confirmationBlocks === 'undefined') confirmationBlocks = 1;
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
      workspace: workspace,
      confirmationBlocks: confirmationBlocks
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
  let env = cli['--environment'] || 'morden';
  let dappfileEnv = workspace.dappfile.environments &&
                  workspace.dappfile.environments[env] ||
                  {};
  let environment = _.merge({}, rc.environment(env), dappfileEnv);
  // TODO - find a nicer way to inherit and normalize environments: dapplerc -> dappfile -> cli settings
  req.pipelines
      .BuildPipeline({
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
  let workspace = Workspace.atPackageRoot();
  workspace.addPath(cli['<path>']);
} else if (cli.ignore) {
  let workspace = Workspace.atPackageRoot();
  workspace.ignorePath(cli['<path>']);
} else if (cli.doctor) {
  let root = Workspace.findPackageRoot();
  req.doctor(root);
}
