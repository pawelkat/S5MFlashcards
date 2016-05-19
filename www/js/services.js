angular.module('starter.services', [])

.factory('flashcards', function() {
  // Might use a resource here that returns a JSON array
    var db = new PouchDB('flashcards');
    var flashcards = [];
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        getText = function(content){
            var aa = "...";
          //for (var i = 0; i < content.ideas.length; i++) {
            _.each(content.ideas, function (value, key){
              aa = aa + value.title + "...";
            });
            return aa;
        };
        doc.rows.forEach(function(row) {
            if(row.doc.hasOwnProperty("flashcard")){
             var flashcard = {
                id: row.doc._id,
                name: row.doc.flashcard.content.title,
                lastText: getText(row.doc.flashcard.content)
              };
            flashcards.push(flashcard);
            }
        });
    });
    
 

  return {
    all: function() {
      return flashcards;
    },
    nextToLearn: function(){
        return flashcards[0];
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
    }
  };
});
