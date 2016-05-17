angular.module('starter.controllers', [])

.controller('LearnCtrl', function($scope) {
	//todoDb.get('mittens').then(function (doc) {
	//  console.log(doc);
	//});
	var db = new PouchDB('flashcards');
    var remoteDB = new PouchDB('http://192.168.0.13:5984/flashcards')
  //  $scope.chat = flashcards.nextToLearn();
  	var currDoc = null;
	db.info().then(function (info) {
		console.log(info);
	});
    db.replicate.from(remoteDB).on('complete', function () {
    }).on('error', function (err) {
     // alert("replication error");
    });

    $scope.noCardsToRepeat = 0;

    // the function to be called from UI, to grade the flashcard
    $scope.grade = function(grade) {
    	var currDate = new Date();
    	//TODO: implement according to the algorithm here, display the next repetition day in UI, then push the calculated grade here,
    	//TODO: push all the repetiotion grades to the array
    	//TODO: create the info page with learning data in UI
    	currDate.setMinutes(currDate.getMinutes() + grade);
    	currDoc.flashcard.learnData={nextRev : currDate.toJSON(), prevRev : new Date().toJSON()};
    	db.put(currDoc).then(function (doc) {
	    	//displaying the next flashcard
	    	$scope.showNextToRepeat();    		
    	});

  	};

  	$scope.showNextToRepeat = function() {
  		var currKey = null;
		db.query('byDate/byDateIndex', {
		    endkey: new Date().toJSON(),
		    include_docs: true
		  }).then(function (result) {
		  	console.log(result);
		  	$scope.noCardsToRepeat = result.rows.length;
		  	$scope.$apply();
		  	if (result.rows.length > 0 ) {
			  	currKey = result.rows[0].id;
			  	currDoc = result.rows[0].doc;
			  	//taking the document from db, to have a copy (the copy will be used to create idea)
			  	db.get(currKey).then(function (doc) {

		        	idea = MAPJS.content(doc.flashcard.content);
		        	mapModel.setIdea(idea);
		      	});
			}
		}).catch(function (err) {
		  console.log(err);
		});
		
  	};

	window.onerror = alert;
	var container = jQuery('#container'),
	idea = MAPJS.content(test_tree()),
	imageInsertController = new MAPJS.ImageInsertController("http://localhost:4999?u="),
	mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);
	container.domMapWidget(console, mapModel, false, imageInsertController);
	jQuery('body').mapToolbarWidget(mapModel);
	//jQuery('body').attachmentEditorWidget(mapModel);
	$("[data-mm-action='export-image']").click(function () {
		MAPJS.pngExport(idea).then(function (url) {
			window.open(url, '_blank');
		});
	});

	$scope.showNextToRepeat();

	
	jQuery('#linkEditWidget').linkEditWidget(mapModel);
	window.mapModel = mapModel;
	jQuery('.arrow').click(function () {
		jQuery(this).toggleClass('active');
	});
	imageInsertController.addEventListener('imageInsertError', function (reason) {
		console.log('image insert error', reason);
	});
	
	
})

.controller('flashcardsCtrl', function($scope, flashcards) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.flashcards = flashcards.all();
  $scope.remove = function(chat) {
    flashcards.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, flashcards) {
    var db = new PouchDB('flashcards');
    var currFlashcard;
  	$scope.chat = flashcards.get($stateParams.chatId);
  	//commit function. Adding the next revision as a current Date()
   	$scope.commit = function() {
   		currFlashcard.flashcard.learnData={nextRev : new Date().toJSON()};
    	db.put(currFlashcard);
  	};
    var container = jQuery('#container2'),
				idea = MAPJS.content(test_tree()),
				imageInsertController = new MAPJS.ImageInsertController("http://localhost:4999?u="),
				mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);
				container.domMapWidget(console, mapModel, false, imageInsertController);
				jQuery('body').mapToolbarWidget(mapModel);
				//jQuery('body').attachmentEditorWidget(mapModel);
				$("[data-mm-action='export-image']").click(function () {
					MAPJS.pngExport(idea).then(function (url) {
						window.open(url, '_blank');
					});
				});
               
				jQuery('#linkEditWidget').linkEditWidget(mapModel);
				window.mapModel = mapModel;
				jQuery('.arrow').click(function () {
					jQuery(this).toggleClass('active');
				});
				imageInsertController.addEventListener('imageInsertError', function (reason) {
					console.log('image insert error', reason);
				});
                db.get($scope.chat.id).then(function (doc) {
                	currFlashcard = JSON.parse(JSON.stringify(doc));
                    console.log(doc);
                    idea = MAPJS.content(doc.flashcard.content);
                    mapModel.setIdea(idea);
                });
             //   mapModel.setIdea(idea);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
