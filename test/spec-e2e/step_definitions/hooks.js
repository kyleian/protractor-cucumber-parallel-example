module.exports = function () {

    /** Local Reqs **/
    var util = require('./support/util');
    var tick;
    var tock;


    /** Scenario Timing functions using cucumber before/after hooks **/
    this.BeforeScenario(function () {
        tick = Date.now();
    });

    this.AfterScenario(function (scenario){
        tock = Date.now();
        util.setTime("scenario", scenario.getName(), ((tock - tick) / 1000));
       
    });

    this.BeforeStep(function () {
        tick = Date.now();
    });

    this.AfterStep(function (step) {
        tock = Date.now();
        if(step.getName() != undefined) {
            util.setTime("step", step.getName(), ((tock - tick) / 1000));
        }
    });

    this.AfterFeatures( function() {
        util.sortTimes();
         console.log("\nScenario durations in seconds: ");
         console.log(util.getSortedTimes("scenario"));
         console.log("\nStep durations in seconds: ");
         console.log(util.getSortedTimes("step"));
    });

};
