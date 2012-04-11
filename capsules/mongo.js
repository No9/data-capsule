var logger = require('../logging/logger');
var config = require('../config/configuration');
config.load();
var mongodb = require('mongodb');
var url = require('url');
var Db = mongodb.Db, Server = mongodb.Server;

module.exports = function mongoCapsule( opt ) {
 
  var self = {};
  

/*
  self.loadHistory = function(err, callback)
  {
    console.log("Host: " + config.mongo.host);
    console.log("Port: " + config.mongo.port);
    ///username:password@
    var db = require('mongojs').connect(config.mongo.host + ':' + config.mongo.port + '/capsule');
    var mycollection = db.collection('mycollection');
    console.log("Create collection");
    mycollection.save({created:'just now'});
    console.log("Save collection");
    db.dropCollection('mycollection', function(err, result) {
            console.log("dropped: ");
            console.dir(result);
    });
  } 
*/
  logger.log('info', 'Capsule Creation');
  logger.log('info', 'opt.acc: ' + opt.acc);
  logger.log('info', 'opt.coll: ' + opt.coll);
  logger.log('info', 'opt.spec: ' + opt.spec);
  var acc  = opt.acc
  var collectionname = opt.coll
  var spec = opt.spec

  self.items = []
  self.index = {}
  self.v = -1

  //self.history = []

  self.load = function( query, cb ) {
    var id = query1
    if( 'string' != typeof(query) ) {
      id = query.id
    }
    cb(null,self.index[id])
  }
  
  self.purge = function()
  {
    var db = new Db('capsule', new Server("127.0.0.1", 27017, {}));
    db.open(function(err, db) {
      db.collection(collectionname, function(err, collection) {
          collection.remove({});
          console.log("dropped: " + collectionname);   
      
          db.collection(collectionname + '_history', function(err, historycollection) {
              historycollection.remove({});
              console.log("dropped: " + collectionname + '_history');  
              db.close();
              return; 
          });
      });  
    });
  } 

  self.save = function( item, cb) {
    
    // Create intial sync management attributes
    // Removed the augmentation of the userspace item as it polutes the object in the datastore
    var db = new Db('capsule', new Server("127.0.0.1", 27017, {}));
    db.open(function(err, db) {
      db.collection(collectionname, function(err, collection) {
      
      // Save a document with no safe option
        if( !item._id ) {
          item._id = mongodb.ObjectID;
          collection.save(item, {safe:true}, function(err) {
            if (err){
              console.warn(err.message);
              db.close();  
              return;
            }else{
              console.log('successfully updated');
              var historyitem = {};
              historyitem._id = mongodb.ObjectID;
              historyitem.id = item._id;
              historyitem.seq = 0
              historyitem.data = item;
              db.collection(collectionname + '_history', function(err, historycollection){
                historycollection.save(historyitem, {safe:false},
                function(err) {
                  if (err){
                        console.warn(err.message);
                        db.close();  
                        return;
                  }else{   
                      console.log('successfully updated history');
                      db.close();  
                      return;
                  }
                }); 
              });
            }
          });
        }
      });
    });
}

  self.remove = function( item, cb ) {
    var old = self.index[item.id]

    if( old ) {
      delete self.index[item.id]

      for( var i = 0; i < self.items.length; i++ ) {
        if( self.items[i].id === item.id ) {
          self.items.splice(i, 1)
          break
        }
      }

      self.history.push({id:item.id,act:'DEL',v:old.v$,sv:self.v})
      self.v++
    }

    cb(null,old)
  }

  /*
  @param {string} query - A querystring representing the SLEEP specification the URL parameters are parsed as follows.
  since : seq id to start at, returns everything after that, defaults to the start
  limit : maximum number of changes to return, defaults to unlimited XXX can a server optionally limit this to a maximum?
  include_data : if present and false, the wire protocol’s data field isn’t included
  */
  self.history = function(query, cb)
  {
      var queryData = url.parse(query, true).query;

      var collection = collectionname + '_history';
      var collections = [collection];

      // var db = require('mongojs').connect(config.mongo.host + ':' + config.mongo.port + '/capsule', collections);
      // logger.log('info', 'History : ' + coll + '_history') 
      // var historycollection = db.collection(coll + '_history');
      // historycollection.find(function(err, users) {
      //       users.forEach( function(femaleUser) {
      //       console.log(femaleUser);
      //       });
      // });
  }

  self.list = function( query, cb ) {
    var items = []
    for( var i = 0; i < self.items.length; i++ ) {
      var item = self.items[i]

      var match = true
      for( var p in query ) {
        var v = query[p]

        match = (item[p] == v)
        if( !match ) break;
      }

      if( match ) {
        items.push(item)
      }
    }
    cb(null,items)
  }


  self.meta = function( cb ) {
    cb(null,{version:self.v,length:self.items.length,acc:acc,coll:coll,spec:spec})
  }

  return self
}