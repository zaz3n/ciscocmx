/*
 * login.js - manage the login form
 *
 * This file is part of the Cisco Shipped CMX demo application.
 * Copyright (C) 2015 Cisco.  All rights reserved.
 */

var restApiRoot = "/api"
var loginHeading = "Welcome to Connected Mobile Experiences on <a href='http://ciscocloud.github.io/shipped/dist/#/'>Shipped</a>"

// Fetch initial configuration from server and adjust form

$(document).ready(function() {
   var path = window.location.href.split("/")
   global.server = path[0] + "//" + path[2]
   $.get(
      global.server + "/local/config",
      function(config) {
        global.cmxServer = config.cmxServer
        if (config.virtualize) {
          $("#virtualize").prop('checked', true)
        }
        setVirtualize()
      },
      "json")
   .fail(showRestError)
})

// validate - Validate user's login info
function validate()
{
    if(validateServer()) {
        global.username = $("#user").val()
        var password = $("#pass").val();
        doLogin(password)
    }
}

// validateServer - Verify CMX server specifies a URL of the form http[s]://xxx:nnn
function validateServer()
{
    if ($("#virtualize").is(":checked")) {
      return true
    }

    var server = $("#cmxServer").val()
    if (server.match(/^https?:\/\/[^:]+:\d+$/)) {
        global.cmxServer = server
        return true;
    }
    else
    {
        setError("Invalid server address - must be of form http[s]://xxx:nnn")
        return false;
    }
}

// doLogin - get API authorization token from server
function doLogin(password) {
  $.post(
     global.server + "/local/config", 
     {
       "username": global.username,
       "password": password,
       "cmxServer": global.cmxServer,
       "virtualize": $("#virtualize").is(":checked")
     },
     function(data) {
       setError()
       global.apiToken = data.authToken
       $("#loginForm").hide()
       $("#logo").hide()
       $("#heading").html('')
       $("#logoutButton").show()
       getUsers()
     }, "json")
   .fail(showRestError)
}

// doLogout - close map and return to login
function doLogout() {
  setError()
  global.mapDisplayedOnce = false
  $("#logo").show()
  $("#heading").html(loginHeading)
  $("#loginForm").show()
  $("#logoutButton").hide()
  $("#content").hide()
  $("#content").empty()
  $("#map").hide()
  $("#map").empty()
  $("#map").css({backgroundImage:"none"})
  setResizeEventHandler(false)
}

// setVirtualize - respond to setting of the virtualize checkbox
function setVirtualize() {
  if ($("#virtualize").is(":checked")) {
    $("#cmxServer").prop('disabled', true)
    $("#cmxServer").val("n/a")
  } else {
    $("#cmxServer").prop('disabled', false)
    $("#cmxServer").val(global.cmxServer)
  }
  return true
}
