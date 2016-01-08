'use strict';

var _ = require('lodash');
var child_process = require('child_process');
var fs = require('./file.js');
var path = require('path');

module.exports = class Installer {
    static install(dependencies, logger) {
        if (!logger) logger = console;

        try {
            fs.accessSync('dapple_packages', fs.W_OK);
        } catch (e) {
            try {
                fs.mkdirSync('dapple_packages');
            } catch (e) {
                logger.error(
                    "Could not access or create dapple_packages: " + e);
            }
        }

        if ( Array.isArray(dependencies) ) {
            let newDependencies = {};
            for ( let dependency of dependencies ) {
                newDependencies[path.basename(dependency)] = dependency;
            }
            dependencies = newDependencies;
        }

        for( let pair of _.pairs(dependencies) ) {
            let packageName = pair[0];
            let packagePath = pair[1];
            let installPath = path.join('dapple_packages', packageName);

            if ( /^[a-zA-Z_0-9\-]+\/[a-zA-Z_0-9\-]+$/.test(packagePath) ) {
                packagePath = 'http://github.com/' + packagePath + '.git';
            }

            fs.access(installPath, fs.R_OK, function(err) {
                if (!err) {
                    logger.log(packageName + ' is already installed.');
                    return;
                }
                child_process.execSync(
                    'git clone ' + packagePath + ' ' + installPath
                );
            });
        }
    }
};
