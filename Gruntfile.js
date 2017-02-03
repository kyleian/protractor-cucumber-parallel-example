
'use strict';

module.exports = function(grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
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
