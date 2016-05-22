/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { utils: Cu } = Components;
const rootURI = __SCRIPT_URI_SPEC__.replace("bootstrap.js", "");
const COMMONJS_URI = "resource://gre/modules/commonjs";
const { require } = Cu.import(COMMONJS_URI + "/toolkit/require.js", {});
const { Bootstrap } = require(COMMONJS_URI + "/sdk/addon/bootstrap.js");
var { startup, shutdown, install, uninstall } = new Bootstrap(rootURI);


/*
 function startup(data, reason) {
 /// Bootstrap data structure @see https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
 ///   string id
 ///   string version
 ///   nsIFile installPath
 ///   nsIURI resourceURI
 ///
 /// Reason types:
 ///   APP_STARTUP
 ///   ADDON_ENABLE
 ///   ADDON_INSTALL
 ///   ADDON_UPGRADE
 ///   ADDON_DOWNGRADE
 }
 function shutdown(data, reason) {
 /// Bootstrap data structure @see https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
 ///   string id
 ///   string version
 ///   nsIFile installPath
 ///   nsIURI resourceURI
 ///
 /// Reason types:
 ///   APP_SHUTDOWN
 ///   ADDON_DISABLE
 ///   ADDON_UNINSTALL
 ///   ADDON_UPGRADE
 ///   ADDON_DOWNGRADE
 }
 function install(data, reason) {
 /// Bootstrap data structure @see https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
 ///   string id
 ///   string version
 ///   nsIFile installPath
 ///   nsIURI resourceURI
 ///
 /// Reason types:
 ///   ADDON_INSTALL
 ///   ADDON_UPGRADE
 ///   ADDON_DOWNGRADE
 }
 function uninstall(data, reason) {
 /// Bootstrap data structure @see https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions#Bootstrap_data
 ///   string id
 ///   string version
 ///   nsIFile installPath
 ///   nsIURI resourceURI
 ///
 /// Reason types:
 ///   ADDON_UNINSTALL
 ///   ADDON_UPGRADE
 ///   ADDON_DOWNGRADE
 }
    */