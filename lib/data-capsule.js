"use strict";

var dispatch = require('dispatch')
var uuid     = require('node-uuid')
var logger = require('../logging/logger')
var Capsule = require('./capsule')
var util = require('./util');

function DataCapsule( opt ) {
  var self = {
    opt: opt || {}
  }

  self.opt.prefix = self.opt.prefix || '/capsule'
  logger.log('info', self.opt.prefix)
  self.capsulemap = {}



  self.capsule = function( acc,coll,spec, cb ) {
    var capname = acc+'~'+coll+'~'+spec
    var cap = self.capsulemap[capname]
    if( !cap ) {
      var capopt = {
        acc:acc,coll:coll,spec:spec,
        makeid:opt.makeid
      }
      cap = self.capsulemap[capname] = new Capsule(capopt)
    }
    cb(null,cap)
  }


  var getcap = function(win) {
    return function(req,res,next,acc,coll,spec,param){
      self.capsule( acc,coll,spec, util.err( res, function( cap ) {
        win( req, res, cap, param ) 
      }))
    }
  }


  self.api = {}


  self.api.rest = {
    get_one: getcap(function(req,res,cap,id){
      cap.load(id, util.err( res, util.found( res, util.senditem(res) )))
    }),

    get_all: getcap(function(req,res,cap){
      var q = req.query
      delete q._
      cap.list(q, util.err( res, function(items) {
        util.sendjson(res,{items:items})
      }))
    }),


    post: getcap(function(req,res,cap){
      var item = req.body
      if( item.id ) {
        util.sendcode(res,400,'unexpected id property')
      }
      else {
        cap.save(item, util.err( res, function(item) {
          util.sendjson(res,item)
        }))
      }
    }),


    put: getcap(function(req,res,cap,id){
      var item = req.body
      item.id = id
      cap.save(item, util.err( res, util.senditem(res) ))
    }),


    del: getcap(function(req,res,cap,id){
      cap.remove({id:id}, util.err( res, util.senditem(res) ))
    }),
  }


  self.api.sync = {
    get_version: getcap(function(req,res,cap){
      cap.meta( util.err( res, function( meta ) {
        util.sendjson(res,meta)
      }))
    }),

    get_updates: getcap(function(req,res,cap,version){
      var from    = parseInt(version,10)
      var history = cap.history.slice(from<0?0:from)

      var updates = {}
      for( var i = 0; i < history.length; i++ ) {
        var h = history[i]
        var prev_act = updates[h.id]
        if( prev_act ) {
          var act = h.act
          if( 'ADD' === act ) {
            if( 'MOD' === prev_act ) { act = 'MOD' }
            if( 'DEL' === prev_act ) { act = 'MOD' }
          }
          else if( 'MOD' === act ) {
            if( 'ADD' === prev_act ) { act = 'ADD' }
            if( 'DEL' === prev_act ) { act = 'MOD' }
          }
          else if( 'DEL' === act ) {
            if( 'ADD' === prev_act ) { act = 'IGNORE' }
          }

          if( 'IGNORE' === act ) {
            delete updates[h.id]
          }
          else {
            updates[h.id] = act
          }
        }
        else {
          updates[h.id] = h.act
        }
      }

      var itemacts = []
      for( var id in updates ) {
        itemacts.push({id:id,act:updates[id]})
      }

      var items = []
      function getitem(i) {
        if( i < itemacts.length ) {
          cap.load(itemacts[i].id, util.err(res,function(item){
            if( item ) {
              items.push({act:itemacts[i].act,item:item})
            }
            getitem(i+1)
          }))
        }
        else {
          util.sendjson(res,{updates:items})
        }
      }
      getitem(0)
    }),

    get_history: getcap(function(req,res,cap,version){
      var from    = parseInt(version,10)
      var history = cap.history.slice(from<0?0:from)
      util.sendjson(res,{history:history})
    })
  }


  var routes = {}
  routes[self.opt.prefix] = {
    '/rest/:acc/:coll/:spec/:id': {
      GET: self.api.rest.get_one,
      PUT: self.api.rest.put,
      DELETE: self.api.rest.del
    },
    '/rest/:acc/:coll/:spec': {
      GET:  self.api.rest.get_all,
      POST: self.api.rest.post
    },
    '/sync/:acc/:coll/:spec/version': {
      GET: self.api.sync.get_version
    },
    '/sync/:acc/:coll/:spec/updates/:version': {
      GET: self.api.sync.get_updates
    },
    '/sync/:acc/:coll/:spec/history/:version': {
      GET: self.api.sync.get_history
    }
  }
  self.dispatch = dispatch(routes)


  self.middleware = function() {
    logger.log('info', 'Entered Middleware')
    return function( req, res, next ) {
      logger.log('info', 'Passed Url is : ' + req.url)
      if( 0 === req.url.indexOf(self.opt.prefix) ) {
        self.dispatch( req, res, next )
      }
      else next();
    }
  }

  return self
}


module.exports = DataCapsule