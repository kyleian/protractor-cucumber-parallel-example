
var times = { scenario: {}, step: {} };
var each = require('async').each;

var util = module.exports = {
    
    /**Timers **/
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
        var tempArray = [];
        var tempObj = {};
        var tempValue;
        var tempIterator;
        var singleValueInArray;
        
        each(times, function(hookTimes){

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
    }
};
