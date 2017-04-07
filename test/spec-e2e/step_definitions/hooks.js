module.exports = function () {

    // Local Reqs
    var util = require('../support/util'),
        tick, tock, weWantToPrintTimes;

    // Hooks

    this.registerHandler('BeforeFeatures', {timeout: 20 * 1000}, function (event, callback) {

        util.setHookType('feature');

        //Confirm if we want to print Scenario and Step times at the end of Features
        if(eval(process.env.TIMES) === false){ weWantToPrintTimes = false; }
        else { weWantToPrintTimes = true; }

        if(eval(process.env.GENERATE_CERTS) === true) {
            tick = Date.now();
            //var certParams = require('../support/objectParameters').cert;
            util.generateRSAPair('ui', '', function(){ console.log("RSA Pair created. Time taken in seconds: " + ((Date.now() - tick) / 1000)); });
        }
        
        callback();
    });

    this.registerHandler('BeforeScenario', {timeout: 20 * 1000}, function (scenario) {
        util.setHookType('scenario');
        util.setScenarioName(scenario.getName());
        tick = Date.now();
    });

    this.registerHandler('AfterScenario', {timeout: 60 * 1000}, function (scenario, callback){
        //Publish time of scenario to array
        tock = Date.now();
        util.setTime('scenario', scenario.getName(), ((tock - tick) / 1000));
        callback();
    });

    this.registerHandler('BeforeStep', {timeout: 20 * 1000},function () {
        tick = Date.now();
    });

    this.registerHandler('AfterStep', {timeout: 20 * 1000}, function (step) {
        tock = Date.now();
        util.setTime("step", step.getName(), ((tock - tick) / 1000));
    });

    this.registerHandler('AfterFeatures', {timeout: 20 * 1000}, function(event, callback) {
        //Print scenario and feature times
        if(weWantToPrintTimes) { util.printTimes(); }
        callback(); 
    });
};
