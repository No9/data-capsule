/*
*
* Copyright (C) 2012, Near Form
* All rights reserved.
*
* Please see the LICENSE file for more information.
*
*/

//just a place to populate config info
var fs = require('fs');
var path = require('path');

exports.load = function(filepath) {
    var absolutePath = path.join(path.dirname(path.resolve('config/config.json')))
    console.log('current path : ' + absolutePath)
    var configlocation = absolutePath + '/config.json'
    var config = {};
    try {
        config = JSON.parse(fs.readFileSync(configlocation));
    } catch(err) {
        if(err.code !== 'EBADF')
            throw err;
    }

    exports.Host = config.capsuleHost || 'localhost';
    exports.externalHost = config.capsuleHost || 'localhost';
    exports.Port = config.capsulePort || 8042;
    exports.CapsuleType = config.capsule;
    console.log("configured port : " + exports.Port)
    if(config.externalPort)
        exports.externalPort = config.externalPort;
    else if(config.externalSecure)
        exports.externalPort = 443;
    else
        exports.externalPort = exports.capsulePort;
    exports.externalSecure = config.externalSecure;
    exports.mongo = config.mongo || {
        "dataDir": "mongodata",
        "host": "localhost",
        "port": 27018
    };
    // FIXME: is lockerDir the root of the code/git repo? or the dir that it starts running from?
    // Right now it is ambiguous, we probably need two different vars
    exports.AbsolutePath = path.join(path.dirname(path.resolve(absolutePath)), ".");
    if(!config.logging) config.logging = {};
    exports.logging =  {
        file: config.logging.file || undefined,
        level:config.logging.level || "info",
        maxsize: config.logging.maxsize || 256 * 1024 * 1024, // default max log file size of 64MBB
        console: (config.logging.hasOwnProperty('console')? config.logging.console : true)
    };

    setBase();
}

function setBase() {
    exports.lockerBase = 'http://' + exports.Host +
                         (exports.Port && exports.Port != 80 ? ':' + exports.Port : '');
    exports.externalBase = 'http';
    if(exports.externalSecure === true || (exports.externalPort == 443 && exports.externalSecure !== false))
        exports.externalBase += 's';
    exports.externalBase += '://' + exports.externalHost +
                         (exports.externalPort && exports.externalPort != 80 && exports.externalPort != 443 ? ':' + exports.externalPort : '');
    if(exports.externalPath)
        exports.externalBase += exports.externalPath;
}
