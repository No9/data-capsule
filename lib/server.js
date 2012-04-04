var connect  = require('connect')
var uuid     = require('node-uuid')

/*Needs a loader*/
var logger = require('../logging/logger')
var config = require('../config/configuration')
config.load();
var DataCapsule = require('./data-capsule.js')

function start() {
  
  var port = config.Port || process.env.VCAP_APP_PORT || process.env.PORT || parseInt( process.argv[2], 10 )
  var staticFolder = config.AbsolutePath + '/site/public' // __dirname + '/../site/public'

  logger.log('info', 'port : '+ port +' static : ' + staticFolder)

  var dc = new DataCapsule({
    makeid:function(item){
      if( item.month ) {
        return item.month+'_'+item.type;
      }
      else {
        return uuid()
      }
    }
  })
  //Upgraded for Connect 2.0 AW 04/04/2012
  var server = connect()
    .use( connect.static( staticFolder ))
    .use( connect.bodyParser() )
    .use( connect.query() )
    .use(
          function(req,res,next){
            if( 0 === req.url.indexOf('/api/ping') ) {
              logger.log('info', req.url+': '+JSON.stringify(req.query))
              res.writeHead(200)
              res.end( JSON.stringify({ok:true,time:new Date()}) )
            }
            else next();
          })
    .use(dc.middleware())
  server.listen( port )
}

exports.start = start

if( 0 < process.argv[1].indexOf('server.js') ) {
  start()
}