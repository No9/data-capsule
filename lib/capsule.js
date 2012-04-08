var logger = require('../logging/logger')
var inmemCapsule = require('../capsules/inmem')
var mongoCapsule = require('../capsules/mongo')
var config = require('../config/configuration')
var currentCapsule;

switch(config.capsule)
{
  case "mongo" : 
      logger.log('info', 'Using mongoCapsule');
      currentCapsule = mongoCapsule
  break; 
  default : 
    logger.log('info', 'Using inmemCapsule');
    currentCapsule = inmemCapsule; 
}

module.exports = currentCapsule;