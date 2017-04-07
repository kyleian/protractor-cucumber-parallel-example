/* Contains utility functions made use of by step definitions,
 including value storage between steps, random string generation,
 and mapping tables from feature files into usable data in step definitions.  */


// Libs
var _ = require('lodash'),
    async = require('async'),
    fs = require('fs'),
    request = require('request'),
    xml2js = require('xml2js');

// Local Reqs
var latestResponseCode, latestBodyMsg, latestErrorState = {},
    latestObjectId, latestObjectName,
    latestCertPath, latestKeyPath, latestXMLToJSONConversion,
    latestElementInDOM,
    _hookType, _scenarioName,
    times = { scenario: {}, step: {} },
    parser = new xml2js.Parser();


var self = module.exports = {

    // More Generically Used Util functions
    throwErrorToProtractor: function(message, callback){
        //This method is used to serve an error to the protractor level,
        // in order to get around the issue of webdriver/console level errors breaking test suite

        try { console.assert(false, message); }
        catch(err){ callback(err); }
    },
    
    confirmPresenceAndVisibility: function(objectName, callback){
        var object;

        object = element(by.xpath("//*[. = '" + objectName + "']"));

        self.confirmPresenceOnDOM(objectName, object, function(err){
            if(err){ callback(err); }
            else {
                self.confirmVisibilityOnDOM(objectName, object, function(err2){
                    if(err2){ callback(err); }
                    else {
                        self.setLatestElementInDOM(object);
                        callback();
                    }});
            }});
    },

    confirmVisibilityOnDOM: function(objectName, objectElement, callback){
        //console.log("Checking if the following value is Displayed on the DOM: " + objectName);

        objectElement.isDisplayed().then(function(isDisplayed) {
            if(!isDisplayed){ self.throwErrorToProtractor("The object " + objectName + " was not displayed in the DOM.", function(err){ callback(err); }); }
            else { callback(); }
        });
    },

    confirmPresenceOnDOM: function(objectName, objectElement, callback){
        //console.log("Checking if the following value is Present on the DOM: " + objectName);

        objectElement.isPresent().then(function(isPresent) {
            if(!isPresent){ self.throwErrorToProtractor("The object " + objectName + " was not present in the DOM.", function(err){ callback(err); }); }
            else { callback(); }
        });
    },

    mappedRow: function (tableRow) {

        return {'locator'  : tableRow[0],
            'dataValue': tableRow[1],
            'dataType' : tableRow[2]};
    },

    generateUniqueName: function(value){
        
        var rightNow = new Date();

        function randomName (objectName){
            return objectName.replace("RANDOM_", "") +
                "_" + _.random(100,999)  +
                "_" + rightNow.toISOString();
        }

        if(typeof value === 'object') {
            //If it's an object, presumably we're in a UI test
            // and need to create a name for the FF table

            value.dataValue = randomName(value.dataValue);
            if (value.locator.includes('Id')) { self.setLatestObjectName(value.dataValue); }
        }
        else { return randomName(value); }
    },

    plurifyObjectName: function(objectName){
        if(objectName.slice(-1) === 'y') { return objectName.replace(/.$/,'ies'); }
        else { return objectName + 's'; }
    },

    generateRSAPair: function(requestType, data, callback){
        //Before you ask me how this works, don't bother, I don't really understand cryptology, I just copied some shit off the internet.

        console.log("Generating RSA pair for " + requestType + " request.");

        //Utils
        var keyUtil = require('jsrsasign').KEYUTIL;
        var KJUR = require('jsrsasign').KJUR;

        //Keypair
        var keypair = keyUtil.generateKeypair("RSA",2056);
        var prvKey = keypair.prvKeyObj;
        var pubKey = keypair.pubKeyObj;

        //Spin up To be Signed Cert
        var tbsc = new KJUR.asn1.x509.TBSCertificate();
        tbsc.setSerialNumberByParam({'int': 4});
        tbsc.setSignatureAlgByParam({'name': 'SHA256withRSA'});
        tbsc.setIssuerByParam({'str': '/C=US/O=a'});
        tbsc.setNotBeforeByParam({'str': '130504235959Z'});
        tbsc.setNotAfterByParam({'str': '140504235959Z'});
        tbsc.setSubjectByParam({'str': '/C=US/O=a'}); // shall be same
        tbsc.setSubjectPublicKeyByParam({'rsakey': pubKey});
        tbsc.appendExtension(
            new KJUR.asn1.x509.BasicConstraints({'cA':true}));
        tbsc.appendExtension(
            new KJUR.asn1.x509.KeyUsage({'bin':'11'}));

        // Sign cert
        var crt = new KJUR.asn1.x509.Certificate({'tbscertobj': tbsc, 'rsaprvkey': prvKey});
        crt.sign();

        // Store the Cert and Key
        var public_cert = crt.getPEMString();
        var private_key = keyUtil.getPEM(prvKey, 'PKCS1PRV');

        // Need to trim the stupid extra line out of the Cert
        public_cert = public_cert.replace(/(\r\n\r\n)/gm,"\r\n");

        //How we're assigning the cert/key value to the test runner.
        if(requestType ==='api') {
            data.public_cert = public_cert;
            data.private_key = private_key;
            callback();
        }
        else if (requestType ==='ui'){
            //Spin up some Files to the support folder to load via the UI
            self.createRSAFiles(public_cert, private_key, callback);
        }
    },

    createRSAFiles: function(public_cert, private_key, callback){
        // Get current time to distinguish local file.
        console.log("Beginning to store RSA files to local folder");

        var rightNow = new Date();
        rightNow = rightNow.toISOString();

        // Storing these this way in order to later delete them with fs.
        self.setLatestCertPath("./test/spec-e2e/support/AUTOGENERATED_PUBLIC_CERT_FILE_" + rightNow + ".pem");
        self.setLatestKeyPath("./test/spec-e2e/support/AUTOGENERATED_PRIVATE_KEY_FILE_" + rightNow + ".key");

        //Write Files
        fs.writeFile(self.getLatestCertPath(), public_cert, function (err) {
            if (err){return console.log(err);}

            fs.exists(self.getLatestCertPath(), function(exists){
                if (exists === false){return console.log(err);}
                console.log("Wrote public_cert successfully.");

                //Only bother writing this one if you have written the first
                fs.writeFile(self.getLatestKeyPath(), private_key, function (err) {
                    if (err){return console.log(err);}

                    fs.exists(self.getLatestCertPath(), function(err) {
                        if (err == false) {return console.log(err);}
                        console.log("Wrote private_key successfully.");
                        callback();
                    });
                });
            });
        });
    },

    deleteRSAFiles: function(callback){
        fs.unlink(self.getLatestCertPath(), function (err) {
            if (err) {return console.log(err);}
            console.log("Deleted public_cert "+ self.getLatestCertPath()+" successfully.");
            self.setLatestCertPath(undefined);

            ///Only bother deleting this one if you have deleted the first
            fs.unlink(self.getLatestKeyPath(), function (err) {
                if (err){return console.log(err);}
                console.log("Deleted private_key "+ self.getLatestKeyPath() +" successfully.")
                self.setLatestKeyPath(undefined);
                callback();
            });
        });
    },

    convertXMLtoJSON: function(typeOfRequest, xml, callback){
        if(typeOfRequest === 'file'){
            fs.readFile(xml, function(err, fileData) { xml = fileData; });
        }

        parser.parseString(xml, function (err, result) {
            //console.log("Converted XML: " + JSON.stringify(result));
            self.setLatestXMLtoJSONconversion(result);
            callback(err, result);
        });
    },


    // Scenario and Step Hook Timers

    setTime: function (hookType, hookName, elapsedTime) {

        if (times[hookType][hookName]) {
            if(!Array.isArray(times[hookType][hookName])){
                var tempValue = times[hookType][hookName];
                times[hookType][hookName] = [];
                times[hookType][hookName].push(tempValue);
            }
            times[hookType][hookName].push(elapsedTime);
        }
        else {
            times[hookType][hookName] = elapsedTime; //doing this to assert that the value is in an array
        }
    },

    getSortedTimes: function (hookType){
        return times[hookType];
    },

    sortTimes: function(){
        var tempValue, tempIterator, singleValueInArray,
            tempArray = [],
            tempObj = {};

        async.each(times, function(hookTimes){

            for(var hookName in hookTimes){
                tempArray.push(hookName);
            }

            tempArray.sort( function(previousListItem,currentListItem) {

                var previousListValue = hookTimes[previousListItem];
                var currentListValue = hookTimes[currentListItem];

                //If these values are arrays, take the average of the values
                if(Array.isArray(previousListValue)){
                    tempValue = 0;
                    tempIterator = 0;
                    for(singleValueInArray in previousListValue){
                        tempValue += parseFloat(previousListValue[singleValueInArray]);
                        tempIterator++;
                    }
                    previousListValue = tempValue / tempIterator;
                    //console.log("Average value of " + previousListItem + ": " + previousListValue);
                }
                if(Array.isArray(currentListValue)){
                    tempValue = 0;
                    tempIterator = 0;
                    for(singleValueInArray in currentListValue){
                        tempValue += parseFloat(currentListValue[singleValueInArray]);
                        tempIterator++;
                    }
                    currentListValue = tempValue / tempIterator;
                    //console.log("Average value of " + currentListItem + ": " + currentListValue);
                }

                return ((previousListValue < currentListValue) ? -1 : ((previousListValue > currentListValue) ? 1 : 0));
            });

            for (var i=0; i<tempArray.length; i++) {
                tempObj[tempArray[i]] = hookTimes[tempArray[i]];
            }
            hookTimes = tempObj;

        });
    },

    printTimes: function(){
        self.sortTimes();
        console.log("\nScenario durations in seconds: ");
        console.log(self.getSortedTimes("scenario"));
        console.log("\nStep durations in seconds: ");
        console.log(self.getSortedTimes("step"));
    },


    //Gets and Sets for REST Responses and Local Storage of Mocks IDs

    setLatestResponseCode: function(resp){
        latestResponseCode = resp;
    },

    getLatestResponseCode: function(){
        return latestResponseCode;
    },

    setLatestBodyMsg: function(resp){
        latestBodyMsg = resp;
    },

    getLatestBodyMsg: function(){
        return latestBodyMsg;
    },

    setLatestErrorState: function(err){
        latestErrorState.code = err.code;
        latestErrorState.error = err.error;
    },

    getLatestErrorState: function(){
        return latestErrorState;
    },

    setLatestObjectName: function(resp){
        latestObjectName = resp;
    },

    getLatestObjectName: function(){
        return latestObjectName;
    },

    setLatestObjectId: function(resp){
        latestObjectId = resp;
    },

    getLatestObjectId: function(){
        return latestObjectId;
    },

    setLatestCertPath: function(resp){
        latestCertPath = resp;
    },

    getLatestCertPath: function(){
        return latestCertPath;
    },

    setLatestKeyPath: function(resp){
        latestKeyPath = resp;
    },

    getLatestKeyPath: function(){
        return latestKeyPath;
    },

    setLatestXMLtoJSONconversion: function(resp){
        latestXMLToJSONConversion = resp;
    },

    getLatestXMLtoJSONconversion: function(){
        return latestXMLToJSONConversion;
    },

    setLatestElementInDOM: function(resp){
        latestElementInDOM = resp;
    },

    getLatestElementInDOM: function(){
        return latestElementInDOM;
    },

    setHookType: function(hookType){
        _hookType = hookType;
    },

    getHookType: function(){
        return _hookType;
    },

    setScenarioName: function(scenarioName){
        _scenarioName = scenarioName;
    },

    getScenarioName: function(){
        return _scenarioName;
    },

};
