/*
* primary file for the api
*
*/

var http = require('http');
var https = require('https');
var url = require('url');
var { StringDecoder } = require('string_decoder');
var config = require('./config');
var fs = require('fs');

var unifiedServer = function (req, res) {

  var parsedUrl = url.parse(req.url, true);

  var path = parsedUrl.pathname;
  var trimedPath = path.replace(/^\/+|\/+$/g, '');

  var method = req.method.toLowerCase();

  var queryStringObject = parsedUrl.query;

  var headers = req.headers;

  var decoder = new StringDecoder('utf8');
  var buffer = '';

  req.on('data', function (data) {
    buffer += decoder.write(data);
  })

  req.on('end', function () {
    buffer += decoder.end();

    var chosenHandler = typeof(router[trimedPath]) !== 'undefined' ? router[trimedPath] : handlers.notFound;

    var data = {
      'trimedPath': trimedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'payload': buffer
    }

    chosenHandler(data, function (statusCode, payload) {
      var status = typeof(statusCode) === 'number' ? statusCode : 200;
      var payload = typeof(payload) === 'object' ? payload : {};

      var payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(status);
      res.end(payloadString);
    })
  })
}

var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
})

httpServer.listen(config.httpPort, function () {
  console.log(`the server is listening on port ${config.httpPort} in ${config.envName} mode.`);
})

var options = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
}
var httpsServer = https.createServer(options, function (req, res) {
  unifiedServer(req, res);
})

httpsServer.listen(config.httpsPort, function () {
  console.log(`the server is listening on port ${config.httpsPort} in ${config.envName} mode`);
})

var handlers = {};

handlers.ping = function (data, callback) {
  callback(200);
}

handlers.hello = function (data, callback) {
  callback(200, { greeting: 'Hello, this is Jack!' });
}

handlers.notFound = function (data, callback) {
  callback(404);
}

var router = {
  'ping': handlers.ping,
  'hello': handlers.hello
}
