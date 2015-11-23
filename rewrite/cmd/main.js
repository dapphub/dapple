#!/usr/bin/env node
"use strict";
var docopt = require('docopt');
var fs = require('fs');
var Workspace = require("../lib/workspace");
var workspace = new Workspace();

var doc = fs.readFileSync(__dirname+"/docopt.txt").toString();

var cli = docopt.docopt(doc);

if( cli.build ) {
    var Builder = require("../lib/build");
    var builder = new Builder(workspace);
    builder.build();
} else if (cli.init) {
    console.log(process.cwd());
    Workspace.initialize(process.cwd());
}
