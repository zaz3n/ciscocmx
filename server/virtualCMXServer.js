/*
virtualCMXServer - set up virtual CMX server for use when CMX is down
We assume the existence of a testData directory with two JSON files
  allClients.json - contains an array of all clients by MAC address
  history.json - contains an array of a single client's history
and all image files that can be retrieved by /config/v1/maps/imagesource

Author: David Tootill 2015.05.22
Copyright (C) Cisco, Inc.  All rights reserved.
*/

var allClients = null
var history = null
var fs = require("fs")

// respond() - respond to a REST API call
function respond(req, res) {
  var matches
  if (allClients == null ) {
    allClients = require(__dirname + "/testData/allClients.json")
  }
  if (null != req.path.match(/location\/v1\/clients\/count$/)) {
    res.json({
      count: allClients.length,
      deviceQueryString: null,
      deviceType: "Wireless_Client",
    })

  } else if (null != req.path.match(/location\/v1\/clients$/)) {
    res.send(allClients)

  } else if (null != (matches = req.path.match(/location\/v1\/history\/clients\/([0-9a-f:]+)/))) {
    var filename = "history_" + matches[1].replace(/:/g, "-") + ".json"
    fs.readFile(__dirname + "/testData/" + filename, function(err, data) {
      if (err) {
        res.status(404).send({error: "History for client with MAC address " + matches[1] + " has not been virtualized"})
      } else {
        res.send(data)
      }
    })
  } else if (null != (matches = req.path.match(/location\/v1\/clients\/([0-9a-f:]+)/))) {
    for (var i = 0; i < allClients.length; i++) {
      var client = allClients[i]
      if (client.macAddress == matches[1]) {
        res.send(client)
        return
      }
    }
    res.status(404).send({error: "Client " + matches[1] + " not found"})

  } else if (null != (matches = req.path.match(/^\/config\/v1\/maps\/imagesource\/([^\.\/]+\.)([^\.\/]+)$/))) {
    fs.readFile(__dirname + "/testData/"+matches[1]+matches[2], function(err, img) {
      if (err) {
        res.status(404).send({error: "Image " + matches[1]+matches[2] + " not available from virtualized server"})
      } else {
        res.writeHead(200,{"Content-Type":"image/"+matches[2]})
        res.end(img, "binary")
      }
    })
  } else {
      res.status(500).send({error: "Method " + req.path + " is not supported by virtualized server"})
  }
}

exports.respond = respond
