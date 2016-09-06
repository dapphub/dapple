'use strict';

// var _ = require('lodash');
var clc = require('cli-color-tty')(true);
// var Workspace = require('./workspace');
// var Web3 = require('web3');
// var schemas = require('./schemas');
var child_process = require('child_process');

// const doctorDappleRc = () => {
//   console.log(clc.bold(`Analyzing your dapplerc`));
//   // TODO - test if dapplerc is available
//   var rc = Workspace.getDappleRC();
//   var result = schemas.dapplerc.validateResult(rc.data);
//   if (!result.valid) {
//     console.log(clc.red('ERROR: local dapplerc is not valid!'));
//     return false;
//   }
//   console.log(`checking the status of each environment, this might take a while...`);
//
//   const isOk = (connection_string) => {
//     let web3 = new Web3(new Web3.providers.HttpProvider(connection_string));
//     try {
//       if (web3.isConnected()) {
//         return {
//           ok: true,
//           genesis: web3.eth.getBlock(0).hash,
//           height: web3.eth.blockNumber
//         };
//       } else {
//         return {ok: false};
//       }
//     } catch (e) {
//       return {ok: false};
//     }
//   };
//
//   var envStatus = Object.keys(rc.data.environments)
//     .map(name => { return { name: name, env: rc.environment(name) }; })
//     .filter(env => typeof env.env.ethereum === 'object')
//     .map(env => {
//       return {
//         name: env.name,
//         uri: `http://${env.env.ethereum.host}:${env.env.ethereum.port}`,
//         ok: isOk(`http://${env.env.ethereum.host}:${env.env.ethereum.port}`)
//       }; })
//     .map(env => {
//       let stats = `\ngenesis-hahs: ${env.ok.genesis}\nblock-height: ${env.ok.height}\n`;
//       return `Environment ${clc.bold(env.name)}: ${env.ok.ok ? (clc.green('OK!') + stats) : clc.red('no connection on ' + env.uri + '\n')}`;
//     })
//     .join('\n');
//
//   console.log(envStatus);
// };

const docIpfs = () => {
  try {
    const out = child_process.execSync('ipfs config show');
    const addr = JSON.parse(out).Addresses.API.split('/');
    console.log(addr);
  } catch (e) {
    // no ipfs found on local machine
  }
};

module.exports = (root) => {
  const inPackage = !root;

  if (inPackage) {
    console.log(clc.yellow(`WARN: you don't seem to be in a dapple package directory, skipping package tests`));
  } else {
    console.log(`testing packages`);
  }
  // doctorDappleRc();
  docIpfs();
};
