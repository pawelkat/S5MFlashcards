angular.module('flashcardsMgmt.module', [])
.controller('flashcardsCtrl', function($scope, flashcards, $state) {
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
  	$scope.filterStr = '';
    $scope.$on("$ionicView.enter", function(event, data){
    	var newCategories = flashcards.config().settings.mainCategory;
   		if( newCategories !== $scope.categories){
   			$scope.categories = newCategories;
   			//cleaning and refreshing the view
   			$scope.flashcards = [];
   			$scope.retrieveFlashcards();
   		}
	});

    //this is loaded once the view is opened
  	flashcards.loadConfig().then(function(confDoc){
		console.log(confDoc);
		$scope.categories=flashcards.config().settings.mainCategory;
		$scope.retrieveFlashcards();
	});

	$scope.retrieveFlashcards = function(){
		//retrieving the first page
		flashcards.getByCategories($scope.categories, 0, $scope.filterStr.toLowerCase()).then(function(result){
			$scope.flashcards=result;
			$scope.$apply();
		})
		//counting the total numer of items
		flashcards.countByCategories($scope.categories).then(function(result){
			$scope.itemsCnt=result;
			$scope.$apply();
		})
	};
  	$scope.addFlashcard = function(){
  		flashcards.addFlashcard($scope.categories).then(function(response){
  			console.log(response);
  			//$location.path('/tab/flashcards/'+ response.id);
  			$state.go('tab.flashcard-detail', {flashcardId: response.id});
  		})
  	};

  	$scope.deleteFlashcard = function(flashcard){
  		flashcards.deleteFlashcard(flashcard.id).then(function(response){
  			console.log(response);
  			if(response.ok==true){
  				$scope.flashcards.splice($scope.flashcards.indexOf(flashcard), 1);
  				$scope.itemsCnt+=-1;
  				$scope.$apply();
  			}
  		}) 		
  	}

  	$scope.filterFlashcards = function(filterStr){
  		$scope.flashcards = [];
   		$scope.retrieveFlashcards();
  	};

  	$scope.clearFilter = function(){
  		$scope.flashcards = [];
  		$scope.filterStr = '';
  		$scope.retrieveFlashcards();
  	}
  	//retrieving the pages with infinitescroll directive
  	$scope.loadMore = function() {   	
    	flashcards.getByCategories($scope.categories, $scope.flashcards.length, $scope.filterStr.toLowerCase()).then(function(result){
    		console.log("scrolled " + $scope.flashcards.length);
			var newArr = $scope.flashcards.concat(result);
			$scope.flashcards = newArr;
			$scope.$broadcast('scroll.infiniteScrollComplete');
		})      	
  	};

  	$scope.$on('$stateChangeSuccess', function() {
    	$scope.loadMore();
    });

    $scope.commit = function(item) {
    	console.log("commiting");
    	console.log(item);
    	flashcards.commitFlashcard(item.id).then(function(result){
    		//updating directly, be carefull, the result could be differend as 
    		item.commited=result.hasOwnProperty("nextDate");
    		$scope.$apply();	
    	})
    };
})

.controller('flashcardDetailCtrl', function($scope, $stateParams,  $ionicLoading, flashcards) {
    var currFlashcard;

    $scope.flashcard ={};

   	$scope.commit = function() {
   		flashcards.commitFlashcard($scope.flashcard._id).then(function(result){
    		//updating directly, be carefull, the result could be differend as 
    		$scope.flashcard.learnData = result;
    		$scope.$apply();	
    	})
  	};
  	$scope.isCommited = function() {
  		var commited = false;
        if ($scope.flashcard.hasOwnProperty("learnData"))
          commited = $scope.flashcard.learnData.hasOwnProperty("nextDate");
      	return commited;
  	};

  	$scope.getCats = function(){ 
  		flashcards.getCategories().then(function(result){
		  	var cats = [];
		  	_.each(result.rows, function (value, key){
              cats.push({desc: value.key});
            })
		  	$scope.categories = cats;
		  	$scope.$apply();
		  });
  	};

  	$scope.addSubIdea = function(){
  		mapModel.addSubIdea("toolbar", undefined, ".");
  	};
  	$scope.save = function(){
  		var mapContent = JSON.parse(JSON.stringify(mapModel.getIdea()));
  		console.log(mapContent);
  		flashcards.saveMapContent($scope.flashcard._id, mapContent).then(function(result){
  			$ionicLoading.show({
			      template: 'saved',
			      duration: 500
			});
  		});
  	};
  	$scope.categories = $scope.getCats();
  	$scope.renderFlashcard = function(flashcardId){
	    flashcards.getFlashcard(flashcardId).then(function (doc) {
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
	};
	$scope.$on("$ionicView.enter", function(event, data){

	   	//$scope.renderFlashcard($stateParams.flashcardId);
	   	//$window.location.reload();
	});

	$scope.renderFlashcard($stateParams.flashcardId)
             //   mapModel.setIdea(idea);
});