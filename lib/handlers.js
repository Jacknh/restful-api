/**
 * Request handlers
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

var handlers = {};

handlers.ping = function (data, callback) {
  callback(200);
}

handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { Error: 'Method not allowed' })
  }
}

// create a sub container for users
handlers._users = {};

handlers._users.post = function (data, callback) {
  // required fields: firstName, lastName, phone, password, tosAgreement
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, function (err, data) {
      if(err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        if(hashedPassword) {
          // create a userObject to store
          var userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true
          }

          _data.create('users', phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Internal Server Error, could not create a new file' });
            }
          })
        } else {
          callback(500, { Error: 'Internal Server Error, Could not hash the password' });
        }

      } else {
        callback(400, { Error: 'The file may already exists' });
      }
    })
  } else {
    callback(400, { Error: 'Bad request parameters' })
  }
  
} 

handlers._users.get = function (data, callback) {
  // Required field
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Check that the token for the user is valid
    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function(isValid) {
      if(isValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, { Error: 'Not Found' });
          }
        })
      } else {
        callback(400, { Error: 'The token for the user is not valid' });
      }
    })
  } else {
    callback(400, { Error: 'Request parameter wrong' })
  }
}

handlers._users.put = function (data, callback) {
  // Required field
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  // Optional fields
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, function(isValid) {
        if(isValid) {
          _data.read('users', phone, function(err, data) {
            if (!err && data) {
              firstName && (data.firstName = firstName);
              lastName && (data.lastName = lastName);
              password && (data.hashedPassword = helpers.hash(password));
    
              _data.update('users', phone, data, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the file' });
                }
              })
            } else {
              callback(500, { Error: 'Could not read the specific file' });
            }
          })
        } else {
          callback(403, { Error: 'The token for the user is not valid' });
        }
      })
    } else {
      callback(400, { Error: 'Missing optional field, nothing to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' })
  }
}

handlers._users.delete = function (data, callback) {  
  // Required field
  var phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {
    var token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function(isValid) {
      if(isValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            _data.delete('users', phone, function(err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, { Error: 'Could not delete the specified file' });
              }
            })
          } else {
            callback(400, { Error: 'Could not find the specified file' });
          }
        })
      } else {
        callback(403, { Error: 'The token for this user is not valid' });
      }
    })
  } else {
    callback(400, { Error: 'Missing required field' });
  }
}

// Token
handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { Error: 'Methods Not Allowed' });
  }
}

// Container for token
handlers._tokens = {};

handlers._tokens.post = function (data, callback) {
  // Required Field: phone, password
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword === data.hashedPassword) {
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          }

          _data.create('tokens', tokenId, tokenObject, function(err) {
            if(!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not create the token file' });
            }
          })
        } else {
          callback(400, { Error: 'invalid password for the specified user' });
        }
      } else {
        callback(400, { Error: 'could not read the users file' });
      }
    })
  } else {
    callback(405, { Error: 'Missing required fields' });
  }
}

handlers._tokens.get = function (data, callback) {
  var id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

  if(id) {
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { Error: 'Not Found' });
      }
    })
  } else {
    callback(405, { Error: 'Missing required field' });
  }
}

handlers._tokens.put = function (data, callback) {
  var id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        // check to make sure the token is not expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _data.update('tokens', id, tokenData, function(err) {
            if(!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not update the token' });
            }
          })
        } else {
          callback(500, { Error: 'The token has already expired, cannot be extended' });
        }
      } else {
        callback(404, { Error: 'Not Found' });
      }
    })
  } else {
    callback(405, { Error: 'Missing required fields' });
  }

}

handlers._tokens.delete = function(data, callback) {
  var id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

  if(id) {
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        _data.delete('tokens', id, function(err) {
          if(!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the token' });
          }
        })
      } else {
        callback(404, { Error: 'Not Found' });
      }
    })
  } else {
    callback(405, { Error: 'Missing required field' });
  }
}

handlers._tokens.verifyToken = function(id, phone, callback) {
  _data.read('tokens', id, function(err, tokenData) {
    if(!err && tokenData) {
      if(tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  })
}

handlers.notFound = function (data, callback) {
  callback(404);
}

module.exports = handlers;