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
    _data.read('users', phone, function (err, data) {
      if (!err && data) {
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404, { Error: 'Not Found' });
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
    callback(400, { Error: 'Missing required field' });
  }
}

handlers.notFound = function (data, callback) {
  callback(404);
}

module.exports = handlers;