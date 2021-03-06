// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'learn.module', 'flashcardsMgmt.module', 'settings.module', 'starter.services'])

.run(function($ionicPlatform, flashcards) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    //Initializing the configuration
    flashcards.db();
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.learn', {
    url: '/learn',
    views: {
      'tab-learn': {
        templateUrl: 'templates/tab-learn.html',
        controller: 'LearnCtrl'
      }
    }
  })

  .state('tab.flashcards', {
      url: '/flashcards',
      views: {
        'tab-flashcards': {
          templateUrl: 'templates/tab-flashcards.html',
          controller: 'flashcardsCtrl'
        }
      }
    })
    .state('tab.flashcard-detail', {
      url: '/flashcards/:flashcardId',
      views: {
        'tab-flashcards': {
          templateUrl: 'templates/flashcard-detail.html',
          controller: 'flashcardDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'SettingsCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/learn');

});
