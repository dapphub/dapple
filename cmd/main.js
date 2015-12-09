#!/usr/bin/env node
"use strict";

// This is the file that gets executed when you run `dapple`. It uses `docopt`
// to parse the arguments passed in.

var docopt = require('docopt');
var fs = require('fs');
var Workspace = require("../lib/workspace");

var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();

var cli = docopt.docopt(doc);

// If the user set the `--build` flag, we're going to open the current directory
// as if it were a package, look for a `dappfile`, and commence with building.

if( cli.build ) {
    var workspace = new Workspace();
    var Builder = require("../lib/build");
    var builder = new Builder(workspace);
    builder.build();


// If they set the `--init` flag, we just set up the current directory as a
// Dapple package and exit.

} else if (cli.init) {
    console.log(process.cwd());
    Workspace.initialize(process.cwd());
}
