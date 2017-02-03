# protractor-cucumber-parallel-example

I mostly whipped this up in order to determine which of my steps/scenarios
was causing me the most performance issues during my test suite.
This work is captured in `hooks.js` and `util.js`.

## Deployment info

The project requires node and npm. The grunt task runner the project uses is installed by npm.

Install the dependencies with
```shell
npm install
```

From main protract directory, run with:
```shell
grunt protractor
```

## Output

You will see the following output, one for each feature.
Note that the `maxInstances` option in the `/test/config/protractor.conf.js` is what drives 
the multiple browsers spawned by selenium hub.

```
[chrome #01-0] [13:44:45] I/hosted - Using the selenium server at http://localhost:4444/wd/hub
[chrome #01-0] Feature: Testing Cucumber Timing Scenarios
[chrome #01-0] 
[chrome #01-0]   Scenario: Successfully view Google homepage
[chrome #01-0]   ✔ Given I visit the webpage "http://www.google.com"
[chrome #01-0]   ✔ Then I see the "Google Search" button
[chrome #01-0]   ✔ And I see the "I'm Feeling Lucky" button
[chrome #01-0] 
[chrome #01-0] 1 scenario (1 passed)
[chrome #01-0] 3 steps (3 passed)
[chrome #01-0] 0m03.926s
[chrome #01-0] 
[chrome #01-0] Scenario durations in seconds: 
[chrome #01-0] { 'Successfully view Google homepage': 0.05 }
[chrome #01-0] 
[chrome #01-0] Step durations in seconds: 
[chrome #01-0] { 'I visit the webpage "http://www.google.com"': 0.005,
[chrome #01-0]   'I see the "Google Search" button': 3.876,
[chrome #01-0]   'I see the "I\'m Feeling Lucky" button': 0.049 }
```