Feature: Testing Cucumber Timing Scenarios

  Scenario: Successfully view Google homepage

    Given I navigate to the page "http://www.google.com"
    Then I see the "Google Search" button
    And I see the "I'm Feeling Lucky" button


