angular.module('starter.controllers', [])

.controller('LearnCtrl', function($scope, flashcards) {

	// geting data from the db with a promise. correct way!!!
	flashcards.config().then(function(confDoc){
		console.log(confDoc);
		$scope.categories=confDoc.settings.mainCategory;


		var db = flashcards.db();
	    var currDoc = null;
		db.info().then(function (info) {
			console.log(info);
		});

	    $scope.noCardsToRepeat = 0;

	    $scope.$on("$ionicView.enter", function(event, data){

	   		$scope.showNextToRepeat();
		});
	    //displaying card information
		$scope.showInfo = function(){
			var result = JSON.stringify(currDoc.flashcard.learnData, 2);
			alert(result);
		};
	    // the function to be called from UI, to grade the flashcard
	    $scope.grade = function(grade) {

	    	//TODO: create the info page with learning data in UI
	    	$scope.calcIntervalEF(currDoc.flashcard.learnData, grade);
	    	currDoc.flashcard.learnData.reps.push({rep: new Date().toJSON(), grade: grade});
	    	db.put(currDoc).then(function (doc) {
		    	//displaying the next flashcard
		    	$scope.showNextToRepeat();    		
	    	});

	  	};
	  	//function to display calculated next revision on UI
	  	$scope.grades = {};
	  	$scope.nextRevStr = function(doc){
	  		var learnData = doc.flashcard.learnData;
	  		for (var grade = 0; grade < 8; grade++) {
	  			$scope.calcIntervalEF(doc.flashcard.learnData, grade);
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
			
			if (typeof cardLearnData.reps == 'undefined' || !(cardLearnData.reps instanceof Array)) {
    			cardLearnData.reps = [];
			};
			var repsCnt = cardLearnData.reps.length;
		  	var oldEF = cardLearnData.EF || 2.5,
		      newEF = 0,
		      nextDate = new Date(today);

			 if (grade < 3) {
			    repsCnt = 0;
			    cardLearnData.interval = 0;
			 } else {

		    	newEF = oldEF + (0.1 - (5-grade)*(0.08+(5-grade)*0.02));
		   		if (newEF < 1.3) { // 1.3 is the minimum EF
		      		cardLearnData.EF = 1.3;
		    	} else {
		      		cardLearnData.EF = newEF;
		    	}

		    	repsCnt += 1;

			    switch (repsCnt) {
			      case 1:
			        cardLearnData.interval = 1;
			        break;
			      case 2:
			        cardLearnData.interval = 6;
			        break;
			      default:
			        cardLearnData.interval = Math.ceil((repsCnt - 1) * cardLearnData.EF);
			        break;
			    }
		  	}

		  if (grade === 3) {
		    cardLearnData.interval = 1;
		  }
		  //TODO: here add the repetition history
		  nextDate.setDate(today.getDate() + cardLearnData.interval);
		  cardLearnData.nextDate = nextDate.toJSON();
		}

	  	$scope.showNextToRepeat = function() {
	  		flashcards.nextToLearn($scope.categories).then(function (result) {
	  			//$scope.noCardsToRepeat = result.itemsRemaining;
	  			console.log(result);
	  			currDoc=result.doc;
	  			db.get(result.key).then(function (doc) {
	  				$scope.nextRevStr(doc);
	        		idea = MAPJS.content(doc.flashcard.content);

	        		mapModel.setIdea(idea);
	        		mapModel.scaleDown();
	        		$scope.$apply();
				});
				//calculating how many cards left to learn in category
				$scope.numberCardsToRepeat();

	  		});			
	  	};

	  	$scope.numberCardsToRepeat = function(){
	  		flashcards.numberCardsToRepeat($scope.categories).then(function(result){
	  			$scope.noCardsToRepeat=result;
	  			$scope.$apply();
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
  /*console.log(flashcards.db);
  $scope.flashcards = flashcards.all();
  $scope.remove = function(chat) {
    flashcards.remove(chat);
  };*/
  	
  	$scope.flashcards = [];
  	flashcards.config().then(function(confDoc){
		console.log(confDoc);
		$scope.categories=confDoc.settings.mainCategory;
		
		//retrieving the first page
		flashcards.getByCategories($scope.categories, 0).then(function(result){
			$scope.flashcards=result;
			$scope.$apply();
		})
		//counting the total numer of items
		flashcards.countByCategories($scope.categories).then(function(result){
			$scope.itemsCnt=result;
			$scope.$apply();
		})
	});

  	//retrieving the pages with infinitescroll directive
  	$scope.loadMore = function() {   	
    	flashcards.getByCategories($scope.categories, $scope.flashcards.length).then(function(result){
    		console.log("scrolled " + $scope.flashcards.length);
			var newArr = $scope.flashcards.concat(result);
			$scope.flashcards = newArr;
			$scope.$broadcast('scroll.infiniteScrollComplete');
		})      	
  	};

  	$scope.$on('$stateChangeSuccess', function() {
    	$scope.loadMore();
    });
})

.controller('flashcardDetailCtrl', function($scope, $stateParams, flashcards) {
    var db = flashcards.db();
    var currFlashcard;
  	//$scope.flashcard = flashcards.get($stateParams.flashcardId);
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
              cats.push({desc: value.key[0][0]});
            })
		  	$scope.categories = cats;
		  	$scope.$apply();
		  })

  	};

  	$scope.categories = $scope.getCats();

    db.get($stateParams.flashcardId).then(function (doc) {
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
    	currFlashcard = JSON.parse(JSON.stringify(doc));
    	$scope.flashcard = currFlashcard;
        console.log(doc);
        idea = MAPJS.content(doc.flashcard.content);
        mapModel.setIdea(idea);
        mapModel.scaleDown();
        $scope.$apply();
    });
             //   mapModel.setIdea(idea);
})

.controller('AccountCtrl', function($scope, $ionicPopup, flashcards) {
	//default settings
	$scope.settings = {
		remoteDB: "http://192.168.16.195:5984/flashcards"
	}

	var db = flashcards.db();
	var settingsDoc;
	//Initializing settings from DB
	db.get("settingsDoc").then(function (doc) {
		settingsDoc = doc;
    	$scope.settings = doc.settings;
    	$scope.$apply();
    }).catch(function (err) {
		settingsDoc = {
			_id: "settingsDoc",
			settings: $scope.settings
		}
      	$scope.settingsSave();
	});

	$scope.settingsSave = function() {
		settingsDoc.settings = $scope.settings;
		db.put(settingsDoc).then(function (doc) {
			settingsDoc = doc;
		    console.log("settings saved");  		
	    });
	}

	$scope.reindex = function() {
		flashcards.updateIndex();
	/*	var ddoc = {
		  _id: '_design/byDateAndCat',
		  views: {
		    byDateIndex: {
		      map: function mapFun(doc) {
		        if (doc.flashcard.learnData) {
		          emit(doc.flashcard.learnData.nextDate, doc.flashcard.category);
		        }
		      }.toString()
		    }
		  }
		}

		// save the design doc
		db.put(ddoc).then(function (doc) {
		    console.out("view byDate updated")    		
	    });

	    ddoc = {
	        _id: '_design/categ',
	        views: {
		          "aa": { 
		            map: function (doc) { 
		              if(doc.flashcard.hasOwnProperty("category")){emit([doc.flashcard.category])}; }.toString(), 
		            reduce: "_count"
		          }
	        }
	    };
    

		db.put(ddoc).catch(function (err) {
		  if (err.status !== 409) { // 409 is conflict
		    throw err;
		  }
		}).then(function () {
		  return db.query('categ/aa', {
		    reduce: true,
		    group: true
		  }).then(function (result) {console.log(result);})
		});*/
	}

	$scope.replicateFrom = function() {
    	var remoteDB = new PouchDB($scope.settings.remoteDB); 	
	    db.replicate.from(remoteDB).on('complete', function () {
	    	alert("replication complete");
	    }).on('error', function (err) {
	      alert("replication error");
	    });
  	};

  	$scope.replicateTo = function() {
    	var remoteDB = new PouchDB($scope.settings.remoteDB); 	
	    db.replicate.to(remoteDB).on('complete', function () {
	    	alert("replication complete");
	    }).on('error', function (err) {
	      alert("replication error");
	    });
  	};
  	$scope.clearDatabase = function() {

	   	var confirmPopup = $ionicPopup.confirm({
	     	title: 'Consume Ice Cream',
	     	template: 'Are you sure you want to eat this ice cream?'
	   	});

   		confirmPopup.then(function(res) {
	     	if(res) {
	       		db.destroy().then(function (response) {
			  // success
			}).catch(function (err) {
			  console.log(err);
			});
     		} else {
       			console.log('You are not sure');
     		}
  		});
 	};
		
  	$scope.getCats = function(){ 
  		db.query('categ/aa', {
		    reduce: true,
		    group: true
		  }).then(function (result) {
		  	console.log(result);
		  	var cats = [];
		  	_.each(result.rows, function (value, key){
              cats.push({desc: value.key[0][0]});
            })
		  	$scope.categories = cats;
		  	$scope.$apply();
		  })

  	};
  	$scope.categories = $scope.getCats();
  	
});
