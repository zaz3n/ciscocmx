/*
 * cmxmap.js - manage a user map
 *
 * This file is part of the Cisco Shipped CMX demo application.
 * Copyright (C) 2015 Cisco.  All rights reserved.
 */

var user
var scale
var mapName
var imageName
var userListButton = "<button onClick='returnToUserList()'>Show List of All Users</button>"
var allUserMapButton = "<button onClick='showUserMap()'>Show Map of All Users</button>"
var currUser = null
var currUserHistory = null
var historyLengthToShow = 10
var historyMinimumGapSeconds = 60
var mapUpdateActive = false
var resizeEventHandlerSet = false

// showUserMap - show the map of users
// Arguments:
//   mapNameArg   - human-readable name of map for header
//   imageNameArg - filename of image to show
//   userToShow   - index of user for which history is desired; -1 to show all users
function showUserMap(mapNameArg, imageNameArg, userToShow, userHistory) {
  mapUpdateActive = true
  currUser = userToShow
  if (typeof mapNameArg == "string") {
    mapName = mapNameArg
  }
  if (typeof imageNameArg == "string") {
    imageName = imageNameArg
  }
  $("#content").show()
  var userlist = global.userlist
  var map = jQuery('#map');
  var imgUrl = cmxUrl("/config/v1/maps/imagesource/" + imageName)
  var imgWidth = $(window).width()
  scale = imgWidth / userlist[0].mapInfo.floorDimension.width;
  var w = imgWidth
  var h = Math.round(userlist[0].mapInfo.floorDimension.length * scale)
  map.css({width: w + 'px', height:h+'px', backgroundImage:'url('+imgUrl+')', backgroundSize:w+'px '+ h+'px' });
  map.show()
  setResizeEventHandler(true)
  if (typeof userToShow == "number" && userToShow >= 0) {
    if (typeof userHistory == "object") {
      showUserHistory(userHistory)
    } else {
      getUserHistory(userToShow)
    }
  } else {
    // Add links for individual users
    $("#heading").html("Map of All Users in Room " + mapName)
    $("#content").html(userListButton)
    $("#content").append("<br><br><span class='mapCaption'>Click on a user in the map below to display their location history</span>")
    for (var i = 0; i < userlist.length; i++) {
        var user = userlist[i]
        var x = user.mapCoordinate.x * scale
        var y = user.mapCoordinate.y * scale
        map.append( $("<a />", {
              href: "#",
              class:"point",
              onClick: "getUserHistory(" + i + ")"
          }).css({top:y + 'px', left: x+ 'px'}))
        map.append($("<a />", {
              href: "#",
              text: user.userName,
              class:"pointCaption",
              onClick: "getUserHistory(" + i + ")"
          }).css({top:y + 'px', left: (x+18) + 'px'}))
    }
    $(".userPoint").remove()
    $(".userPointCaption").remove()
    mapUpdateActive = false
  }
}

function getUserHistory(i)
{
  mapUpdateActive = true
  currUser = i
  $(".point").remove()
  $(".pointCaption").remove()
  $(".userPoint").remove()
  $(".userPointCaption").remove()
  $("#content").html(userListButton + "&nbsp;&nbsp" + allUserMapButton)
  $("#content").append("<br><br><span class='mapCaption'>Points are numbered from the most recent; hover over a point to see its exact time</span>")
  var user = global.userlist[i]
  if (user.userName == user.macAddress) {
    $("#heading").html("Location History of user at MAC Address " + user.macAddress)
  } else {
    $("#heading").html("Location History of User " + user.userName + " at MAC Address " + user.macAddress)
  }
  $.get(
      cmxUrl("/location/v1/history/clients/" + user.macAddress),
      showUserHistory,
      "json")
   .fail(showMapRestError)
}

function showUserHistory(history) {
  mapUpdateActive = true
  currUserHistory = history
  var map = jQuery('#map');
  var timeOfLastPoint = 0
  var minGapMS = historyMinimumGapSeconds*1000
  var pointsShown = 0
  for (var i = 0; pointsShown < historyLengthToShow && i < history.length; i++) {
    var timestamp = history[i].sourceTimestamp
    if (timestamp - timeOfLastPoint >= minGapMS) {
      var x = history[i].mapCoordinate.x * scale
      var y = history[i].mapCoordinate.y * scale
      timestamp = new Date(timestamp*1000)
      map.append( $("<a />", {
            href: "#",
            title: timestamp,
            text: ++pointsShown, 
            class:"userPoint"
        }).css({top:y + 'px', left: x+ 'px'}))
      map.append($("<span />", {
            text: timestamp.toLocaleTimeString(),
            class:"userPointCaption"
        }).css({top:y + 'px', left: (x+18) + 'px'}))
    }
  }
  mapUpdateActive = false
}

function returnToUserList() {
  $("#map").hide()
  $("#content").hide()
  setError()
  setResizeEventHandler(false)
  getUsers()
}

function showMapRestError(jqXHR, textStatus, errorThrown) {
  setResizeEventHandler(false)
  showRestError(jqXHR, textStatus, errorThrown)
}

// Handle resize events by redrawing the map
function setResizeEventHandler(setEventHandler) {
  if (resizeEventHandlerSet && !setEventHandler) {
    resizeEventHandlerSet = false
    $(window).off("resize")
    mapUpdateActive = false
  }
  else if (setEventHandler && !resizeEventHandlerSet) {
    resizeEventHandlerSet = true
    $(window).resize(function() {
      if (resizeEventHandlerSet && !mapUpdateActive) {
        $(".point").remove()
        $(".pointCaption").remove()
        $(".userPoint").remove()
        $(".userPointCaption").remove()
        showUserMap(0, 0, currUser, currUserHistory)
      }
    })
  }
}
