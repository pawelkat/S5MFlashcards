angular.module('starter.controllers', [])

.controller('LearnCtrl', function($scope) {
	//todoDb.get('mittens').then(function (doc) {
	//  console.log(doc);
	//});

	var db = new PouchDB('flashcards');
    var remoteDB = new PouchDB('http://192.168.16.195:5984/flashcards')
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

    $scope.$on("$ionicView.enter", function(event, data){

   			$scope.showNextToRepeat();
	});

    // the function to be called from UI, to grade the flashcard
    $scope.grade = function(grade) {

    	//TODO: create the info page with learning data in UI
    	$scope.calcIntervalEF(currDoc.flashcard.learnData, grade);
    	db.put(currDoc).then(function (doc) {
	    	//displaying the next flashcard
	    	$scope.showNextToRepeat();    		
    	});

  	};
  	//function to display calculated next revision on UI
  	$scope.grades = {};
  	$scope.nextRevStr = function(){
  		var learnData = currDoc.flashcard.learnData;
  		for (var grade = 0; grade < 8; grade++) {
  			$scope.calcIntervalEF(currDoc.flashcard.learnData, grade);
  			$scope.grades[grade]=learnData.interval;
  		}
  		$scope.$apply();
  	};

	// Briefly the algorithm works like this:
	// EF (easiness factor) is a rating for how difficult the card is.
	// Grade: (0-2) Set reps and interval to 0, keep current EF (repeat card today)
	//        (3)   Set interval to 0, lower the EF, reps + 1 (repeat card today)
	//        (4-5) Reps + 1, interval is calculated using EF, increasing in time.
	$scope.calcIntervalEF = function (cardLearnData, grade) {
		var today = new Date();
	  	var oldEF = cardLearnData.EF || 2.5,
	      newEF = 0,
	      nextDate = new Date(today);

	  if (grade < 3) {
	    cardLearnData.reps = 0;
	    cardLearnData.interval = 0;
	  } else {

	    newEF = oldEF + (0.1 - (5-grade)*(0.08+(5-grade)*0.02));
	    if (newEF < 1.3) { // 1.3 is the minimum EF
	      cardLearnData.EF = 1.3;
	    } else {
	      cardLearnData.EF = newEF;
	    }

	    cardLearnData.reps = cardLearnData.reps + 1;

	    switch (cardLearnData.reps) {
	      case 1:
	        cardLearnData.interval = 1;
	        break;
	      case 2:
	        cardLearnData.interval = 6;
	        break;
	      default:
	        cardLearnData.interval = Math.ceil((cardLearnData.reps - 1) * cardLearnData.EF);
	        break;
	    }
	  }

	  if (grade === 3) {
	    cardLearnData.interval = 1;
	  }
	  nextDate.setDate(today.getDate() + cardLearnData.interval);
	  cardLearnData.nextDate = nextDate.toJSON();
	}

  	$scope.showNextToRepeat = function() {
  		var currKey = null;
		db.query('byDate/byDateIndex', {
		    endkey: new Date().toJSON(),
		    include_docs: true
		  }).then(function (result) {
		  	console.log(result);

		  	if (result.rows.length > 0 ) {
			  	currKey = result.rows[0].id;
			  	currDoc = result.rows[0].doc;
			  	$scope.noCardsToRepeat = result.rows.length;
		  		$scope.nextRevStr();
		  		$scope.$apply();
			  	//taking the document from db, to have a copy (the copy will be used to create idea)
			  	db.get(currKey).then(function (doc) {
		        	idea = MAPJS.content(doc.flashcard.content);

		        	mapModel.setIdea(idea);
		        	mapModel.scaleDown();

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

.controller('flashcardDetailCtrl', function($scope, $stateParams, flashcards) {
    var db = new PouchDB('flashcards');
    var currFlashcard;
  	$scope.flashcard = flashcards.get($stateParams.flashcardId);
  	//commit function. Adding the next revision as a current Date()
   	$scope.commit = function() {
   		currFlashcard.flashcard.learnData={nextDate : new Date().toJSON()};
    	db.put(currFlashcard);
  	};

  	$scope.getCats = function(){ 
  		db.query('categ/aa', {
		    reduce: true,
		    group: true
		  }).then(function (result) {
		  	console.log(result);
		  	var cats = [];
		  	_.each(result.rows, function (value, key){
              cats.push({desc: value.key[0]});
            })
		  	$scope.categories = cats;
		  	$scope.$apply();
		  })

  	};

  	$scope.categories = $scope.getCats();
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
    db.get($scope.flashcard.id).then(function (doc) {
    	currFlashcard = JSON.parse(JSON.stringify(doc));
        console.log(doc);
        idea = MAPJS.content(doc.flashcard.content);
        mapModel.setIdea(idea);
        mapModel.scaleDown();
    });
             //   mapModel.setIdea(idea);
})

.controller('AccountCtrl', function($scope) {
	var db = new PouchDB('flashcards');
	var ddoc = {
	  _id: '_design/byDate',
	  views: {
	    byDateIndex: {
	      map: function mapFun(doc) {
	        if (doc.flashcard.learnData) {
	          emit(doc.flashcard.learnData.nextDate);
	        }
	      }.toString()
	    }
	  }
	}

	// save the design doc
	db.put(ddoc).then(function (doc) {
	    	//displaying the next flashcard
	    	alert("view updated")    		
    	});
	$scope.settings = {
	    enableFriends: true
	};
});
