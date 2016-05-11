$(document).ready(function(){ 
    var db = new PouchDB('flashcards');
    var remoteDB = new PouchDB('https://s5m-pawelkat.c9users.io/flashcards')
  // var remoteDB = new PouchDB('http://localhost:5984/flashcards')

	db.info().then(function (info) {
		console.log(info);
	});

/*    db.replicate.to(remoteDB).on('complete', function () {
    }).on('error', function (err) {
      alert("error");
    });*/


// create a design doc
/*var ddoc = {
  _id: '_design/byDate',
  views: {
    byDateIndex: {
      map: function mapFun(doc) {
        if (doc.flashcard.learnData) {
          emit(doc.flashcard.learnData.nextRev);
        }
      }.toString()
    }
  }
}

// save the design doc
db.put(ddoc).catch(function (err) {
  if (err.status !== 409) {
    throw err;
  }
  // ignore if doc already exists
}).then(function () {
  // find docs where title === 'Lisa Says'
  return db.query('byDate/byDateIndex', {
    startkey: '1999',
    include_docs: true
  });
}).then(function (result) {
  console.log(result)
}).catch(function (err) {
  console.log(err);
});*/
db.query('byDate/byDateIndex', {
    startkey: '2000',
    include_docs: true
  }).then(function (result) {
  console.log(result)
}).catch(function (err) {
  console.log(err);
})

    // document that tells PouchDB/CouchDB
// to build up an index on doc.name
/*var ddoc = {
  _id: '_design/my_index',
  views: {
    by_name: {
      map: function (doc) { emit([doc.flashcard]); }.toString()
    }
  }
};
// save it
db.put(ddoc).then(function () {
  // success!
}).catch(function (err) {
  // some error (maybe a 409, because it already exists?)
});

    
    db.query('my_index/by_name').then(function (res) {
  // got the query results
        console.log(res);
}).catch(function (err) {
  // some error
});*/



 /* db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    redrawTodosUI(doc.rows);
  });*/




});

  function redrawTodosUI(todos) {
        var aa =[];
        todos.forEach(function(todo) {
            if(todo.doc.hasOwnProperty("flashcard")){
             var chat = {
                id: todo.doc._id,
                name: todo.doc.flashcard.content.title,
                lastText: 'You on your way?',
                face: 'img/ben.png'
              };
            aa.push(chat);
        }
           // console.log(todo.doc.flashcard.content.title);
    });
    console.log(aa);
  }