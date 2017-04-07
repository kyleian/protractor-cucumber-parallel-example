
'use strict';

module.exports = function(grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),


        exec: {
            'webdriver-update': {
                command: './node_modules/protractor/node_modules/webdriver-manager/bin/webdriver-manager update'
            },
            'webdriver-nohup': {
                command: './node_modules/protractor/node_modules/webdriver-manager/bin/webdriver-manager start &'
            },
            webdriver: {
                command: './node_modules/protractor/node_modules/webdriver-manager/bin/webdriver-manager start'
            }
        },
        protractor: {
            options: {
                configFile: "./test/config/protractor.conf.js", // Default config file
                // keepAlive: true, // If false, the grunt process stops when the test fails.
                noColor: false, // If true, protractor will not use colors in its output.
                // debug: true,
                args: {

                }
            },
            continuous: {
                options: {
                    keepAlive: true
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-protractor-runner');
    
};
