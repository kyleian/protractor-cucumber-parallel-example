exports.config = {

    framework: 'custom',
    // path relative to the current config file
    frameworkPath: require.resolve('protractor-cucumber-framework'),

    noColor: false,
    
    seleniumAddress: 'http://localhost:4444/wd/hub',

   //specs = feature files
    specs: ['../spec-e2e/features/*.feature'],

    getPageTimeout: 60000,
    allScriptsTimeout: 500000,

    capabilities: {
        browserName: 'chrome',
        shardTestFiles: true,
        maxInstances: 2
    },

    cucumberOpts: {
        require: '../spec-e2e/step_definitions/*.js',
        tags: false,
        format: 'pretty',
        profile: false,
        'no-source': true
    }
}


