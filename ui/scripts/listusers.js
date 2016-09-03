/*
 * listusers.js - manage the list of users shown after login
 *
 * This file is part of the Cisco Shipped CMX demo application.
 * Copyright (C) 2015 Cisco.  All rights reserved.
 */

// getUsers - fetch the list of all active users from the server
function getUsers() {
  $("#heading").empty()
  $.get(
      cmxUrl("/location/v1/clients"),
      listUsers,
      "json")
   .fail(showRestError)
}

function listUsers(userlist) {
  for (var i = 0; i < userlist.length; i++) {
    var user = userlist[i]
    if (user.userName == "cisco123") {
      user.userName = user.macAddress
    }
  }
  global.userlist = userlist

  // If we've never seen a map, display the map for the first user's room

  if (!global.mapDisplayedOnce) {
    global.mapDisplayedOnce = true
    doAllUserMap(0)
    return
  }

  // Display a listing of all users

  $("#heading").html("CMX User List")
  var table = $("<table></table>").addClass("t1")
  table.append("<thead><tr>" +
               "<th></th>" +
               "<th>Username</th>" +
               "<th>AP MAC Address</th>" +
               "<th>MAC Address</th>" +
               "<th>First Located Time</th>" +
               "<th>Last Located Time</th>" +
               "<th>Location Map</th>" +
               "<th>Location Image</th>" +
               "</tr></thead>")
  var historyTitle = "Display location history for user at MAC address "
  var mapTitle = "Display all users at location "
  for (var i = 0; i < userlist.length; i++) {
    var user = userlist[i]
    var username = user.userName
    var apMac = user.apMacAddress
    var mac = user.macAddress
    var firstTime = user.statistics.firstLocatedTime.replace("T"," ").replace(/[+-]\d+$/,"")
    var lastTime = user.statistics.lastLocatedTime.replace("T"," ").replace(/[+-]\d+$/,"")
    var mapName = user.mapInfo.mapHierarchyString 
    var row = "<tr>" +
              "<td>" + (i+1) + "</td>" +
              "<td><a href='#' onClick='return doUserLocationHistory(" + i + ")' title='" + historyTitle + mac + "'>" + username + "</td>" +
              "<td>" + apMac + "</td>" +
              "<td>" + mac + "</td>" +
              "<td>" + firstTime + "</td>" +
              "<td>" + lastTime + "</td>" +
              "<td><a href='x' onClick='return doAllUserMap(" + i + ")' title='" + mapTitle + mapName + "'>" + mapName + "</td>" +
              "<td>" + user.mapInfo.image.imageName + "</td>" +
              "</tr>"
    table.append(row)
  }
  $("#content").html(table)
  $("#content").show()
}

// doAllUserMap - display a map with the current location of all users
function doAllUserMap(i) {
  $("#content").hide()
  var mapInfo = global.userlist[i].mapInfo
  showUserMap(mapInfo.mapHierarchyString, mapInfo.image.imageName, -1)
  return false
}

// doUserLocationHistory - display a map for a single user showing their location history
function doUserLocationHistory(i) {
  $("#content").hide()
  var mapInfo = global.userlist[i].mapInfo
  showUserMap(mapInfo.mapHierarchyString, mapInfo.image.imageName, i)
  return false
}
