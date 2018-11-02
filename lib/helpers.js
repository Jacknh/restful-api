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


// Export this module
module.exports = helpers;