'use strict';

var _ = require('lodash');
var clc = require('cli-color-tty')(true)
var Workspace = require('./workspace');
var schemas = require('./schemas');
var child_process = require('child_process');



const doctorDappleRc = () => {
  var rc = Workspace.getDappleRC();
  // TODO - print missing things
  var result = schemas.dapplerc.validateResult(rc.data);
  console.log(rc);
}

const docIpfs = () => {
  try {
    const out = child_process.execSync('ipfs config show');
    const addr = JSON.parse(out).Addresses.API.split('/');
    console.log(addr);
  } catch (e) {
    // no ipfs found on local machine
  }
}


module.exports = (root) => {

  const inPackage = !root;

  if (inPackage) {
    console.log(clc.yellow(`WARN: you don't seem to be in a dapple package directory, skipping package tests`));
  } else {
    console.log(`testing packages`);
  }

  doctorDappleRc();

  docIpfs();



};
