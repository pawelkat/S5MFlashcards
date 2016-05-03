angular.module('starter.services', [])

.factory('flashcards', function() {
  // Might use a resource here that returns a JSON array
    var db = new PouchDB('flashcards');
    var flashcards = [];
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        doc.rows.forEach(function(todo) {
            if(todo.doc.hasOwnProperty("flashcard")){
             var chat = {
                id: todo.doc._id,
                name: todo.doc.flashcard.content.title,
                lastText: 'You on your way?',
                face: 'img/ben.png'
              };
            flashcards.push(chat);
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
