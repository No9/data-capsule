var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  should = require('should');

var client = new Db('test', new Server("127.0.0.1", 27017, {})),
  test = function (err, collection) {
      console.log(err);
      console.log('Insert Test');
      collection.insert({a:2}, function(err, docs) {
                collection.count(function(err, count) {
                    count.should.equal(1);
                    console.log('Count should be one');
        });

        console.log('Find Test');
        // Locate all the entries using find
        collection.find().toArray(function(err, results) {
        results.length.should.equal(1); 
        console.log('length should be one');
        //test.assertEquals(1, results.length);
        results[0].a.should.equal(2);
        console.log('Value should be two');
        ///test.assertTrue(results[0].a === 2);
        collection.drop(function(err, collection) {
          db.close();
        });  
        // Let's close the db
        client.close();
      });
    });
  };
  client.open(function(err, p_client) {
    client.collection('test_insert', test);
  });