angular.module('settings.module', [])



.controller('SettingsCtrl', function($scope, $ionicPopup, $ionicLoading, flashcards) {
	//default settings

	//TODO: all references to db should be in services:
	$scope.settings = {
		remoteDB: "http://192.168.16.195:5984/flashcards"
	}
	$scope.categories = [];
	$scope.isDbEmpty = false;

	var db = flashcards.db();
	var settingsDoc = {
			_id: "settingsDoc",
			settings: {}
		};
	//Initializing settings from DB
	db.get("settingsDoc").then(function (doc) {
		settingsDoc = doc;
    	$scope.settings = doc.settings;
    	$scope.$apply();
    }).catch(function (err) {
		settingsDoc.settings= $scope.settings
      	//$scope.settingsSave();
	});

    $scope.selectCategory = function(cat){
    	$scope.settings.mainCategory=cat.desc; 
    };

	$scope.settingsSave = function() {
		$ionicLoading.show({
			      template: 'saving ...',
			      duration: 3000
			    });
		settingsDoc.settings = $scope.settings;
		flashcards.config().settings = $scope.settings;
		db.put(settingsDoc).then(function (doc) {
			settingsDoc._rev = doc.rev;
		    $ionicLoading.show({
			      template: 'saved',
			      duration: 500
			});  		
	    });
	    //$state.go($app.feed, {}, {reload: true});
	}

	$scope.reindex = function() {
		flashcards.updateIndex().then(function(){
			$scope.getCats();
		});
	}

	$scope.replicateFrom = function() {
    	var remoteDB = new PouchDB($scope.settings.remoteDB); 	
	    db.replicate.from(remoteDB).on('complete', function () {
	    	alert("replication complete");
	    }).on('error', function (err) {
	      alert("replication error: " + err);
	    });
  	};

  	$scope.replicateTo = function() {
    	var remoteDB = new PouchDB($scope.settings.remoteDB); 	
	    db.replicate.to(remoteDB).on('complete', function () {
	    	alert("replication complete");
	    }).on('error', function (err) {
	      alert("replication error: " + err);
	    });
  	};

  	$scope.clearDatabase = function() {

	   	var confirmPopup = $ionicPopup.confirm({
	     	title: 'Delete data?',
	     	template: 'Are you sure you want to delete all your flashcards?'
	   	});

   		confirmPopup.then(function(res) {
	     	if(res) {
	       		db.destroy().then(function (response) {
			  		console.log(response);
			  		$scope.categories =[];
			  		$scope.$apply();
				}).catch(function (err) {
				  console.log(err);
				});
     		} else {
       			console.log('You are not sure');
     		}
  		});
 	};

	$scope.loadSampleData = function() {
		flashcards.loadSampleData().then(function(){
			$scope.reindex();
		});
	};
  	$scope.getCats = function(){
  		$scope.categories = []; 
  		flashcards.isDbEmpty().then(function (isEmpty) {
  			if(!isEmpty){
		  		$ionicLoading.show({
			      template: 'Loading statistics ...',
			      duration: 20000
			    })
		  		flashcards.getCategories().then(function(result){
				  	var cats = [];
				  	_.each(result.rows, function (value, key){
				  		flashcards.numberCardsToRepeat(value.key).then(function(toLearnResult){
				  			$scope.categories.push(
				  				{desc: value.key, categoryCount: value.value, toLearnCount: toLearnResult}
				  			);
				  			$scope.$apply();
				  		});
		            })
				  	$scope.isDbEmpty = false;
				  	$ionicLoading.hide()
				  	
				});
		  	}else{
		  		$scope.isDbEmpty = true;
		  		$scope.$apply();
		  	}
  		});
  	};
  	$scope.getCats();
  	
});