Feature: Testing Cucumber Timing Scenarios

  Scenario: Successfully view Google homepage

    Given I visit the webpage "http://www.google.com"
    Then I see the "Google Search" button
    And I see the "I'm Feeling Lucky" button


