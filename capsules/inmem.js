var logger = require('../logging/logger')
module.exports = function InmemCapsule( opt ) {
  var self = {};
  logger.log('info', 'Capsule Creation');
  logger.log('info', 'opt.acc: ' + opt.acc);
  logger.log('info', 'opt.coll: ' + opt.coll);
  logger.log('info', 'opt.spec: ' + opt.spec);
  var acc  = opt.acc
  var coll = opt.coll
  var spec = opt.spec

  self.items = []
  self.index = {}
  self.v = -1

  self.history = []


  self.load = function( query, cb ) {
    var id = query
    if( 'string' != typeof(query) ) {
      id = query.id
    }
    cb(null,self.index[id])
  }

  self.save = function( item, cb ) {
    if( !item.id ) {
      item.id = (opt.makeid && opt.makeid(item)) || uuid()
      item.v$ = 0

      if( self.items[item.id] ) {
        return cb('id '+item.id+' exists')
      }
    }

    var old = self.index[item.id]

    if( old ) {
      item.v$ = old.v$+1
      for( var i = 0; i < self.items.length; i++ ) {
        if( self.items[i].id == item.id ) {
          self.items[i] = item
          break
        }
      }
      self.history.push({id:item.id,act:'MOD',v:item.v$,sv:self.v})
    }
    else {
      self.items.push(item)
      self.history.push({id:item.id,act:'ADD',v:item.v$,sv:self.v})
    }

    self.index[item.id] = item

    self.v++
    cb(null,item)
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