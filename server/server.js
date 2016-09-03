/*
Server for Shipped CMX demo project

Author: David Tootill 2015.05.22
Copyright (C) Cisco, Inc.  All rights reserved.
*/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var express     = require("express");
var bodyParser  = require("body-parser")
var request     = require("request")
var serveStatic = require("serve-static")
var compression = require("compression")
var virtualCMXServer = require("./virtualCMXServer")

var nconf = require("nconf");
nconf.argv()
     .file({file: __dirname + "/config.json"})

// Set up middleware to serve UI static content

var app = express();
app.use(compression())
app.use(serveStatic(__dirname + "/../ui")) 
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*")
  next()
})

// Set configuration defaults

var virtualize = nconf.get("virtualize")
var cmxServer = nconf.get("cmxServer")

// Implement local methods

var localRouter = express.Router();
var localApiRoot = "/local"
app.use(localApiRoot, localRouter)

// Implement config method to get and set configuration

localRouter.get("/config", function(req,res) {
  var config = {
    cmxServer: cmxServer,
    virtualize: virtualize
  }
  res.json(config)
})

localRouter.post("/config", setLocalConfig)

// Implement CMX pass-through methods

var apiRouter = express.Router();
var restApiRoot = "/api"
app.use(restApiRoot, apiRouter)

apiRouter.get("/", function(req, res) {
    res.json({ message: "Shipped CMX Demo Server" })
})

apiRouter.get(/^(.*)$/, function(req,res) {
  if (typeof req.query.token != "string" || req.query.token.length == 0 ) {
    res.status(400).json({"error": "Missing token on request"})
    return
  }
  if (virtualize) {
    virtualCMXServer.respond(req, res)
  }
  else {
    console.log("Pass-through command: " + req.path)
    request({
      url: cmxServer + restApiRoot + req.path,
      headers: {
        "Authorization": "Basic " + req.query.token
      }
    })
    .on('error', function(e) {
      console.log(e)
      res.status(500).json(e)
    })
    .pipe(res).on('error', function(e) {
      console.log(e)
      res.status(500).json(e)
    })
  }
})


// Start the server
app.listen(nconf.get("port"))
console.log(statusMessage())

// setLocalConfig - implement the /local/config POST request
function setLocalConfig(req, res) {
  var userInfo = new Object()
  var configChanged = false
  for (var key in req.body) {
    console.log("Setting " + key + " = " + req.body[key])
    switch(key) {
      case "username":
      case "password":
        userInfo[key] = req.body[key]
        break;

      case "cmxServer":
        if (req.body[key] != cmxServer) {
          cmxServer = req.body[key]
          configChanged = true
        }
        break

      case "virtualize":
        var newSetting = (req.body[key] == "true")
        if (newSetting != virtualize) {
          console.log("Changing virtualize setting from " + virtualize + " to " + newSetting)
          virtualize = newSetting
          configChanged = true
        }
        break

      default:
        res.status(400).json({error: "Unknown local config keyword '" + key + "'"})
        return
    }
  }

  // Write a log message if we changed CMX server

  if (configChanged) {
    console.log(statusMessage())
  }

  // Build an auth token if caller specified userid and password

  var config = {
    cmxServer: cmxServer,
    virtualize: virtualize
  }
  if (typeof userInfo.username == "string" &&
      typeof userInfo.password == "string" ) {
    config.authToken = new Buffer(userInfo.username + ":" + userInfo.password).toString("base64");
  }
  res.json(config)
}

function statusMessage() {
  var msg = "Server is listening on port " + nconf.get("port")
  if (virtualize) {
    return msg + " and virtualizing the CMX server with local file data"
  }
  return msg + " and obtaining data from CMX server " + cmxServer
}
