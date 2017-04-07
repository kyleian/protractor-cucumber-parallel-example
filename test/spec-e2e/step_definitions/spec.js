module.exports = function (){
    
    // Libs
    var _ = require('lodash'),
        async = require('async'),
        chai = require('chai'),
        chaiAsPromised = require('chai-as-promised'),
        expect = chai.expect;
    chai.use(chaiAsPromised);

    // Local Reqs 
    var util = require('../support/util');

    // Generic API Functions

    this.Given(/^I kill the test run$/, function(){
        console.assert(false, "Killing the test suite intentionally.");
    });

    this.Given(/^I kill the scenario$/, function(callback){
        util.throwErrorToProtractor("Killing the scenario intentionally.", function(err){ callback(err); });
    });

    this.Given(/^I generate a new RSA Cert and Key Pair$/, { timeout: 30 * 1000}, function(callback){
        //Second value is only required for API calls.
        util.generateRSAPair('ui', '', function() {
            console.log("RSA Pair created.");
            callback();
        });
    });
    
    this.Given(/^I translate the XML File "([^"].*)" to JSON$/, function(filePath, callback){
        util.convertXMLtoJSON('file', filePath, callback);
    });

    this.Given(/^the response (code|message) from the request is "([^"].*)"$/, function(responseType, expectedResponseValue, callback){
        var actualResponseValue;

        if (responseType ==='code') { actualResponseValue = util.getLatestResponseCode(); expectedResponseValue = parseInt(expectedResponseValue); }
        else { actualResponseValue = util.getLatestBodyMsg(); }

        console.assert(expectedResponseValue === actualResponseValue, "Unexpected response " + responseType + ": " + actualResponseValue);
        callback();
    });

    this.Given(/^I wait for (\d+) (seconds|minutes)$/,{ timeout: 1200 * 1000 }, function (quantity, durationType, callback){
        //Hard cap of 20 minutes
        quantity = parseInt(quantity);
        if(durationType === 'minutes' && quantity >=20){ util.throwErrorToProtractor("Lol no.", function(err){ callback(err); }) }
        else {
            var byThisLong = 1000 * quantity;
            if (durationType ==='minutes'){ byThisLong *= 60; }
            _.delay(callback, byThisLong)
        }
    });

    
    // UI related Functions

    this.Then(/^I see the "([^"]*)" button$/, function (objectName, callback) {
        var promise = element(by.css('[value="'+objectName +'"]'));
        expect(promise.isDisplayed()).to.eventually.equal(true).and.notify(callback);
    });

    this.Given(/^I navigate to the (?:(angular ))?page "([^"]*)"$/, {timeout: 15 * 10000}, function (angularPage, url, callback) {

        if(angularPage == undefined) { browser.ignoreSynchronization = true; }

        browser.get(url);

        if(angularPage != undefined) { browser.waitForAngular().then(callback); }
        else { callback(); }
    });
    
    this.Then(/^(?:I am on the "([^"]*)" page|I see the header "([^"]*)")$/,{timeout: 60 * 1000}, function (pageName,headerValue, callback) {

        // Examples: should be one in the same, though specific syntax may throw off the expected text.
        // I am on the "Home" page
        // I see the header "Enter your LDAP credentials below."

        browser.waitForAngular();

        var actualHeaderText, expectedHeaderText, cssIdentifier;

        if(pageName != undefined) { expectedHeaderText = pageName; }
        else { expectedHeaderText = headerValue; }

        cssIdentifier = pageAttributes.page[expectedHeaderText];

        if(cssIdentifier.includes('.')){
            //TODO Standardize unique headers for pageAttributes.page[expectedHeaderText]

            cssIdentifier = cssIdentifier.replace('.','');
            cssIdentifier = by.tagName(cssIdentifier);
        }
        else { cssIdentifier = by.css(cssIdentifier); }

        actualHeaderText = element(cssIdentifier).getText();
        expect(actualHeaderText).to.eventually.equal(expectedHeaderText).and.notify(callback);
    });

    this.Then(/^I see a popup with the (?:error|message) "(.*)"$/, function (expectedMessage, callback) {
        var actualMessage,actualMessageDisplayed;
        
        actualMessageDisplayed = browser.switchTo().alert();
        actualMessage = actualMessageDisplayed.getText();
        actualMessageDisplayed.accept();
        
        expect(actualMessage).to.eventually.equal(expectedMessage).and.notify(callback);
    });

    this.Given(/^I (?:enter|select|upload|change|update) the following data:$/,{timeout: 30 * 1000}, function (table, callback) {

        var rawData = table.raw();
        var qtyOfExpectedItems = rawData.length;
        var qtyOfEnteredItems = 0;

        async.eachSeries(rawData,
            function (tableRow, entryCallback){
                
                function confirmItemWasEntered () { qtyOfEnteredItems++; entryCallback();}
                tableRow = util.mappedRow(tableRow);
                // console.log(tableRow);

                if(tableRow.dataType === 'text') {

                    //Get element locator for value to be typed into input field
                    var inputField = element(by.css(tableRow.locator));

                    // Check if we need to get Login credentials or create a new object name.
                    if(tableRow.locator.includes('credentials')) { util.getLoginDetails(tableRow); }
                    else if(tableRow.dataValue.includes('RANDOM')) { util.generateUniqueName(tableRow); }

                    //Type the value, then check to make sure it's there.
                    inputField.clear().sendKeys(tableRow.dataValue)
                        .then(function(){
                            inputField.getAttribute('value')
                                .then(function(actualTextValue) {
                                    if(actualTextValue === tableRow.dataValue) { confirmItemWasEntered(); }
                                })
                        });
                }
                else if(tableRow.dataType.includes('select') ){
                    //DataType can be select or select_multiple.
                    //FYI - This is probably the 'messiest' of the data entry cases

                    var valueToSelect, isSelected;
                    function select (valueToSelect) { return valueToSelect.click() };
                    function ensureValue (isSelected){ expect(that.elementToBeSelected(isSelected)) };
                    function confirmValueIsPresent (val) {
                        if (val === '' || val == undefined) {
                            qtyOfEnteredItems++;
                            entryCallback();
                        }
                        else { return true; }
                    };

                    // If we're selecting newly created object from API setup, go get them from util local storage
                    if(tableRow.dataValue.includes('NEWLY_CREATED')) { util.getStoredObjectNameByKey('secondaryKey', tableRow); }

                    if (confirmValueIsPresent(tableRow.dataValue)){
                        // Ensure we're working with a list array of values in order for the async.each look for each list item.
                        if (!Array.isArray(tableRow.dataValue)) {
                            if (tableRow.dataType === 'select_multiple' && tableRow.dataValue.includes(",")) { tableRow.dataValue = tableRow.dataValue.split(','); }
                            tableRow.dataValue = [tableRow.dataValue];
                        }

                        //Perform selection of each of the data values
                        async.each(tableRow.dataValue, function(selectValue, confirmItemWasEnteredAndCallback){
                            if (confirmValueIsPresent(selectValue)) {
                                //Get element locator for the select value by Locator[Options[DataValue]
                                //Click the element locator and ensure it's selected
                                valueToSelect = isSelected = element(by.css(tableRow.locator)).element(by.cssContainingText('option', selectValue));

                                util.confirmPresenceOnDOM(selectValue, valueToSelect, function(err){
                                    if(err) { return callback(err); }
                                    else { select(valueToSelect).then(ensureValue(isSelected)).then(confirmItemWasEnteredAndCallback) }
                                });
                            }
                        }, confirmItemWasEntered);
                    }
                }
                else if(tableRow.dataType ==='checkbox'){
                    var checkbox = element(by.css(tableRow.locator));
                    if (tableRow.dataValue ==='checked') { checkbox.click(); }

                    checkbox.getAttribute('class')
                        .then(function (classValue){
                            try {
                                if (tableRow.dataValue === 'checked') {
                                    console.assert(classValue.includes('ng-valid-parse'), "This box was found unchecked when it was expected to be checked: " + tableRow.locator);
                                } else {
                                    console.assert(!classValue.includes('ng-valid-parse'), "This box was found checked when it was expected to be unchecked: " + tableRow.locator);
                                }
                                confirmItemWasEntered();
                            }
                            catch(err){ callback(err) }

                        });

                }
                else if (tableRow.dataType ==='upload'){
                    var fileToUpload;
                    function trimSupportDir (path) { return path.replace('./test/spec-e2e/support/', ''); }

                    // Generate an RSA pair if we need to
                    if(tableRow.dataValue.includes('AUTOGENERATED') && util.getLatestCertPath() == undefined && util.getLatestKeyPath() == undefined){
                        util.generateRSAPair('ui' ,'', function(){ console.log("RSA Pair created."); } );
                    }

                    // Realistically this should only be certs
                    if(tableRow.dataValue === 'AUTOGENERATED_CERT') { fileToUpload = trimSupportDir(util.getLatestCertPath()) }
                    else if(tableRow.dataValue === 'AUTOGENERATED_KEY') { fileToUpload = trimSupportDir(util.getLatestKeyPath()) }
                    else { fileToUpload = tableRow.dataValue; }

                    // Upload by relative path to support folder.
                    var uploadField = element(by.css('input' + tableRow.locator));
                    var absolutePath = path.resolve(__dirname, '../support/' + fileToUpload);
                    uploadField.sendKeys(absolutePath).then(confirmItemWasEntered);
                }
                else{
                    console.assert(false, "Data type not allowed for mapping: " + tableRow.dataType);
                    entryCallback();
                }

            },
            function (err) {
                if (err) {
                    console.log("Error entering data from FF: " + err);
                    callback(err);
                } else {
                    //Check whether we actually sent everything before returning to stepdef.
                    if (qtyOfEnteredItems == qtyOfExpectedItems) {
                        console.log("Sent all data from FF table.");
                        browser.waitForAngular().then(function () { callback() });
                    }
                    else {
                        //Explicitly serve up error to stepdef
                        try { console.assert(false, "Did not successfully enter all items. Expected:" + qtyOfExpectedItems + "; Entered:" + qtyOfEnteredItems);}
                        catch (err) { callback(err); }
                    }
                }
            });

    });


};
