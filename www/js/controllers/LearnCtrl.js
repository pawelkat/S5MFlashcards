angular.module('learn.module', [])

.controller('LearnCtrl', function($scope, flashcards, $state) {

	// geting data from the db with a promise. correct way!!!
	flashcards.loadConfig().then(function(confDoc){
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
		$scope.flipFlashcard = function() {
			mapModel.toggleCollapse(null);
	        mapModel.scale("toolbar", 1.0);
		};
		$scope.editFlashcard = function() {
			console.log(currDoc.flashcard)
			$state.go('tab.flashcard-detail', {flashcardId: currDoc._id}, {reload: true, notify:true});
		};
	  	$scope.showNextToRepeat = function() {
	  		$scope.categories=flashcards.config().settings.mainCategory;
	  		flashcards.nextToLearn($scope.categories).then(function (result) {
	  			//$scope.noCardsToRepeat = result.itemsRemaining;
	  			console.log(result);
	  			currDoc=result.doc;
	  			flashcards.getFlashcard(result.key).then(function (doc) {
	  				$scope.nextRevStr(doc);
	        		idea = MAPJS.content(doc.flashcard.content);

	        		mapModel.setIdea(idea);
	        		
	        		mapModel.toggleCollapse(null);
	        		mapModel.scale("toolbar", 1.5);
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