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
    $scope.calculateQuantity = function() {
    	//var date = Date();
    	var dateIso = JSON.parse(JSON.stringify(new Date()));
    	//currDoc.metadata.nextRevDate = "dups";
    	var todo = {
    _id: currDoc._id,
    title: "text",
    completed: false
  };
    	db.put(todo);
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
    db.get('024f3c85-8aa6-4835-99ac-dfcb428c6bb1').then(function (doc) {
    	currDoc = doc;
        console.log(doc);
        idea = MAPJS.content(doc.flashcard.content);
        mapModel.setIdea(idea);
    });

	
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
  $scope.chat = flashcards.get($stateParams.chatId);
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
