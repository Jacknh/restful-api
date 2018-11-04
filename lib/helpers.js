/**
 * Library for all the helpers
 */

// Dependencies
var crypto = require('crypto');
var config = require('../config');

// Container for this module
var helpers = {};

helpers.hash = function (str) {
  if (typeof(str) === 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
  } else {
    return false;
  }
}

helpers.parseJsonToObject = function (str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {}
  }
}

helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';

    for(var i = 0; i < strLength; i++) {
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }

    return str;
  } else {
    return false;
  }
}


// Export this module
module.exports = helpers;