/*
 * common.js - variables and functions common to all forms
 *
 * This file is part of the Cisco Shipped CMX demo application.
 * Copyright (C) 2015 Cisco.  All rights reserved.
 */

var global = new Object() // Global values

// setError - report an error
function setError(message) {
  if (typeof message == "string" && message.length > 0) {
    $("#errorMessage").html(message)
    $("#errorMessage").show()
  } else {
    $("#errorMessage").empty()
    $("#errorMessage").hide()
  }
}

// showRestError - format an error message after a REST call failure
function showRestError(jqXHR, textStatus, errorThrown) {
  if (typeof jqXHR != "object" || typeof jqXHR.status != "number" || jqXHR.status == 0) {
    setError("Error: No response. Is the server at " + global.server + " running?")
  } else {
     var msg = "Error " + jqXHR.status + " " + jqXHR.statusText;
     if (typeof errorThrown == "string" && errorThrown.length > 0 && errorThrown != jqXHR.statusText) {
       msg += "; " + errorThrown
     }
     if (typeof jqXHR.responseJSON == "object" ) {
       msg += "; " + JSON.stringify(jqXHR.responseJSON)
     }
     else if (typeof jqXHR.responseText == "string" &&
              jqXHR.responseText.length > 0) {
       msg += "; " + JSON.responseText
     }
     setError(msg)
  }
}

// cmxUrl - build a CMX URL
function cmxUrl(method) {
  return global.server + "/api" + method + "?token=" + global.apiToken
}
