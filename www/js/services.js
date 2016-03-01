angular.module('starter.services', [])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array
    var db = new PouchDB('flashcards');
    var chats = [];
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        doc.rows.forEach(function(todo) {
            if(todo.doc.hasOwnProperty("flashcard")){
             var chat = {
                id: todo.doc._id,
                name: todo.doc.flashcard.content.title,
                lastText: 'You on your way?',
                face: 'img/ben.png'
              };
            chats.push(chat);
            }
        });
    });
    
 

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === chatId) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
