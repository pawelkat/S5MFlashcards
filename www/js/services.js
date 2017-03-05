angular.module('starter.services', [])

.factory('flashcards', function() {
  // Might use a resource here that returns a JSON array
    var db = new PouchDB('flashcards');
    var flashcards = [];
    //formatting function for the items
    getText = function(content){
            var aa = "...";
          //for (var i = 0; i < content.ideas.length; i++) {
            _.each(content.ideas, function (value, key){
              aa = aa + value.title + "...";
            });
            return aa;
        };

  return {
    db: function(){
      return db;
    },
    //the function returning the current initial configuration
    config: function(){
      return db.get("settingsDoc").then(function (doc) {
        return doc;
      }).catch(function (err) {
        return null;
      });
    },

  /*  getByCategories: function(categories){
      return db.allDocs({
        include_docs: true
      }).then(function (result) {
        if (result.rows.length > 0 ) {
          var matchedWithCategory = result.rows
          .filter(
              function(row){
                if(!row.doc.hasOwnProperty("flashcard")) return false;

                var categoryArray = row.doc.flashcard.category;
                if (typeof categoryArray == 'undefined' || !(categoryArray instanceof Array) || categoryArray.length == 0) {
                  return false;
                }else{
                  return categoryArray[0]===categories;
                }
              }
            )
          .map(
              function(row){
                return {
                  id: row.doc._id,
                  name: row.doc.flashcard.content.title,
                  lastText: getText(row.doc.flashcard.content)
                };
              }
            );
          return {
            items: matchedWithCategory,
            itemsCnt: matchedWithCategory.length
          }
        }
      }).catch(function (err) {
        console.log(err);
      });
    }, */
    //returns the next item to learn by category
    getByCategories: function(categories, offset){
      return db.query('defaultViews/categoryItemsWithHeader', {
        startkey: [categories, ''],
        endkey: [categories,'\uffff'],
        skip: offset,
        limit: 15,
        include_docs: false,
        reduce: false
      }).then(function (result) { 
          return result.rows.map(
              function(row){
                return {
                  id: row.id,
                  name: row.value.title,
                  lastText: row.value.header,
                  commited: row.value.commited
                };
              }
            );
      }).catch(function (err) {
        console.log(err);
      });
    },
    countByCategories: function(categories){
      return db.query('defaultViews/categoryItemsWithHeader', {
        startkey: [categories, ''],
        endkey: [categories,'\uffff'],
        include_docs: false,
        reduce: true,
        //group: true,
        group_level: 1
      }).then(function (result) { 
          return result.rows[0].value;
      }).catch(function (err) {
        console.log(err);
      });
    },
    nextToLearn: function(categories){
      return db.query('defaultViews/commitedItems', {
        startkey: [categories, ''],
        endkey: [categories,new Date().toJSON()],
        limit: 1,
        include_docs: true
      }).then(function (result) {
        if (result.rows.length > 0 ) {   
          return {
            key: result.rows[0].id,
            doc: result.rows[0].doc
          }
        }else{
          return {
            key: 'noCardsLeft',
            doc: {flashcard:{content:{id:1,title:"no Cards toLearn"}}}
          }
        }
      }).catch(function (err) {
        console.log(err);
      });
    },
    numberCardsToRepeat: function(categories){
      return db.query('defaultViews/commitedItems', {
        startkey: [categories, ''],
        endkey: [categories,new Date().toJSON()],
        include_docs: false
      }).then(function (result) {
        return result.rows.length;
      }).catch(function (err) {
        console.log(err);
      });
    },
    //commiting to the learning process and returning the learnData proto object 
    commitFlashcard: function(flashcardId){
      var currFlashcard = {};
      return db.get(flashcardId)
      .then(function (doc) {
        currFlashcard = doc;
      })
      .then(function(){
        currFlashcard.flashcard.learnData={nextDate : new Date().toJSON()};
        db.put(currFlashcard);
        return currFlashcard.flashcard.learnData;
      })
      .catch(function (err) {
        return false;
      })
    },
    //saving the map content: the Idea, need to conserve the original learning data 
    saveMapContent: function(flashcardId, mapContent) {
      var currFlashcard = {};
      return db.get(flashcardId)
      .then(function (doc) {
        currFlashcard = doc;
      })
      .then(function(){
        currFlashcard.flashcard.content=mapContent;
        db.put(currFlashcard);
        return currFlashcard.flashcard;
      })
      .catch(function (err) {
        return false;
      })
    },
    addFlashcard: function(categories) {
      var newFlashcard = {
        flashcard: {
          category:[categories],
          content:{
            formatVersion:"2",
            id:"1",
            title: "__newItem"
          }
        }
      };
      return db.post(newFlashcard)
      then(function(response){
        return newFlashcard;      
      })
      .catch(function (err) {
        return false;
      })
    },
    remove: function(chat) {
      flashcards.splice(flashcards.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < flashcards.length; i++) {
        if (flashcards[i].id === chatId) {
          return flashcards[i];
        }
      }
      return null;
    },
    getCategories: function(){
      return db.query('defaultViews/mainCategory', {
        reduce: true,
        group: true
      }).then(function (result) {
        console.log(result);
        return result;
      });
    },
    //creating or updating local indexes
    updateIndex: function(){
      var designDoc = {};
      var designDocName ="_design/defaultViews";

      db.get(designDocName)
      .then(function (doc) {
        designDoc = doc;
      }).catch(function (err) {
        designDoc = {
          _id: designDocName
        }
      })
      .then(function(){
        designDoc.views = {
          commitedItems: {
            map: function mapFun(doc) {
              if (doc.flashcard.hasOwnProperty("category") && doc.flashcard.learnData && doc.flashcard.learnData.hasOwnProperty("nextDate")) {
                emit([doc.flashcard.category[0], doc.flashcard.learnData.nextDate]);
              }
            }.toString() //,
            //reduce: "_count"
          },
          categoryItemsWithHeader: {
            map: function mapFun(doc) {
              if (doc.flashcard.hasOwnProperty("category")) {
                var title = doc.flashcard.content.title.trim();
                var header = '...';
                _.each(doc.flashcard.content.ideas, function (value, key){
                  header = header + value.title + "...";
                });
                var commited = false;
                if (doc.flashcard.hasOwnProperty("learnData"))
                  commited = doc.flashcard.learnData.hasOwnProperty("nextDate");
                emit([doc.flashcard.category[0], title], {title: title, header: header, commited: commited});
              }
            }.toString(),
            reduce: "_count"
          },
          mainCategory: {
            map: function mapFun(doc) {
              if (doc.flashcard.hasOwnProperty("category")) {
                emit(doc.flashcard.category[0]);
              }
            }.toString(),
            reduce: "_count"
          }
        };
        db.put(designDoc).then(function (doc) {
          console.log("defaultViews updated")        
        });
      })    
    }
  };
});
