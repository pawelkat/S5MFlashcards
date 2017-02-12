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

    getByCategories: function(categories){
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
    },
    //returns the next item to learn by category
    nextToLearn: function(categories){
      return db.query('byDate/byDateIndex', {
        endkey: new Date().toJSON(),
        limit: 10,
        include_docs: true
      }).then(function (result) {
        if (result.rows.length > 0 ) {
          var matchedWithCategory = result.rows
            .filter(
              function(row){
                return row.doc.flashcard.category[0]===categories;
              }
            )

          return {
            key: matchedWithCategory[0].id,
            doc: matchedWithCategory[0].doc,
            itemsRemaining: matchedWithCategory.length
          }
        }
      }).catch(function (err) {
        console.log(err);
      });
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

    //creating or updating local indexes
    updateIndex: function(){
      var designDoc = {};
      var designDocName ="_design/byDateAndCat";

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
          English: {
            map: function mapFun(doc) {
              if (doc.flashcard.learnData) {
                emit(doc.flashcard.learnData.nextDate, doc.flashcard.category);
              }
            }.toString()
          }
        };
        db.put(designDoc).then(function (doc) {
          console.log("view byDate updated")        
        });
      })    
    }
  };
});
