module.exports = function (){
    
    /** BDD Stuff **/
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
    var expect = chai.expect;
  
    /** Actions Stepdefs **/

    this.Given(/^I visit the webpage "([^"]*)"$/, function (page) {
        browser.ignoreSynchronization = true; //necessary for hitting non angular pages
        browser.get(page);
        
    });

    this.Then(/^I see the "([^"]*)" button$/, function (objectName, callback) {
        var promise = element(by.css('[value="'+objectName +'"]'));
        expect(promise.isDisplayed()).to.eventually.equal(true).and.notify(callback);
    });
    
};
