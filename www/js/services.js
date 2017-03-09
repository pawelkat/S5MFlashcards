angular.module('starter.services', [])

.factory('flashcards', function() {
  // Might use a resource here that returns a JSON array
  var db = new PouchDB('flashcards');
  var flashcards = [];
  var settingsDoc ={}; 
  return {
    db: function(){
      return db;
    },

    config: function(){
      return settingsDoc;
    },
    //the function returning the current initial configuration
    loadConfig: function(){
      return db.get("settingsDoc").then(function (doc) {
        settingsDoc=doc;
        return settingsDoc;
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
    getByCategories: function(categories, offset, filterStr){
      return db.query('defaultViews/categoryItemsWithHeader', {
        startkey: [categories, filterStr],
        endkey: [categories, filterStr + '\uffff'],
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
    deleteFlashcard: function(flashcardId){
      return db.get(flashcardId).then(function(doc) {
        return db.remove(doc);
      }).then(function (result) {
        return result
      }).catch(function (err) {
        return err;
      });
    },
    getFlashcard: function(flashcardId){
      return db.get(flashcardId)
      .then(function (doc) {
        return doc;
      })
      .catch(function (err) {
        return err;
      })
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

      return db.get(designDocName)
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
                var keyStr = title.toLowerCase().replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                var header = '...';
                _.each(doc.flashcard.content.ideas, function (value, key){
                  header = header + value.title + "...";
                });
                var commited = false;
                if (doc.flashcard.hasOwnProperty("learnData"))
                  commited = doc.flashcard.learnData.hasOwnProperty("nextDate");
                emit([doc.flashcard.category[0], keyStr], {title: title, header: header, commited: commited});
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
    },
    isDbEmpty: function(){
      return db.info().then(function (result) {
        return (result.doc_count < 3);
      }).catch(function (err) {
        console.log(err);
      });
    },
    loadSampleData: function(){
      return db.bulkDocs([
      {"_id":"02990685-0bd6-4d94-8b88-d4c7578eed59","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Muskelkater","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcQ9GdwD5knHOd5EF0qftMuTnLPhBASbq1DfxjQJX9I7cz4uEQcDaJvTFXw","width":83,"height":98,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"Schmerzen nach übertriebenem Sport","id":2,"ideas":{}},"2":{"title":"Übersäuerung der Muskulatur","id":4},"3":{"title":"Oft begleitet von dem Satz: Aua, ich kann mich nich bewegen","id":5}},"links":[]}}},
      {"_id":"281e0d02-8176-4b6e-9630-4e0477b2aa79","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"sich einschleichen","id":1,"formatVersion":2,"ideas":{"1":{"title":"irgendwo einbrechen","id":2,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcSHYoei3vHBCxfpPQ5th1wVi9PGkjETmjpBae2XXxHreT-4Vj03dmTBfw","width":124,"height":82,"position":"left"},"style":{"background":"#E0E0E0"}}},"2":{"title":"mit der Zeit schleichen sich schlechte Gewohnheiten ein, die man nicht mehr los wird ","id":3}},"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcTEKvbDLZFAi2ha3xabOhAxW8HUG75zwhByyHqlwJAKh2OE4RwmF-4tyg","width":93,"height":124,"position":"left"},"style":{"background":"#22AAE0"}}}}},
      {"_id":"3eace13a-e2b9-a9d3-3248-1a0908d4af46","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"gebongt","id":1,"formatVersion":2,"ideas":{"1":{"title":"Oki doki","id":2}},"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcRY2dkgtQeGE7XQzELMutIlZLtjgjKP4NXbXv0z8uHeyrtJUxbTlYSm9AZY","width":150,"height":113,"position":"left"},"style":{"background":"#22AAE0"}}}}},
      {"_id":"46373884-877d-4d12-8098-8c4306b9653f","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Bäuerchen machen","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcSvFMCAsBvJ4tDIjFDiS1IWdAvi_dI8rk-a92h51RVdlIl1mLrUq2l_RXo","width":114,"height":71,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"wenn kleine Babys rülpsen, aufstoßen, verdauen","id":2},"2":{"title":"rülpsen","id":3,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcTnvNj8hAfMD4t9ihSf36kqehhrAGU2SyC9sVRFtO2r0SsHwSNLTl_n1KM","width":109,"height":82,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}},
      {"_id":"6c082bec-a422-46c4-a85a-ecf739547c75","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Torschlusspanik","id":1,"formatVersion":2,"ideas":{"1":{"title":" Angst, etwas zu verpassen","id":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcTCLnE6bLRXJw_dQ09z_KNi93zP1FpbWvI_BcuZNcS-ATrweOpaK-_3KQ","width":116,"height":116,"position":"left"},"style":{"background":"#E0E0E0"}}},"2":{"title":"Geht auf das Mittelalter zurück, in dem die Stadttore bei Anbruch der Dunkelheit aus Sicherheitsgründen geschlossen („Torschluss“) wurden","id":3,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcSadVC1FvP0u8E1ey9z8iiGNUxxsSXdOM_2SeaZO-ixAyAkXH1bRxd7lqg","width":116,"height":79,"position":"left"},"style":{"background":"#E0E0E0"}}}},"links":[]}}},
      {"_id":"6f25519e-f10b-47c7-b644-4c800d14c27a","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Ohrwurm","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcR_22eAmUd9NorM3h4GBHkbzWe6zAeATGcJARoOaAJtiP5cyA8c3UjL0vYF","width":136,"height":70,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"merkfähige Melodie, die dem Hörer für einen längeren Zeitraum in Erinnerung bleibt ","id":2,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcRABj4fw5TwQcmV3PTgyq7hDh2SM-JaQYSArxVGb3EcP_S2F20Q2ELe5PiF","width":101,"height":143,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}},
      {"_id":"6f44ca6f-d3c4-423a-af91-b5e201e3f80c","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Streber","id":1,"formatVersion":2,"ideas":{"1":{"title":"Nerd","id":2,"ideas":{},"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcSY1TLTKIpkq8YewHEv4BI40jYArEq4a3k7cV22LUs8s_VFlFxWfcXX5ZjY","width":150,"height":150,"position":"left"},"style":{"background":"#E0E0E0"}}},"2":{"title":"nie daje sciagac","id":3,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcTv6KxbGc0ZXegtVD29zMSedfKGYRYeo1tA3n5p-ihLpKv3Q4PhnngkqIo","width":133,"height":101,"position":"left"},"style":{"background":"#E0E0E0"}}},"13":{"title":"Steigerung:","id":5,"ideas":{"1":{"title":"Oberstreber","id":4,"attr":{"style":{"background":"#E0E0E0"}}}},"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcTJZGMjZwmZg2VdVDrfnMViJ9xJf_rkHwND5IHkTyDY3Bc3ZoKbjlF8tg","width":127,"height":92,"position":"left"},"style":{"background":"#E0E0E0"}}}},"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcQo97YktKBCfujOBUjYhcw7HleIoxZEo-9ZEUYGm3Dwkf_sImoDkAxzZQ8","width":83,"height":124,"position":"left"},"style":{"background":"#22AAE0"}}}}},
      {"_id":"72a12b12-30cf-43cc-8225-abe087a97e27","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"sich ekeln","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcRVQX2pKII1G8LEnTmcgHEmhFhCb9IEZF6z619Mil3JZne92BlHWAocegw","width":135,"height":89,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"fühlen","id":2,"ideas":{"1":{"title":"igitt","id":3,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcSE5eho02gYeipKiwdXt017wE0BIgvuB5NlBbF0aUVzLaDlB8o1hCM8brY","width":138,"height":102,"position":"left"},"style":{"background":"#E0E0E0"}}},"2":{"title":"bäh","id":4,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcT1G1_UPLfJT_1xYGRCz0oG9BdL_Ki_xI-RHGnyYrGf84nUgBXhSx9A6Us","width":137,"height":77,"position":"left"},"style":{"background":"#E0E0E0"}}},"3":{"title":"pfui","id":5,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcRNOLYslNfD8N96p3wQbFGN24HRhFA4T9uEspxAHJcWjFpuyeIHCHDt","width":111,"height":111,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}}}},
      {"_id":"765d45d5-e0b4-42dc-bfad-dfb1dcb42fed","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Klugscheißer","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcSAGWkr9HDdJyDUqbbg8rCoZgF6jzz_OGqYFnK_j7I2VXkMEeeMIPDS9Y4","width":100,"height":102,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"Besserwisser","id":2,"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcRQB8LMPbWlFuUy82OXvl93NSlPKzBIY2AqIEkws2o6JJ1hUHSHzkmpS84","width":84,"height":116,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}},
      {"_id":"7f97cedd-bf60-4a49-8387-20b436ed3eec","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Hackfresse","id":1,"formatVersion":2,"ideas":{"1":{"title":"Runtergezogene Mundwinkel, Augenlider auf Halbmast, sobald man diese Person sieht, verdirbt er einem die Laune. ","id":2},"2":{"title":"Ein von Missmut und Unwillen und Misanthropie gezeichnetes Gesicht","id":3}},"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcTIimP2a8mbbZUxVmscBC8FLcsg8wnFs9Z15-fbl2TVFRm1-X_CW9oD8J4","width":110,"height":83,"position":"left"},"style":{"background":"#22AAE0"}}}}},
      {"_id":"93ec106e-71fd-4070-8ce1-e9615e9849be","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"schlau","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcT2Cj7S03Obi2oUQYlXp_WdhKN_1ro3Jdp4MdWWKwyPtdP1Z3A-Soaden0","width":128,"height":127,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"clever","id":2,"ideas":{}},"2":{"title":"Beispiel:","id":4,"ideas":{"1":{"title":"schlau wie ein Fuchs","id":3,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcQ_zc3Xu2PMnfLSXVD87POMW23ZmUes0PiN2djpIRKHEq0tf2mrypwBeQ","width":85,"height":117,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}}}},
      {"_id":"966edc50-08f3-4f77-93ec-38212d5682c1","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Geistesblitz","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcQLCLuxv8-wnnfvIvOCI6RUAWsJVz_dsSyT6Uf_jtTFBsA0jwPKyAgE_o92","width":48,"height":150,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"plötzlicher (kluger) Einfall","id":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcQzWnodvX8BXUJkFhVueQZhgfNMsE1OlnYs5fTRtIqwzM3u2Ih0CwKvRH0","width":95,"height":115,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}},
      {"_id":"98ba98b6-27d6-4d9a-a026-78fdc0b3ff28","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"die Last","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcT0UbLBeGeO-GWHuQuywqDEvnuIUjFEHkonMZ3mm7uDWvtabi49QszlLLQ","width":149,"height":111,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"[größeres] Gewicht, das etwas belastet","id":2},"2":{"title":"schwere Ladung","id":3,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcQlAoZZwVvj4Avo-fg0Y3S20nPnQstGZOtGjYy9giQY7McxS3NqiS1Ny8rh","width":137,"height":115,"position":"left"},"style":{"background":"#E0E0E0"}}},"3":{"title":"Ballast","id":4},"4":{"title":"Beispiel: Schuld / Gebühren geht zu meinen Lasten = die Gebühren /Schuld trage ich oder übernehme ich","id":5},"5":{"title":"etwas, was [von jemandem] getragen oder transportiert wird [und durch sein Gewicht als drückend empfunden wird]","id":6}}}}},
      {"_id":"9c0007cf-28f0-47f4-9c56-c79e798d13c9","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"verwirrt","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcQp73t5fbO2JrC5gmXdAi2EqTy8XHQ5wTIQ67C2I9VD84BuOXZMG3Mz3E57","width":121,"height":150,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"confused","id":2,"attr":{"icon":{"url":"http://t2.gstatic.com/images?q=tbn:ANd9GcSpOkag5hOs6PxkMROaxXVwi0LLpnwQZeAVZoqoLjt3nUZrvU9dnM8KYQ","width":87,"height":126,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}},
      {"_id":"9ca17677-da08-47bc-9655-fc7399b1cef0","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"mit etwas gegen die Wand fahren","id":1,"formatVersion":2,"ideas":{"1":{"title":"mit etwas scheitern","id":2,"ideas":{"1":{"title":"ponieść klęskę z czymś","id":5}},"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcR4gjXKKqbRXu6e7PMZYYjuwgKXp9VSQaoB-Ht6dGUcX1WOKnTewgHong","width":124,"height":93,"position":"left"},"style":{"background":"#E0E0E0"}}},"2":{"title":"total erfolglos sein","id":3,"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcQ7n5CZb6lE7FMBY5v-m5B9QjMbx3TI7VPL7cgHqI-fi8398wm4XsKQIA","width":123,"height":123,"position":"left"},"style":{"background":"#E0E0E0"}}},"3":{"title":"Man kann eine Prüfung, einen Abschluss (Schulabschluss, Examen, Diplom) oder einen Betrieb gegen die Wand fahren. ","id":4}},"attr":{"icon":{"url":"http://t0.gstatic.com/images?q=tbn:ANd9GcSuLjHXrmq9uTGz13n4l3Cr5866CXmKWCSB8wvxqSrBFmkvzHVP1GahDyk","width":143,"height":87,"position":"left"},"style":{"background":"#22AAE0"}}}}},
      {"_id":"a1185c9d-9ff9-4dfb-b209-d5985aa61194","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Rotz und Wasser heulen","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcRkScE5WByDBm8qNW4IhsusBukEErw0iDX1MphfiXXvpMJ6O_auW2Ji3pE","width":108,"height":129,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"sehr stark weinen, sehr traurig sein","id":2},"2":{"title":"Rotz","id":3,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcTX9FHdFjjeNOTQRx6XWjGv_eu03CeJ5BBpLJ5IfwdbFF_LYGdouovXhzaI","width":124,"height":142,"position":"left"},"style":{"background":"#E0E0E0"}}},"3":{"title":"Wasser","id":4,"ideas":{"1":{"title":"hier: Tränen","id":5,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcTfuLxB9lvFnq7lXzmDTlUkoa6rCtZ8tdfN-WBYv-iIs6rsvjEFByT8vsU","width":114,"height":124,"position":"left"},"style":{"background":"#E0E0E0"}}}}}},"links":""}}},
      {"_id":"a5ed5e20-ce89-427c-b4da-acbcf7bd4fdd","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Angeber","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcS60ebAo6k-mLsfIgmqdvNqxpQdn8p4ibvYnv9gHTiUC7lamGATPg1q9Q","width":89,"height":110,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"braggart","id":2}}}}},
      {"_id":"aaa5daf2-0b54-4efa-8ca7-ff8269ed8b43","flashcard":{"commited":true,"category":["DeutschDemo","DHW"],"content":{"title":"Sodbrennen","id":1,"formatVersion":2,"attr":{"icon":{"url":"http://t1.gstatic.com/images?q=tbn:ANd9GcTtukkF28b0wqWGW6xits9SB2NIuPcG93HYP4885G7SPa36gU_jDRIzEps","width":111,"height":107,"position":"left"},"style":{"background":"#22AAE0"}},"ideas":{"1":{"title":"Magensäure die im Hals, durch aufstoßen, zu brennen und kratzen führt","id":2,"attr":{"icon":{"url":"http://t3.gstatic.com/images?q=tbn:ANd9GcRmXFlzsw5tuUM7JpEQdg9vIzZ-cChed8e52QEroiv1Fb3fK8Uvp85EPrs","width":102,"height":133,"position":"left"},"style":{"background":"#E0E0E0"}}}}}}}
      ]).then(function (result) {
        console.log(result);
      }).catch(function (err) {
        console.log(err);
      });
    }
  };
});
