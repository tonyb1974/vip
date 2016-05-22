
var {Cc, Ci, Cu} = require('chrome');
var prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);

var préférencesInitiales = {};
var préférencesSécurisantes = {
    "startup.homepage_welcome_url": "",
    "startup.homepage_welcome_url.additional": "",
    "network.dns.disableIPv6": true,
    "network.http.max-connections": 256,
    "network.http.max-persistent-connections-per-proxy": 256,
    "network.http.max-persistent-connections-per-server": 6,
    "network.http.pipelining": true,
    "network.http.pipelining.abtest": false,
    "network.http.pipelining.aggressive": true,
    "network.http.pipelining.max-optimistic-requests": 3,
    "network.http.pipelining.maxrequests": 12,
    "network.http.pipelining.maxsize": 300000,
    "network.http.pipelining.read-timeout": 60000,
    "network.http.pipelining.reschedule-on-timeout": true,
    "network.http.pipelining.reschedule-timeout": 15000,
    "network.http.pipelining.ssl": true,
    "network.http.proxy.pipelining": true,
    "network.http.redirection-limit": 20,
    "network.http.fast-fallback-to-IPv4": true,
    "browser.cache.use_new_backend": 1,
    "media.peerconnection.enabled": false,
    "media.peerconnection.use_document_iceservers": false,
    "media.navigator.enabled": false,
    "media.getusermedia.screensharing.enabled": false,
    "media.getusermedia.screensharing.allowed_domains": "",
    "browser.send_pings": false,
    "browser.send_pings.require_same_host": true,
    "network.proxy.socks_remote_dns": true,
    "network.dns.disablePrefetch": true,
    "network.dns.disablePrefetchFromHTTPS": true,
    "network.prefetch-next": false,
    "network.http.speculative-parallel-limit": 0,
    "privacy.donottrackheader.enabled": true,
    "privacy.donottrackheader.value": 1,
    "privacy.trackingprotection.enabled": true,
    "network.IDN_show_punycode": true,
    "dom.event.clipboardevents.enabled": false,
    "geo.enabled": false,
    "geo.wifi.uri": "",
    "browser.search.geoSpecificDefaults": false,
    "browser.search.geoSpecificDefaults.url": "",
    "browser.search.geoip.url": "",
    "breakpad.reportURL": "",
    "toolkit.telemetry.archive.enabled": false,
    "toolkit.telemetry.cachedClientID": "",
    "toolkit.telemetry.enabled": false,
    "toolkit.telemetry.previousBuildID": "",
    "toolkit.telemetry.server": "",
    "toolkit.telemetry.unified": false,
    "datareporting.healthreport.about.reportUrl": "",
    "datareporting.healthreport.about.reportUrlUnified": "",
    "datareporting.healthreport.documentServerURI": "",
    "datareporting.healthreport.infoURL": "",
    "datareporting.healthreport.logging.consoleEnabled": false,
    "datareporting.healthreport.service.enabled": false,
    "datareporting.healthreport.uploadEnabled": false,
    "datareporting.policy.dataSubmissionEnabled": false,
    "datareporting.policy.dataSubmissionEnabled.v2": false,
    "browser.selfsupport.url": "",
    "browser.safebrowsing.downloads.enabled": false,
    "browser.safebrowsing.downloads.remote.enabled": false,
    "browser.safebrowsing.enabled": false,
    "services.sync.prefs.sync.browser.safebrowsing.enabled": false,
    "browser.safebrowsing.malware.enabled": false,
    "browser.safebrowsing.provider.google.appRepURL": "",
    "browser.safebrowsing.provider.google.gethashURL": "",
    "browser.safebrowsing.provider.google.lists": "",
    "browser.safebrowsing.provider.google.reportURL": "",
    "browser.safebrowsing.provider.google.updateURL": "",
    "browser.safebrowsing.provider.mozilla.gethashURL": "",
    "browser.safebrowsing.provider.mozilla.updateURL": "",
    "browser.safebrowsing.reportMalwareMistakeURL": "",
    "browser.safebrowsing.reportPhishMistakeURL": "",
    "browser.safebrowsing.reportPhishURL": "",
    "media.video_stats.enabled": false,
    "javascript.options.asmjs": false,
    "gfx.font_rendering.opentype_svg.enabled": false,
    "security.mixed_content.block_active_content": true,
    "security.mixed_content.block_display_content": true,
    "security.cert_pinning.enforcement_level": 2,
    "security.ssl.errorReporting.enabled": false,
    "security.ssl.treat_unsafe_negotiation_as_broken": true,
    "security.tls.unrestricted_rc4_fallback": false,
    "security.ssl3.dhe_rsa_aes_128_sha": false,
    "security.ssl3.dhe_rsa_aes_256_sha": false,
    "security.ssl3.ecdhe_ecdsa_aes_128_gcm_sha256": true,
    "security.ssl3.ecdhe_ecdsa_aes_128_sha": false,
    "security.ssl3.ecdhe_ecdsa_aes_256_sha": true,
    "security.ssl3.ecdhe_ecdsa_rc4_128_sha": false,
    "security.ssl3.ecdhe_rsa_aes_128_gcm_sha256": true,
    "security.ssl3.ecdhe_rsa_aes_128_sha": false,
    "security.ssl3.ecdhe_rsa_aes_256_sha": true,
    "security.ssl3.ecdhe_rsa_rc4_128_sha": false,
    "security.ssl3.rsa_aes_128_sha": true,
    "security.ssl3.rsa_aes_256_sha": true,
    "security.ssl3.rsa_des_ede3_sha": false,
    "security.ssl3.rsa_rc4_128_md5": false,
    "security.ssl3.rsa_rc4_128_sha": false,
    "security.pki.sha1_enforcement_level": 1,
    "browser.urlbar.trimURLs": false,
    "browser.urlbar.unifiedcomplete": false,
    "browser.search.context.loadInBackground": true,
    "full-screen-api.warning.delay": 0,
    "full-screen-api.warning.timeout": 0,
    "browser.fullscreen.animate": false,
    "browser.tabs.animate": false,
    "browser.tabs.warnOnCloseOtherTabs": false,
    "general.warnOnAboutConfig": false,
    "dom.disable_beforeunload": true,
    "dom.event.contextmenu.enabled": false,
    "dom.disable_window_open_feature.location": true,
    "dom.disable_window_open_feature.resizable": true,
    "dom.disable_window_open_feature.status": true,
    "dom.storage.enabled": false,
    "browser.newtab.preload": false,
    "browser.newtab.url": "about:blank",
    "browser.newtabpage.directory.ping": "",
    "browser.newtabpage.directory.source": "",
    "browser.newtabpage.enabled": false,
    "browser.newtabpage.enhanced": false,
    "browser.newtabpage.introShown": true,
    "general.autoScroll": false,
    "security.dialog_enable_delay": 400,
    "plugins.notifyMissingFlash": false,
    "extensions.getAddons.cache.enabled": false,
    "media.gmp-eme-adobe.autoupdate": false,
    "media.gmp-eme-adobe.enabled": false,
    "media.eme.apiVisible": false,
    "media.eme.enabled": false,
    "browser.eme.ui.enabled": false,
    "loop.CSP": "",
    "loop.enabled": false,
    "loop.feedback.baseUrl": "",
    "loop.oauth.google.scope": "",
    "loop.server": "",
    "browser.pocket.api": "",
    "browser.pocket.enabled": false,
    "browser.pocket.oAuthConsumerKey": "",
    "browser.pocket.site": "",
    "social.directories": "",
    "social.remote-install.enabled": false,
    "social.share.activationPanelEnabled": false,
    "social.shareDirectory": "",
    "social.toast-notifications.enabled": false,
    "social.whitelist": "",
    "reader.parse-on-load.enabled": false,
    "pdfjs.disabled": true,
    "pdfjs.enableWebGL": false,
    "beacon.enabled": false,
    "device.sensors.enabled": false,
    "dom.battery.enabled": false,
    "dom.cellbroadcast.enabled": false,
    "dom.enable_performance": false,
    "dom.gamepad.enabled": false,
    "dom.netinfo.enabled": false,
    "dom.telephony.enabled": false,
    "dom.vibrator.enabled": false,
    "dom.vr.enabled": false,
    "dom.vr.oculus.enabled": false,
    "dom.vr.oculus050.enabled": false,
    "dom.webnotifications.enabled": false,
    "dom.webnotifications.serviceworker.enabled": false,
    "media.webspeech.recognition.enable": false,
    "browser.contentHandlers.types.0.title": "",
    "browser.contentHandlers.types.0.type": "",
    "browser.contentHandlers.types.0.uri": "",
    "gecko.handlerService.schemes.irc.0.name": "",
    "gecko.handlerService.schemes.irc.0.uriTemplate": "",
    "gecko.handlerService.schemes.ircs.0.name": "",
    "gecko.handlerService.schemes.ircs.0.uriTemplate": "",
    "gecko.handlerService.schemes.mailto.0.name": "",
    "gecko.handlerService.schemes.mailto.0.uriTemplate": "",
    "gecko.handlerService.schemes.mailto.1.name": "",
    "gecko.handlerService.schemes.mailto.1.uriTemplate": "",
    "gecko.handlerService.schemes.webcal.0.name": "",
    "gecko.handlerService.schemes.webcal.0.uriTemplate": "",
    "browser.aboutHomeSnippets.updateUrl": "",
    "dom.push.connection.enabled": false,
    "dom.push.enabled": false,
    "dom.push.serverURL": "",
    "dom.push.udp.wakeupEnabled": false,
    "dom.push.userAgentID": "",
    "network.http.spdy.allow-push": false,
    "network.http.spdy.enabled": false,
    "network.http.spdy.enabled.deps": false,
    "network.http.spdy.enabled.http2": false,
    "network.http.spdy.enabled.v3-1": false
};

exports.navigationPrivee = function() {
    var prefsDemarrage = prefService.getBranch("startup.");
    var prefsReseau = prefService.getBranch("network.");
    var prefsNavigateur = prefService.getBranch("browser.");
    var prefsMedia = prefService.getBranch("media.");
    var prefsViePrivee = prefService.getBranch("privacy.");
    var prefsDOM = prefService.getBranch("dom.");
    var prefsGeographiques = prefService.getBranch("geo.");
    var prefsOutils = prefService.getBranch("toolkit.");
    var prefsRapports = prefService.getBranch("datareporting.");
    var prefsPlantage = prefService.getBranch("breakpad.");
    var prefsJavascript = prefService.getBranch("javascript.");
    var prefsGFX = prefService.getBranch("gfx.");
    var prefsSecurite = prefService.getBranch("security.");
    var prefsPleinEcran = prefService.getBranch("full-screen-api.");
    var prefsGénérales = prefService.getBranch("general.");
    var prefsModules = prefService.getBranch("plugins.");
    var prefsExtension = prefService.getBranch("extensions.");
    var prefsBoucleLocale = prefService.getBranch("loop.");
    var prefsReseauSocial = prefService.getBranch("social.");
    var prefsPdfJS = prefService.getBranch("pdfjs.");
    var prefsLiseuse = prefService.getBranch("reader.");
    var prefsGecko = prefService.getBranch("gecko.");
    var prefsBeacon = prefService.getBranch("beacon.");
    var prefsMatériel = prefService.getBranch("device.");
    var prefsServices = prefService.getBranch("services.");


    prefsDemarrage.setCharPref("homepage_welcome_url", préférencesSécurisantes["startup.homepage_welcome_url"]);
    prefsDemarrage.setCharPref("homepage_welcome_url.additional", préférencesSécurisantes["startup.homepage_welcome_url.additional"]);


    // Default network values from Tor Browser 4.5.3:
    prefsReseau.setIntPref("http.max-connections", préférencesSécurisantes["network.http.max-connections"]);
    prefsReseau.setIntPref("http.max-persistent-connections-per-proxy", préférencesSécurisantes["network.http.max-persistent-connections-per-proxy"]);
    prefsReseau.setIntPref("http.max-persistent-connections-per-server", préférencesSécurisantes["network.http.max-persistent-connections-per-server"]);
    prefsReseau.setBoolPref("http.pipelining", préférencesSécurisantes["network.http.pipelining"]);
    prefsReseau.setBoolPref("http.pipelining.abtest", préférencesSécurisantes["network.http.pipelining.abtest"]);
    prefsReseau.setBoolPref("http.pipelining.aggressive", préférencesSécurisantes["network.http.pipelining.aggressive"]);
    prefsReseau.setIntPref("http.pipelining.max-optimistic-requests", préférencesSécurisantes["network.http.pipelining.max-optimistic-requests"]);
    prefsReseau.setIntPref("http.pipelining.maxrequests", préférencesSécurisantes["network.http.pipelining.maxrequests"]);
    prefsReseau.setIntPref("http.pipelining.maxsize", préférencesSécurisantes["network.http.pipelining.maxsize"]);
    prefsReseau.setIntPref("http.pipelining.read-timeout", préférencesSécurisantes["network.http.pipelining.read-timeout"]);
    prefsReseau.setBoolPref("http.pipelining.reschedule-on-timeout", préférencesSécurisantes["network.http.pipelining.reschedule-on-timeout"]);
    prefsReseau.setIntPref("http.pipelining.reschedule-timeout", préférencesSécurisantes["network.http.pipelining.reschedule-timeout"]);
    prefsReseau.setBoolPref("http.pipelining.ssl", préférencesSécurisantes["network.http.pipelining.ssl"]);
    prefsReseau.setBoolPref("http.proxy.pipelining", préférencesSécurisantes["network.http.proxy.pipelining"]);
    prefsReseau.setIntPref("http.redirection-limit", préférencesSécurisantes["network.http.redirection-limit"]);

    // Enable new cache:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=913807
    prefsNavigateur.setIntPref("cache.use_new_backend", préférencesSécurisantes["browser.cache.use_new_backend"]);

    // Disable WebRTC:
    // This is extremely important for VPN users - WebRTC *will* leak your real internal and external IP addresses.
    // WebRTC leak test (among other things): https://ipleak.net/
    // https://hacks.mozilla.org/2012/11/progress-update-on-webrtc-for-firefox-on-desktop/
    // https://mozilla.github.io/webrtc-landing/
    // https://wiki.mozilla.org/Media/getUserMedia
    prefsMedia.setBoolPref("peerconnection.enabled", préférencesSécurisantes["media.peerconnection.enabled"]);
    prefsMedia.setBoolPref("peerconnection.use_document_iceservers", préférencesSécurisantes["media.peerconnection.use_document_iceservers"]);
    prefsMedia.setBoolPref("navigator.enabled", préférencesSécurisantes["media.navigator.enabled"]);
    prefsMedia.setBoolPref("getusermedia.screensharing.enabled", préférencesSécurisantes["media.getusermedia.screensharing.enabled"]);
    prefsMedia.setCharPref("getusermedia.screensharing.allowed_domains", préférencesSécurisantes["media.getusermedia.screensharing.allowed_domains"]);

    // Disable IPv6:
    // Some texts on why IPv6 is no good for privacy:
    // https://www.defcon.org/images/defcon-15/dc15-presentations/Lindqvist/Whitepaper/dc-15-lindqvist-WP.pdf
    // https://iapp.org/news/a/2011-09-09-facing-the-privacy-implications-of-ipv6
    // https://www.christopher-parsons.com/ipv6-and-the-future-of-privacy/
    // http://www.zdnet.com/article/security-versus-privacy-with-ipv6-deployment/
    prefsReseau.setBoolPref("dns.disableIPv6", préférencesSécurisantes["network.dns.disableIPv6"]);
    // http://knowipv6.digitalelement.com/?p=66
    prefsReseau.setBoolPref("http.fast-fallback-to-IPv4", préférencesSécurisantes["network.http.fast-fallback-to-IPv4"]);


    // Disable sending HTML5 pings:
    prefsNavigateur.setBoolPref("send_pings", préférencesSécurisantes["browser.send_pings"]); // http://kb.mozillazine.org/Browser.send_pings
    prefsNavigateur.setBoolPref("send_pings.require_same_host", préférencesSécurisantes["browser.send_pings.require_same_host"]); // http://kb.mozillazine.org/Browser.send_pings.require_same_host

    // Disable DNS proxy bypass:
    // https://superuser.com/questions/103593/how-to-do-dns-through-a-proxy-in-firefox
    // https://bugzilla.mozilla.org/show_bug.cgi?id=134105
    prefsReseau.setBoolPref("proxy.socks_remote_dns", préférencesSécurisantes["network.proxy.socks_remote_dns"]); // http://kb.mozillazine.org/Network.proxy.socks_remote_dns

    // Disable DNS prefetching:
    // http://www.ghacks.net/2013/04/27/firefox-prefetching-what-you-need-to-know/
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Controlling_DNS_prefetching
    prefsReseau.setBoolPref("dns.disablePrefetch", préférencesSécurisantes["network.dns.disablePrefetch"]);
    prefsReseau.setBoolPref("dns.disablePrefetchFromHTTPS", préférencesSécurisantes["network.dns.disablePrefetchFromHTTPS"]);

    // Disable link prefetching:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ
    prefsReseau.setBoolPref("prefetch-next",préférencesSécurisantes["network.prefetch-next"]);

    // Don't connect to remote links on hover:
    // http://news.slashdot.org/story/15/08/14/2321202/how-to-quash-firefoxs-silent-requests
    // https://support.mozilla.org/en-US/kb/how-stop-firefox-making-automatic-connections#w_speculative-pre-connections
    prefsReseau.setIntPref("http.speculative-parallel-limit", préférencesSécurisantes["network.http.speculative-parallel-limit"]);

    // Enable tracking protection:
    // Shady advertisers won't honor these settings, so make sure you use Privacy Badger, Disconnect, or similar addons.
    prefsViePrivee.setBoolPref("donottrackheader.enabled", préférencesSécurisantes["privacy.donottrackheader.enabled"]);
    prefsViePrivee.setBoolPref("donottrackheader.value", préférencesSécurisantes["privacy.donottrackheader.value"]);
    prefsViePrivee.setBoolPref("trackingprotection.enabled", préférencesSécurisantes["privacy.trackingprotection.enabled"]);

    // Show Punycode for international domain names, prevent some phishing attempts:
    // http://kb.mozillazine.org/Network.IDN_show_punycode
    prefsReseau.setBoolPref("IDN_show_punycode", préférencesSécurisantes["network.IDN_show_punycode"]);

    // Prevent sites from sniffing clipboard content:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/Preference_reference/dom.event.clipboardevents.enabled
    prefsDOM.setBoolPref("event.clipboardevents.enabled", préférencesSécurisantes["dom.event.clipboardevents.enabled"]);

    // Disable geolocation:
    // Don't do this on mobile browsers if you want Google Maps or similar to know your location.
    prefsGeographiques.setBoolPref("enabled", préférencesSécurisantes["geo.enabled"]);
    prefsGeographiques.setCharPref("wifi.uri", préférencesSécurisantes["geo.wifi.uri"]);

    // Disable geotargeting:
    prefsNavigateur.setBoolPref("search.geoSpecificDefaults", préférencesSécurisantes["browser.search.geoSpecificDefaults"]);
    prefsNavigateur.setCharPref("search.geoSpecificDefaults.url", préférencesSécurisantes["browser.search.geoSpecificDefaults.url"]);
    prefsNavigateur.setCharPref("search.geoip.url", préférencesSécurisantes["browser.search.geoip.url"]);

    // Disable crash reporting:
    prefsPlantage.setCharPref("reportURL", préférencesSécurisantes["breakpad.reportURL"]); // http://kb.mozillazine.org/Breakpad.reportURL

// Disable telemetry:
    // https://gecko.readthedocs.org/en/latest/toolkit/components/telemetry/telemetry/preferences.html
    prefsOutils.setBoolPref("telemetry.archive.enabled", préférencesSécurisantes["toolkit.telemetry.archive.enabled"]);
    prefsOutils.setCharPref("telemetry.cachedClientID", préférencesSécurisantes["toolkit.telemetry.cachedClientID"]);
    prefsOutils.setBoolPref("telemetry.enabled", préférencesSécurisantes["toolkit.telemetry.enabled"]); // This alone does *not* disable telemetry
    prefsOutils.setCharPref("telemetry.previousBuildID", préférencesSécurisantes["toolkit.telemetry.previousBuildID"]);
    prefsOutils.setCharPref("telemetry.server", préférencesSécurisantes["toolkit.telemetry.server"]);
    prefsOutils.setBoolPref("telemetry.unified", préférencesSécurisantes["toolkit.telemetry.unified"]); // This turns off telemetry completely, in combination with the above

// Disable health report:
    // https://gecko.readthedocs.org/en/latest/services/healthreport/healthreport/index.html#legal-and-privacy-concerns
    prefsRapports.setCharPref("healthreport.about.reportUrl", préférencesSécurisantes["datareporting.healthreport.about.reportUrl"]);
    prefsRapports.setCharPref("healthreport.about.reportUrlUnified", préférencesSécurisantes["datareporting.healthreport.about.reportUrlUnified"]);
    prefsRapports.setCharPref("healthreport.documentServerURI", préférencesSécurisantes["datareporting.healthreport.documentServerURI"]);
    prefsRapports.setCharPref("healthreport.infoURL", préférencesSécurisantes["datareporting.healthreport.infoURL"]);
    prefsRapports.setBoolPref("healthreport.logging.consoleEnabled", préférencesSécurisantes["datareporting.healthreport.logging.consoleEnabled"]);
    prefsRapports.setBoolPref("healthreport.service.enabled", préférencesSécurisantes["datareporting.healthreport.service.enabled"]);
    prefsRapports.setBoolPref("healthreport.uploadEnabled", préférencesSécurisantes["datareporting.healthreport.uploadEnabled"]);
    prefsRapports.setBoolPref("policy.dataSubmissionEnabled", préférencesSécurisantes["datareporting.policy.dataSubmissionEnabled"]);
    prefsRapports.setBoolPref("policy.dataSubmissionEnabled.v2", préférencesSécurisantes["datareporting.policy.dataSubmissionEnabled.v2"]);

// Disable "Heartbeat":
    // https://wiki.mozilla.org/Advocacy/heartbeat
    prefsNavigateur.setCharPref("selfsupport.url", préférencesSécurisantes["browser.selfsupport.url"]);

// Disable "safe browsing" (aka. Google tracking/logging/phone-home)
    // Preferences since FF43:
    prefsNavigateur.setBoolPref("safebrowsing.downloads.enabled", préférencesSécurisantes["browser.safebrowsing.downloads.enabled"]);
    prefsNavigateur.setBoolPref("safebrowsing.downloads.remote.enabled", préférencesSécurisantes["browser.safebrowsing.downloads.remote.enabled"]);
    prefsNavigateur.setBoolPref("safebrowsing.enabled", préférencesSécurisantes["browser.safebrowsing.enabled"]);
    prefsServices.setBoolPref("sync.prefs.sync.browser.safebrowsing.enabled", préférencesSécurisantes["services.sync.prefs.sync.browser.safebrowsing.enabled"]);
    prefsNavigateur.setBoolPref("safebrowsing.malware.enabled", préférencesSécurisantes["browser.safebrowsing.malware.enabled"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.google.appRepURL", préférencesSécurisantes["browser.safebrowsing.provider.google.appRepURL"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.google.gethashURL", préférencesSécurisantes["browser.safebrowsing.provider.google.gethashURL"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.google.lists", préférencesSécurisantes["browser.safebrowsing.provider.google.lists"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.google.reportURL", préférencesSécurisantes["browser.safebrowsing.provider.google.reportURL"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.google.updateURL", préférencesSécurisantes["browser.safebrowsing.provider.google.updateURL"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.mozilla.gethashURL", préférencesSécurisantes["browser.safebrowsing.provider.mozilla.gethashURL"]);
    prefsNavigateur.setCharPref("safebrowsing.provider.mozilla.updateURL", préférencesSécurisantes["browser.safebrowsing.provider.mozilla.updateURL"]);
    prefsNavigateur.setCharPref("safebrowsing.reportMalwareMistakeURL", préférencesSécurisantes["browser.safebrowsing.reportMalwareMistakeURL"]);
    prefsNavigateur.setCharPref("safebrowsing.reportPhishMistakeURL", préférencesSécurisantes["browser.safebrowsing.reportPhishMistakeURL"]);
    prefsNavigateur.setCharPref("safebrowsing.reportPhishURL", préférencesSécurisantes["browser.safebrowsing.reportPhishURL"]);

// Disable WebGL:
    // http://www.contextis.com/resources/blog/webgl-new-dimension-browser-exploitation/
    // https://security.stackexchange.com/questions/13799/is-webgl-a-security-concern
    // However, this appears to breaks some sites, such as Tweetdeck/Twitter
    // user_pref("webgl.disabled", true);
    // user_pref("webgl.disable-extensions", true);

// Disable HTML5 video stats:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=654550
    prefsMedia.setBoolPref("video_stats.enabled", préférencesSécurisantes["media.video_stats.enabled"]);

// Disable support for asm.js (http://asmjs.org/):
    // https://www.mozilla.org/en-US/security/advisories/mfsa2015-29/
    // https://www.mozilla.org/en-US/security/advisories/mfsa2015-50/
    // https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-2712
    prefsJavascript.setBoolPref("options.asmjs", préférencesSécurisantes["javascript.options.asmjs"]);

// Disable rendering of SVG OpenType fonts:
    // https://wiki.mozilla.org/SVGOpenTypeFonts
    // https://github.com/iSECPartners/publications/blob/master/presentations/SVG_Security-rdegraaf-bh_us_2014.pdf
    prefsGFX.setBoolPref("font_rendering.opentype_svg.enabled", préférencesSécurisantes["gfx.font_rendering.opentype_svg.enabled"]);

// ----------------------------------------------------
// THE WHOLE BROKEN CA / SSL / TLS / OCSP / CIPHER MESS
// ----------------------------------------------------

// Browser test sites:
    // https://www.ssllabs.com/ssltest/viewMyClient.html
    // https://www.howsmyssl.com/
    // https://badssl.com/

// Block mixed content:
    prefsSecurite.setBoolPref("mixed_content.block_active_content", préférencesSécurisantes["security.mixed_content.block_active_content"]); // (eg. insecure CSS or JS on a HTTPS page - this is enabled by default)
    prefsSecurite.setBoolPref("mixed_content.block_display_content", préférencesSécurisantes["security.mixed_content.block_display_content"]); // ("passive" content - eg. insecure images on a HTTPS page)

// Enforce public key pinning for CAs
    // https://wiki.mozilla.org/SecurityEngineering/Public_Key_Pinning
    prefsSecurite.setIntPref("cert_pinning.enforcement_level", préférencesSécurisantes["security.cert_pinning.enforcement_level"]);

// General SSL/TLS preferences:
    prefsSecurite.setBoolPref("ssl.errorReporting.enabled", préférencesSécurisantes["security.ssl.errorReporting.enabled"]); // https://gecko.readthedocs.org/en/latest/browser/base/sslerrorreport/preferences.html
    prefsSecurite.setBoolPref("ssl.treat_unsafe_negotiation_as_broken", préférencesSécurisantes["security.ssl.treat_unsafe_negotiation_as_broken"]); // https://wiki.mozilla.org/Security:Renegotiation#security.ssl.treat_unsafe_negotiation_as_broken
    prefsSecurite.setBoolPref("tls.unrestricted_rc4_fallback", préférencesSécurisantes["security.tls.unrestricted_rc4_fallback"]); // No thanks, I'd rather fall back to ROT13...

// Cipher suites:
    // Copied from https://github.com/pyllyukko/user.js/blob/master/user.js - possibly outdated information.
    // Cipher suites not present by default in FF43 are omitted. Apparently they aren't supported anyways, according to tests.
    prefsSecurite.setBoolPref("ssl3.dhe_rsa_aes_128_sha", préférencesSécurisantes["security.ssl3.dhe_rsa_aes_128_sha"]);
    prefsSecurite.setBoolPref("ssl3.dhe_rsa_aes_256_sha", préférencesSécurisantes["security.ssl3.dhe_rsa_aes_256_sha"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_ecdsa_aes_128_gcm_sha256", préférencesSécurisantes["security.ssl3.ecdhe_ecdsa_aes_128_gcm_sha256"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_ecdsa_aes_128_sha", préférencesSécurisantes["security.ssl3.ecdhe_ecdsa_aes_128_sha"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_ecdsa_aes_256_sha", préférencesSécurisantes["security.ssl3.ecdhe_ecdsa_aes_256_sha"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_ecdsa_rc4_128_sha", préférencesSécurisantes["security.ssl3.ecdhe_ecdsa_rc4_128_sha"]); // About RC4 handling: https://developer.mozilla.org/en-US/Firefox/Releases/38#Security
    prefsSecurite.setBoolPref("ssl3.ecdhe_rsa_aes_128_gcm_sha256", préférencesSécurisantes["security.ssl3.ecdhe_rsa_aes_128_gcm_sha256"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_rsa_aes_128_sha", préférencesSécurisantes["security.ssl3.ecdhe_rsa_aes_128_sha"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_rsa_aes_256_sha", préférencesSécurisantes["security.ssl3.ecdhe_rsa_aes_256_sha"]);
    prefsSecurite.setBoolPref("ssl3.ecdhe_rsa_rc4_128_sha", préférencesSécurisantes["security.ssl3.ecdhe_rsa_rc4_128_sha"]);
    prefsSecurite.setBoolPref("ssl3.rsa_aes_128_sha", préférencesSécurisantes["security.ssl3.rsa_aes_128_sha"]);
    prefsSecurite.setBoolPref("ssl3.rsa_aes_256_sha", préférencesSécurisantes["security.ssl3.rsa_aes_256_sha"]);
    prefsSecurite.setBoolPref("ssl3.rsa_des_ede3_sha", préférencesSécurisantes["security.ssl3.rsa_des_ede3_sha"]);
    prefsSecurite.setBoolPref("ssl3.rsa_rc4_128_md5", préférencesSécurisantes["security.ssl3.rsa_rc4_128_md5"]);
    prefsSecurite.setBoolPref("ssl3.rsa_rc4_128_sha", préférencesSécurisantes["security.ssl3.rsa_rc4_128_sha"]);

// Reject SHA1 certs
    // https://bugzilla.mozilla.org/show_bug.cgi?id=942515#c32
    // http://www.scmagazine.com/mozilla-pulls-back-on-rejecting-sha-1-certs-outright/article/463913/
    prefsSecurite.setIntPref("pki.sha1_enforcement_level", préférencesSécurisantes["security.pki.sha1_enforcement_level"]);

// ----------------------------------------------------
// APPEARANCE / UI / UX
// ----------------------------------------------------

// Show full URLs in the address bar (including "http://"):
    prefsNavigateur.setBoolPref("urlbar.trimURLs", préférencesSécurisantes["browser.urlbar.trimURLs"]);

// Get rid of the useless/redundant "Visit (site)" and "(keyword) - search with (engine)" dropdown in the URL bar (since FF43):
    prefsNavigateur.setBoolPref("urlbar.unifiedcomplete", préférencesSécurisantes["browser.urlbar.unifiedcomplete"]);

// Revert to old search bar layout - drop-down list instead of icons:
    // This choice was removed in FF43 - use the Classic Theme Restorer addon if you want it back.
// user_pref("browser.search.showOneOffButtons", false);

// Load searches from right-click context menu in background tab:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/Preference_reference/browser.search.context.loadInBackground
    prefsNavigateur.setBoolPref("search.context.loadInBackground", préférencesSécurisantes["browser.search.context.loadInBackground"]);

// Remove "(site) is now fullscreen" nag message:
    // If you fear this might "facilitate phishing", you might not want to be on the internet at all.
    // Before FF43:
// user_pref("full-screen-api.approval-required", false);
    // Since FF43:
    prefsPleinEcran.setIntPref("warning.delay", préférencesSécurisantes["full-screen-api.warning.delay"]);
    prefsPleinEcran.setIntPref("warning.timeout", préférencesSécurisantes["full-screen-api.warning.timeout"]);

// Disable fullscreen URL bar animation:
    prefsNavigateur.setBoolPref("fullscreen.animate", préférencesSécurisantes["browser.fullscreen.animate"]);

// Disable tab animation:
    // http://www.askvg.com/how-to-disable-animation-while-opening-new-tab-in-mozilla-firefox-4-0/
    prefsNavigateur.setBoolPref("tabs.animate", préférencesSécurisantes["browser.tabs.animate"]);

// Don't warn on closing tabs:
    //user_pref("browser.tabs.warnOnClose", false);
    prefsNavigateur.setBoolPref("tabs.warnOnCloseOtherTabs", préférencesSécurisantes["browser.tabs.warnOnCloseOtherTabs"]);

// Don't warn on opening about:config:
    prefsGénérales.setBoolPref("warnOnAboutConfig", préférencesSécurisantes["general.warnOnAboutConfig"]);

// Get rid of "Do you really want to leave this site?" popups:
    // https://support.mozilla.org/en-US/questions/1043508
    prefsDOM.setBoolPref("disable_beforeunload", préférencesSécurisantes["dom.disable_beforeunload"]);

// Prevent sites from disabling the default right-click menu:
    prefsDOM.setBoolPref("event.contextmenu.enabled", préférencesSécurisantes["dom.event.contextmenu.enabled"]);

// Prevent sites/popups from messing with certain UI elements:
    // http://kb.mozillazine.org/Prevent_websites_from_disabling_new_window_features
    prefsDOM.setBoolPref("disable_window_open_feature.location", préférencesSécurisantes["dom.disable_window_open_feature.location"]); // Always show the URL bar
    prefsDOM.setBoolPref("disable_window_open_feature.resizable", préférencesSécurisantes["dom.disable_window_open_feature.resizable"]); // Allow to resize the window
    prefsDOM.setBoolPref("disable_window_open_feature.status", préférencesSécurisantes["dom.disable_window_open_feature.status"]); // Always show the status bar

// De-crap new tab page, get rid of "directory tiles" ads:
    // http://thenextweb.com/apps/2014/08/28/mozilla-rolls-sponsored-tiles-firefox-nightlys-new-tab-page/
    prefsNavigateur.setBoolPref("newtab.preload", préférencesSécurisantes["browser.newtab.preload"]);
    prefsNavigateur.setCharPref("newtab.url", préférencesSécurisantes["browser.newtab.url"]);
    prefsNavigateur.setCharPref("newtabpage.directory.ping", préférencesSécurisantes["browser.newtabpage.directory.ping"]);
    prefsNavigateur.setCharPref("newtabpage.directory.source", préférencesSécurisantes["browser.newtabpage.directory.source"]);
    prefsNavigateur.setBoolPref("newtabpage.enabled", préférencesSécurisantes["browser.newtabpage.enabled"]);
    prefsNavigateur.setBoolPref("newtabpage.enhanced", préférencesSécurisantes["browser.newtabpage.enhanced"]);
    prefsNavigateur.setBoolPref("newtabpage.introShown", préférencesSécurisantes["browser.newtabpage.introShown"]);

// Disable (broken) auto-scrolling via middle-click:
    prefsGénérales.setBoolPref("autoScroll", préférencesSécurisantes["general.autoScroll"]);

// Start searching while typing:
    //user_pref("accessibility.typeaheadfind", true); // http://kb.mozillazine.org/Accessibility.typeaheadfind
    //user_pref("accessibility.typeaheadfind.flashBar", 0); // http://kb.mozillazine.org/Accessibility.typeaheadfind.flashBar

// Better legible default fonts (for Windows, at least - might require ttf-mscorefonts on *nix):
    // As an alternative, the free Ubuntu and Droid font families are pretty good as well.
// user_pref("font.name.monospace.x-unicode", "Lucida Console");
// user_pref("font.name.monospace.x-western", "Lucida Console");
// user_pref("font.name.sans-serif.x-unicode", "Segoe UI");
// user_pref("font.name.sans-serif.x-western", "Segoe UI");
// user_pref("font.name.serif.x-unicode", "Georgia");
// user_pref("font.name.serif.x-western", "Georgia");

// ----------------------------------------------------
// ADDONS / PLUGINS
// ----------------------------------------------------

// Install unsigned addons in Aurora/Dev-Edition/etc:
    // Ironically, this was needed for security-enhancing addons like Privacy Badger, HTTPS Everywhere, etc.
    // Don't be stupid and install just any random unsigned addon.
    //user_pref("xpinstall.signatures.required", false);

// Speed up security delay when installing add-ons:
    prefsSecurite.setIntPref("dialog_enable_delay", préférencesSécurisantes["security.dialog_enable_delay"]);

// If installed - ask to activate Flash. If not - don't nag about missing Flash plugin:
    //user_pref("plugin.state.flash", 1);
    prefsModules.setBoolPref("notifyMissingFlash", préférencesSécurisantes["plugins.notifyMissingFlash"]);

// Disable metadata check phone-home:
    // https://wiki.mozilla.org/Extension_Manager:Update_Checking
    prefsExtension.setBoolPref("getAddons.cache.enabled", préférencesSécurisantes["extensions.getAddons.cache.enabled"]);

// ----------------------------------------------------
// BLOATWARE / UNWANTED "FEATURES"
// ----------------------------------------------------

// Disable EME, Adobe "Primetime Content Decryption Module" DRM malware:
    // http://techdows.com/2015/04/how-to-uninstall-or-remove-adobe-primetime-decryption-module-plugin-from-firefox-38.html
    // Additionally, you might want to delete all traces of "gmp-eme" from your Firefox profile folder.
    // Or simply use "EME-free" builds of Firefox (Windows only): https://ftp.mozilla.org/pub/firefox/releases/latest/win32-EME-free/en-US/
    prefsMedia.setBoolPref("gmp-eme-adobe.autoupdate", préférencesSécurisantes["media.gmp-eme-adobe.autoupdate"]);
    prefsMedia.setBoolPref("gmp-eme-adobe.enabled", préférencesSécurisantes["media.gmp-eme-adobe.enabled"]);
    prefsMedia.setBoolPref("eme.apiVisible", préférencesSécurisantes["media.eme.apiVisible"]);
    prefsMedia.setBoolPref("eme.enabled", préférencesSécurisantes["media.eme.enabled"]);
    prefsNavigateur.setBoolPref("eme.ui.enabled", préférencesSécurisantes["browser.eme.ui.enabled"]);

// Disable "Firefox Hello" TokBox/Telefonica WebRTC PUP:
    // https://www.mozilla.org/en-US/privacy/firefox-hello/
    // https://security.stackexchange.com/questions/94284/how-secure-is-firefox-hello
    prefsBoucleLocale.setCharPref("CSP", préférencesSécurisantes["loop.CSP"]);
    prefsBoucleLocale.setBoolPref("enabled", préférencesSécurisantes["loop.enabled"]);
    prefsBoucleLocale.setCharPref("feedback.baseUrl", préférencesSécurisantes["loop.feedback.baseUrl"]);
    prefsBoucleLocale.setCharPref("oauth.google.scope", préférencesSécurisantes["loop.oauth.google.scope"]); // What's Google doing in there as well?
    prefsBoucleLocale.setCharPref("server", préférencesSécurisantes["loop.server"]);

// Disable "Pocket" bloatware:
    // http://venturebeat.com/2015/06/09/mozilla-responds-to-firefox-user-backlash-over-pocket-integration/
    // https://www.gnu.gl/blog/Posts/multiple-vulnerabilities-in-pocket/
    prefsNavigateur.setCharPref("pocket.api", préférencesSécurisantes["browser.pocket.api"]);
    prefsNavigateur.setBoolPref("pocket.enabled", préférencesSécurisantes["browser.pocket.enabled"]);
    prefsNavigateur.setCharPref("pocket.oAuthConsumerKey", préférencesSécurisantes["browser.pocket.oAuthConsumerKey"]);
    prefsNavigateur.setCharPref("pocket.site", préférencesSécurisantes["browser.pocket.site"]);

// Disable "social" crap:
    // http://www.ghacks.net/2013/04/10/mozilla-adds-cliqz-msnnow-and-mixi-as-social-providers-to-firefox/
    prefsReseauSocial.setCharPref("directories", préférencesSécurisantes["social.directories"]);
    prefsReseauSocial.setBoolPref("remote-install.enabled", préférencesSécurisantes["social.remote-install.enabled"]);
    prefsReseauSocial.setBoolPref("share.activationPanelEnabled", préférencesSécurisantes["social.share.activationPanelEnabled"]);
    prefsReseauSocial.setCharPref("shareDirectory", préférencesSécurisantes["social.shareDirectory"]);
    prefsReseauSocial.setBoolPref("toast-notifications.enabled", préférencesSécurisantes["social.toast-notifications.enabled"]);
    prefsReseauSocial.setCharPref("whitelist", préférencesSécurisantes["social.whitelist"]);

// Disable "Reader Mode":
    prefsLiseuse.setBoolPref("parse-on-load.enabled", préférencesSécurisantes["reader.parse-on-load.enabled"]);

// Disable integrated PDF reader:
    // https://blog.mozilla.org/security/2015/08/06/firefox-exploit-found-in-the-wild/
    // If you're going to use an external PDF reader, *don't* use Adobe PDF bloatware. Use a sane reader, such as SumatraPDF.
    prefsPdfJS.setBoolPref("disabled", préférencesSécurisantes["pdfjs.disabled"]);
    // If you're gonna stick with pdfjs, at least disable its WebGL attack surface:
    prefsPdfJS.setBoolPref("enableWebGL", préférencesSécurisantes["pdfjs.enableWebGL"]);

// Disable various useless and/or intrusive web APIs:
    // https://support.mozilla.org/en-US/kb/how-stop-firefox-making-automatic-connections
    prefsBeacon.setBoolPref("enabled", préférencesSécurisantes["beacon.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/navigator.sendBeacon
    prefsMatériel.setBoolPref("sensors.enabled", préférencesSécurisantes["device.sensors.enabled"]); // https://wiki.mozilla.org/Sensor_API
    prefsDOM.setBoolPref("battery.enabled", préférencesSécurisantes["dom.battery.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/BatteryManager
    prefsDOM.setBoolPref("cellbroadcast.enabled", préférencesSécurisantes["dom.cellbroadcast.enabled"]);
    prefsDOM.setBoolPref("enable_performance", préférencesSécurisantes["dom.enable_performance"]); // https://wiki.mozilla.org/Security/Reviews/Firefox/NavigationTimingAPI
    prefsDOM.setBoolPref("gamepad.enabled", préférencesSécurisantes["dom.gamepad.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
    prefsDOM.setBoolPref("netinfo.enabled", préférencesSécurisantes["dom.netinfo.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
    prefsDOM.setBoolPref("telephony.enabled", préférencesSécurisantes["dom.telephony.enabled"]); // https://wiki.mozilla.org/WebAPI/Security/WebTelephony
    prefsDOM.setBoolPref("vibrator.enabled", préférencesSécurisantes["dom.vibrator.enabled"]);
    prefsDOM.setBoolPref("vr.enabled", préférencesSécurisantes["dom.vr.enabled"]); // https://developer.mozilla.org/en-US/Firefox/Releases/36#Interfaces.2FAPIs.2FDOM
    prefsDOM.setBoolPref("vr.oculus.enabled", préférencesSécurisantes["dom.vr.oculus.enabled"]);
    prefsDOM.setBoolPref("vr.oculus050.enabled", préférencesSécurisantes["dom.vr.oculus050.enabled"]);
    prefsDOM.setBoolPref("webnotifications.enabled", préférencesSécurisantes["dom.webnotifications.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/notification
    prefsDOM.setBoolPref("webnotifications.serviceworker.enabled", préférencesSécurisantes["dom.webnotifications.serviceworker.enabled"]); // https://developer.mozilla.org/en-US/docs/Web/API/notification
    prefsMedia.setBoolPref("webspeech.recognition.enable", préférencesSécurisantes["media.webspeech.recognition.enable"]); // https://wiki.mozilla.org/HTML5_Speech_API

// Remove default feed content handlers:
    // http://kb.mozillazine.org/Browser.contentHandlers.types.*.uri
    // Yahoo RSS handler:
    prefsNavigateur.setCharPref("contentHandlers.types.0.title", préférencesSécurisantes["browser.contentHandlers.types.0.title"]);
    prefsNavigateur.setCharPref("contentHandlers.types.0.type", préférencesSécurisantes["browser.contentHandlers.types.0.type"]);
    prefsNavigateur.setCharPref("contentHandlers.types.0.uri", préférencesSécurisantes["browser.contentHandlers.types.0.uri"]);

// Remove default website protocol handlers:
    // http://kb.mozillazine.org/Gecko.handlerService.schemes.%28protocol%29.*.uriTemplate
    // Mibbit:
    prefsGecko.setCharPref("handlerService.schemes.irc.0.name", préférencesSécurisantes["gecko.handlerService.schemes.irc.0.name"]);
    prefsGecko.setCharPref("handlerService.schemes.irc.0.uriTemplate", préférencesSécurisantes["gecko.handlerService.schemes.irc.0.uriTemplate"]);
    prefsGecko.setCharPref("handlerService.schemes.ircs.0.name", préférencesSécurisantes["gecko.handlerService.schemes.ircs.0.name"]);
    prefsGecko.setCharPref("handlerService.schemes.ircs.0.uriTemplate", préférencesSécurisantes["gecko.handlerService.schemes.ircs.0.uriTemplate"]);
    // Yahoo Mail:
    prefsGecko.setCharPref("handlerService.schemes.mailto.0.name", préférencesSécurisantes["gecko.handlerService.schemes.mailto.0.name"]);
    prefsGecko.setCharPref("handlerService.schemes.mailto.0.uriTemplate", préférencesSécurisantes["gecko.handlerService.schemes.mailto.0.uriTemplate"]);
    // Gmail:
    prefsGecko.setCharPref("handlerService.schemes.mailto.1.name", préférencesSécurisantes["gecko.handlerService.schemes.mailto.1.name"]);
    prefsGecko.setCharPref("handlerService.schemes.mailto.1.uriTemplate", préférencesSécurisantes["gecko.handlerService.schemes.mailto.1.uriTemplate"]);
    // 30 Boxes:
    prefsGecko.setCharPref("handlerService.schemes.webcal.0.name", préférencesSécurisantes["gecko.handlerService.schemes.webcal.0.name"]);
    prefsGecko.setCharPref("handlerService.schemes.webcal.0.uriTemplate", préférencesSécurisantes["gecko.handlerService.schemes.webcal.0.uriTemplate"]);

// Disable "Snippets" (Mozilla content shown on about:home screen):
    // https://support.mozilla.org/en-US/kb/how-stop-firefox-making-automatic-connections#w_mozilla-content
    prefsNavigateur.setCharPref("aboutHomeSnippets.updateUrl", préférencesSécurisantes["browser.aboutHomeSnippets.updateUrl"]);

// ----------------------------------------------------
// NEEDS MORE RESEARCH
// ----------------------------------------------------

// FF45 disables .onion DNS lookup (for good reason). Probably shouldn't be re-enabled:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1228457
// user_pref("network.dns.blockDotOnion", true);

// Web push:
    // https://en.wikipedia.org/wiki/Push_technology
    // https://unicorn-wg.github.io/webpush-protocol/
    // https://www.ietf.org/mail-archive/web/webpush/current/threads.html#00182
    prefsDOM.setBoolPref("push.connection.enabled", préférencesSécurisantes["dom.push.connection.enabled"]);
    prefsDOM.setBoolPref("push.enabled", préférencesSécurisantes["dom.push.enabled"]);
    prefsDOM.setCharPref("push.serverURL", préférencesSécurisantes["dom.push.serverURL"]);
    prefsDOM.setBoolPref("push.udp.wakeupEnabled", préférencesSécurisantes["dom.push.udp.wakeupEnabled"]);
    prefsDOM.setCharPref("push.userAgentID", préférencesSécurisantes["dom.push.userAgentID"]);

    prefsDOM.setBoolPref("storage.enabled", préférencesSécurisantes["dom.storage.enabled"]);

// SPDY:
    // https://en.wikipedia.org/wiki/SPDY
    // https://security.stackexchange.com/questions/29632/what-should-i-know-about-spdy-before-enabling-it
    // http://readwrite.com/2012/04/19/what-web-users-need-to-know-ab
    prefsReseau.setBoolPref("http.spdy.allow-push", préférencesSécurisantes["network.http.spdy.allow-push"]);
    prefsReseau.setBoolPref("http.spdy.enabled", préférencesSécurisantes["network.http.spdy.enabled"]);
    prefsReseau.setBoolPref("http.spdy.enabled.deps", préférencesSécurisantes["network.http.spdy.enabled.deps"]);
    prefsReseau.setBoolPref("http.spdy.enabled.http2", préférencesSécurisantes["network.http.spdy.enabled.http2"]);
    prefsReseau.setBoolPref("http.spdy.enabled.v3-1", préférencesSécurisantes["network.http.spdy.enabled.v3-1"]);

// Improve the abysmal performance of Firefox - without using e10s.
    // Unfortunately, very few addons are compatible with e10s at the moment: http://arewee10syet.com/
    // https://wiki.mozilla.org/Electrolysis
    // Not working for me: CM Send Link, Disconnect (?),

// So, reluctantly disabling e10s for now? This will "fix" addon compatibilty, but break image drag & drop on many sites:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1147156
    // https://bugzilla.mozilla.org/show_bug.cgi?id=960783
// user_pref("browser.tabs.remote.autostart", false); // default setting (in FF43/44)
// user_pref("browser.tabs.remote.autostart.1", false); // default setting (in FF43/44)
// user_pref("browser.tabs.remote.autostart.2", false); // This breaks image drag & drop on many sites! (in FF43/44)

// Improve the abysmal Javascript/AJAX performance.
    // I'm not talking about meaningless synthetic benchmark results here.
    // As seen in reality, on sites like Tweetdeck - which barely works in Firefox, compared to Vivaldi, Chromium, or even IE11.
    // Most info found is outdated, the prefs don't exist anymore (eg. javascript.options.methodjit), or there is contradictory evidence about their usefulness.
};
