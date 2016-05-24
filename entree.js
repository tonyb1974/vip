var pageMod = require('sdk/page-mod');
var Request = require("sdk/request").Request;
var events = require("sdk/system/events");
var data = require('sdk/self').data;
var { Hotkey } = require("sdk/hotkeys");
var notifications = require("sdk/notifications");
var patronLocalhost1 = new RegExp('\w*[\:]{0,1}[\/]{0,2}localhost');
var patronLocalhost2 = new RegExp('\w*[\:]{0,1}[\/]{0,2}127\.0\.0\.1');
var patronReseauLocal = new RegExp('\w*[\:]{0,1}[\/]{0,2}192\.168\..*');
var sécurisation = require('profilSecurite/securisation');
var modeSimple = true; //Par défaut, utilises le local Storage plutôt qu'Elasticsearch...
var filtreActif = true //Par défaut, le module filtre les domaines qui ne sont pas dans la liste blanche
var jquery = 'jquery-2.2.4.min.js';

const tabs = require("sdk/tabs");

var {Cc, Ci, Cu} = require('chrome');
var dnsService = Cc["@mozilla.org/network/dns-service;1"].createInstance(Ci.nsIDNSService);
var thread = Cc["@mozilla.org/thread-manager;1"].getService(Ci.nsIThreadManager).currentThread;

var windows = require("sdk/windows").browserWindows;

var context = {
    hoteDemandé: '', //l'hôte principal demandé lors du chargement de la page.
    descriptionHote: '',
    domainesAutorises: [],
    domainesRefusés: [],
    urlVisitée: '',
    idCorrellation: new Date().getTime()
};

// add a listener to the 'open' event
windows.on('open', function(window) {
    console.info('New Window');
});
windows.on('activate', function(window) {
    console.info('New activation for Window');
});
/*webProgressListener*/

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var myListener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
        "nsISupportsWeakReference"]),

    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {
        console.info('status changed');
    },

    onLocationChange: function(aProgress, aRequest, aURI, aFlag) {
        console.info(' =======> Nouvelle URI :', aURI.spec);
    },

    // For definitions of the remaining functions see related documentation
    onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {},
    onSecurityChange: function(aWebProgress, aRequest, aState) {}
}


var filter = Cc["@mozilla.org/appshell/component/browser-status-filter;1"]
    .createInstance(Ci.nsIWebProgress);
filter.addProgressListener(myListener, Ci.nsIWebProgress.NOTIFY_ALL);

var webProgress = Cc["@mozilla.org/docshell;1"].createInstance(Ci.nsIInterfaceRequestor)
    .getInterface(Ci.nsIWebProgress);
webProgress.addProgressListener(filter, Ci.nsIWebProgress.NOTIFY_ALL);
console.info('okkkk');

/*fin  webProgressListener*/

//Ecouter l'appel d'une page par l'utilsateur et non par le système de chargement des sous-ressources d'une page...
function listenerLoad(tab) {
    if (context.urlVisitée !== tab.url)  {
        context.urlVisitée = tab.url;
        context.idCorrellation = new Date().getTime();
    }
}

tabs.on('load', function (tab) {
    listenerLoad(tab);
});
tabs.on('ready', function (tab) {
    listenerLoad(tab);
});
tabs.on('open', function (tab) {
    listenerLoad(tab);
});
tabs.on('activate', function (tab) {
    listenerLoad(tab);
});
tabs.on('pageshow', function (tab) {
    listenerLoad(tab);
});
//Fin d'écoute utilisateur

var prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);
var prefs = prefService
    .getBranch("extensions.vip.");

try {
    prefs.getCharPref("elastic-url");
    prefs.getCharPref("regexp_hôtes_acceptés");
    var hotesAutorises = prefs.getCharPref("hôtes_acceptés");
    if (hotesAutorises) {
        context.domainesAutorises = JSON.parse(hotesAutorises).domainesAutorises;
    }
}
catch (error) {
    prefs.setCharPref("elastic-url", "http://127.0.0.1:9200");
    prefs.setCharPref("regexp_hôtes_acceptés", "\w*[\:]{0,1}[\/]{0,2}.*googlevideo.com");
    prefs.setCharPref("hôtes_acceptés", JSON.stringify({domainesAutorises:[]}));
    prefService.savePrefFile(null);
}

var elasticURL = prefs.getCharPref("elastic-url");
var tropNombreuxHotesGoogle = new RegExp(prefs.getCharPref("regexp_hôtes_acceptés"));
console.info('Elasticsearch:', elasticURL);

function nestPasUnAppelElastic(request) {
    var httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
    return (httpChannel.URI.path !== '/requetes/requete' && httpChannel.URI.path !== '/requetes/reponse' && httpChannel.URI.port !== 9200);
}

//Ecoute des réponses
function enregistrerReponse(reponse) {
    if(!modeSimple) {
        Request({
            url: elasticURL + "/requetes/reponse",
            content: JSON.stringify(reponse),
            contentType: 'application/json',
            onComplete: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerteErreurIndexation.show();
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer la réponse suivante:', reponse);
                    }
                }
            },
            anonymous: true
        }).post();
    }
}

function TracingListener() {
    this.originalListener = null;
    this.receivedData = [];   // array for incoming data.
}

TracingListener.prototype =
{
    onDataAvailable: function (request, context, inputStream, offset, count) {

        /*if (nestPasUnAppelElastic(request) === true ) {
         console.info('############################### ', request.URI.path);
         var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
         var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
         var binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);

         binaryInputStream.setInputStream(inputStream);
         storageStream.init(8192, count, null);
         binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

         // Copy received data as they come.
         var data = binaryInputStream.readBytes(count);
         console.info(data);
         this.receivedData.push(data);

         binaryOutputStream.writeBytes(data, count);

         this.originalListener.onDataAvailable(request, context,
         storageStream.newInputStream(0), offset, count);
         } else {*/
        if (!this.startTime) {
            this.startTime = new Date().getTime();
        }
        this.originalListener.onDataAvailable(request, context,
            inputStream, offset, count);

        /*}*/
    },

    onStartRequest: function (request, context) {
        this.originalListener.onStartRequest(request, context);
    },

    onStopRequest: function (request, contexteRéponse, statusCode) {
        
        var httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
        if (nestPasUnAppelElastic(httpChannel) === true && this.startTime /* i.e httpChannel.contentLength > 0*/) {
            var rep = {
                date: new Date().getTime(),
                fuseau: new Date().getTimezoneOffset(),
                idCorrellation: context.idCorrellation,
                urlVisitee: context.urlVisitée,
                methode: httpChannel.requestMethod,
                hote: getHeader(httpChannel, "host"),
                port: httpChannel.URI.port,
                chemin: httpChannel.URI.path,
                type: httpChannel.contentType,
                charset: httpChannel.contentCharset || "binaire",
                taille: httpChannel.contentLength,
                tps_chargement: (new Date().getTime() - this.startTime),
                sécurité: httpChannel.securityInfo,
                status: httpChannel.responseStatus
            };
            enregistrerReponse(rep);
        }
        this.originalListener.onStopRequest(request, context, statusCode);
    },
    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIStreamListener) ||
            aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
}
// Fin écoute réponses

//Définition d'un panneau de recherche et attachement aux touches Alt-C
var panel = require("sdk/panel").Panel({
    width: 500,
    height: 700,
    contentURL: require("sdk/self").data.url("gestionDomaines.html"),
    contentScriptFile: [data.url(jquery), data.url('jquery-ui-1.11.4/jquery-ui.js'),data.url('gestionDomaines.js')]
});

var alerteDNSVipIntrouvable = require("sdk/panel").Panel({
    width: 450,
    height: 175,
    contentURL: require("sdk/self").data.url("alerteVipBackend.html"),
    contentScriptFile: [data.url(jquery), data.url('jquery-ui-1.11.4/jquery-ui.js'), data.url("alerteVipBackend.js")]
});

var alerteErreurDNS = require("sdk/panel").Panel({
    width: 450,
    height: 110,
    contentURL: require("sdk/self").data.url("alerteErreurDNS.html"),
    contentScriptFile: [data.url(jquery), data.url('jquery-ui-1.11.4/jquery-ui.js'), data.url("alerteErreurDNS.js")]
});

var alerteErreurIndexation = require("sdk/panel").Panel({
    width: 450,
    height: 100,
    contentURL: require("sdk/self").data.url("alerteErreurIndexation.html"),
    contentScriptFile: [data.url(data.url(jquery), data.url('jquery-ui-1.11.4/jquery-ui.js'), "alerteErreurIndexation.js")]
});

panel.on("show", function () {
    //Passe la main au module gestionDomaines.js en lui envoyant le message 'show'
    panel.port.emit("show", context.domainesAutorises, context.domainesRefusés);
});

alerteDNSVipIntrouvable.on("show", function () {
    //Passe la main au module alerteVipBackend.js en lui envoyant le message 'show'
    alerteDNSVipIntrouvable.port.emit("show");
});

alerteErreurDNS.on("show", function () {
    //Passe la main au module alerteErreurDNS.js en lui envoyant le message 'show'
    alerteErreurDNS.port.emit("show", context.msg);
});

alerteErreurIndexation.on("show", function () {
    //Passe la main au module alerteErreurIndexation.js en lui envoyant le message 'show'
    alerteErreurIndexation.port.emit("show");
});

var showHotKey = Hotkey({
    combo: 'alt-c',
    onPress: function () {
        console.info('Alt-C');
        panel.show();
    }
});

var showHotKey = Hotkey({
    combo: 'alt-o',
    onPress: function () {
        if (filtreActif) {
            console.info('Alt-O: Désactivation du filtrage');
            notifications.notify({text: 'Filtrage désactivé\n\nAppuyez sur Alt-O pour réactiver le filtrage des sites.'});
            filtreActif = false;
        } else {
            console.info('Alt-O: Activation du filtrage');
            notifications.notify({text: 'Filtrage activé\n\nAppuyez sur Alt-O pour désactiver le filtrage des sites.'});
            filtreActif = true;
        }
    }
});

pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url('filtre.js'), data.url(jquery)],
    contentScriptWhen: "ready",
    onAttach: function (worker) {
        worker.port.emit("nettoyer", worker.url);
        console.info(worker.url);
        worker.port.on("hoteDemandé", function (hoteDemandé) {
            context.hoteDemandé = hoteDemandé;
        });
    }
});

pageMod.PageMod({
    include: ["*"],
    contentScriptWhen: "start",
    attachTo: ["existing", "top"],
    onAttach: function onAttach(worker) {
        listenerLoad(worker.tab);
        console.info('tab.url:', worker.tab.url);
    }
});

chercherDomaines();
chercherDomainesBannis();
sécurisation.navigationPrivee();

function getHeader(channel, header) {
    try {
        return channel.getRequestHeader(header);
    } catch (erreur) {
        return undefined;
    }
}

function corps(httpChannel) {
    var postStr = undefined;
    try {
        var uploadChannelStream = httpChannel.QueryInterface(Ci.nsIUploadChannel).uploadStream;
        if (uploadChannelStream && !(uploadChannelStream instanceof Ci.nsIMultiplexInputStream)) {
            uploadChannelStream.QueryInterface(Ci.nsISeekableStream).seek(Ci.nsISeekableStream.NS_SEEK_SET, 0);
            var stream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
            stream.setInputStream(uploadChannelStream);
            var postBytes = stream.readByteArray(stream.available());

            uploadChannelStream.QueryInterface(Ci.nsISeekableStream).seek(0, 0);

            postStr = String.fromCharCode.apply(null, postBytes);
        }
    }
    catch (e) {
        console.error("Error while reading post string from channel: ", e);
    }
    finally {
        return postStr;
    }
}

function listener(event) {
    if (filtreActif) {
        var channel = event.subject.QueryInterface(Ci.nsIHttpChannel);

        if (patronLocalhost1.exec(channel.URI.host) ||
            patronLocalhost2.exec(channel.URI.host) ||
            patronReseauLocal.exec(channel.URI.host) ||
            tropNombreuxHotesGoogle.exec(channel.URI.host)) {
            //On installe un écouteur
            var newListener = new TracingListener();
            event.subject.QueryInterface(Ci.nsITraceableChannel);
            newListener.originalListener = event.subject.setNewListener(newListener);
            accepter(channel);
            return;
        } else {
            for (var cpt in context.domainesAutorises) {
                var expressionRegulière = new RegExp("\w*[\:]{0,1}[\/]{0,2}" + context.domainesAutorises[cpt]._id);
                if (expressionRegulière.exec(channel.URI.host)) {
                    var newListener = new TracingListener();
                    event.subject.QueryInterface(Ci.nsITraceableChannel);
                    newListener.originalListener = event.subject.setNewListener(newListener);
                    accepter(channel);
                    return;
                }
            }
        }
        bloquer(channel);
    }
}

function accepter(channel) {
    journaliserRequête(channel, true);

    //Dans tous les cas, nous ne donnons pas notre user agent.
    channel.setRequestHeader("User-Agent", new Date().getTime(), false);
    channel.setRequestHeader("Referer", "", false);
    channel.setRequestHeader("Host", channel.URI.host, false);
}

function bloquer(channel) {
    channel.cancel(0x804B0002); //On annule la requête avec un NS_BINDING_ERROR
    var trouve = false;
    for (var domaine in context.domainesRefusés) {
        if (context.domainesRefusés[domaine]._id === channel.URI.host) {
            trouve = true;
            break;
        }
    }
    if (trouve === false) {
        context.descriptionHote = channel.URI.host;
        enregistrerNouveauDomaineRefusé(context.descriptionHote);
        notifications.notify({text: 'Hôte bloqué: ' + context.descriptionHote + '\n\nAppuyez sur Alt-C pour autoriser ou refuser de nouveaux domaines.\n\nAppuyez sur Alt-O pour activer ou désactiver le filtrage des sites.'});
    }

    //Pour éviter de journaliser le user-agent
    channel.setRequestHeader("User-Agent", 0, false);
    journaliserRequête(channel, false);
}

function journaliserRequête(channel, status) {
    if (!modeSimple && nestPasUnAppelElastic(channel) === true) {
        var requête = {
            date: new Date().getTime(),
            fuseau: new Date().getTimezoneOffset(),
            idCorrellation: context.idCorrellation,
            urlVisitee: context.urlVisitée,
            format: channel.URI.scheme,
            sécurité: channel.URI.securityInfo,
            methode: channel.requestMethod,
            hote: getHeader(channel, "host"),
            port: channel.URI.port,
            chemin: channel.URI.path,
            corps: corps(channel),
            referer: channel.referer,
            mode: channel.mode,
            contexte: channel.context,
            taille: Number(getHeader(channel, "Content-Length")) || -1,
            type: getHeader(channel, "Content-Type"),
            md5: getHeader(channel, "Content-MD5"),
            utilisateur: getHeader(channel, "username"),
            de: getHeader(channel, "From"),
            auth: getHeader(channel, "Authorization"),
            proxyAuth: getHeader(channel, "Proxy-Authorization"),
            origine: getHeader(channel, "Origin"),
            via: getHeader(channel, "Via"),
            accès: status
        };
        Request({
            url: elasticURL + "/requetes/requete",
            content: JSON.stringify(requête),
            contentType: 'application/json',
            onComplete: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerteErreurIndexation.show();
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer la requete:', requête);
                    }
                    return;

                }
            },
            anonymous: true
        }).post();
    }
}
events.on("http-on-modify-request", listener);

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panel.port.on("panelClosed", function () {
    panel.hide();
});

alerteDNSVipIntrouvable.port.on("alerteVipBackendFermé", function () {
    alerteDNSVipIntrouvable.hide();
});

alerteErreurDNS.port.on("alerteErreurDNSFermé", function () {
    alerteErreurDNS.hide();
});

alerteErreurIndexation.port.on("alerteErreurIndexationFermé", function () {
    alerteErreurIndexation.hide();
});

function chercherDomaines() {

    if (!modeSimple)
    {
        var recherche = {
            query: {
                match_all: {}
            },
            size: 10000
        };
        Request({
            url: elasticURL + "/domaines/_search", //A FAIRE: Remplacer par un paramètre
            content: JSON.stringify(recherche),
            contentType: 'application/json',
            onComplete: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    alerteDNSVipIntrouvable.show();
                    console.error('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
                    return;
                }
                var result = response.json;
                if (result && result.hits) {
                    context.domainesAutorises = result.hits.hits;
                }
                panel.hide();
            },
            anonymous: true
        }).post();
    } else {
        var hotesAutorises = prefs.getCharPref("hôtes_acceptés");
        if (hotesAutorises) {
            context.domainesAutorises = JSON.parse(hotesAutorises).domainesAutorises;
        }
    }
}

function chercherDomainesBannis() {
    if (!modeSimple)
    {
        var recherche = {
            query: {
                match_all: {}
            },
            size: 10000
        };
        Request({
            url: elasticURL + "/domaines_bannis/_search", //A FAIRE: Remplacer par un paramètre
            content: JSON.stringify(recherche),
            contentType: 'application/json',
            onComplete: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    alerteDNSVipIntrouvable.show();
                    console.error('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
                    return;
                }
                var result = response.json;
                if (result && result.hits) {
                    context.domainesRefusés = result.hits.hits;
                }
                panel.hide();
            },
            anonymous: true
        }).post();
    }
}

function enregistrerNouveauDomaine(hote, ip) {

    if (modeSimple) {
        var domaine = {_id: hote, _source: {ip: ip}};
        context.domainesAutorises.push(domaine);
        for (var domaineIndex in context.domainesRefusés) {
            if (context.domainesRefusés[domaineIndex]._id === hote) {
                context.domainesRefusés.splice(domaineIndex, 1);
                break;
            }
        }
    } else {
        var documentHote = {
            date: new Date().getTime(),
            fuseau: new Date().getTimezoneOffset(),
            ip: ip
        };
        Request({
            url: elasticURL + "/domaines/hote/" + hote + '?op_type=create',
            content: JSON.stringify(documentHote),
            contentType: 'application/json',
            onComplete: function (response) {
                console.info("Enregistrement hôte autorisé...", hote);
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerteErreurIndexation.show();
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine suivant:', hote, 'ip=', ip);
                    } else {
                        console.info('Document déjà autorisé:', hote);
                    }
                    return;

                } else {
                    console.info("Enregistrement ok !");
                    context.domainesAutorises.push({_id: hote, _source: {ip: ip}});
                    for (var domaineIndex in context.domainesRefusés) {
                        if (context.domainesRefusés[domaineIndex]._id === hote) {
                            context.domainesRefusés.splice(domaineIndex, 1);
                            break;
                        }
                    }
                }
            },
            anonymous: true
        }).post();
    }
}

//Le champ de recherche du panneau de gestion des domaines contient un nouveau texte
panel.port.on("hoteAjouté", function (hote, ip) {
    console.info('Recherche en cours... == >' + hote);

    var ecouteurDNS = {
        onLookupComplete: function (request, record, status) {
            if (!(status & 0x80000000) === 0) {
                context.msg = 'Impossible de se connecter au service DNS.';
                alerteErreurDNS.show();
                return;
            } else if (status === 0x804B001E || !record) {
                context.msg = 'Hôte introuvable.';
                alerteErreurDNS.show();
                return;
            }

            if (modeSimple) {
                enregistrerNouveauDomaine(hote, record.getNextAddrAsString());
                prefs.setCharPref("hôtes_acceptés", JSON.stringify({domainesAutorises: context.domainesAutorises}));
                prefService.savePrefFile(null);
            } else {

                //Supprime le domaine bannis avant d'ajouter aux hôtes autorisés
                Request({
                    url: elasticURL + "/domaines_bannis/hote/" + hote,
                    contentType: 'application/json',
                    onComplete: function (response) {
                        console.info("Suppression hôte banni...");
                        if (response.status !== 404 && (response.status < 200 || response.status >= 300)) {
                            //Echoue silencieusement
                        }
                        console.info("Suppression hôte banni ok !");
                        enregistrerNouveauDomaine(hote, record.getNextAddrAsString());
                    },
                    anonymous: true
                }).delete();
            }
        }
    };
    dnsService.asyncResolve(hote, 0, ecouteurDNS, thread);
});


function enregistrerNouveauDomaineRefusé(hote, ip) {

    if (modeSimple) {
        var domaine = {_id: hote, _source: {ip: ip}};
        context.domainesRefusés.push(domaine);
    } else {
        var documentHote = {
            date: new Date().getTime(),
            fuseau: new Date().getTimezoneOffset(),
            ip: ip || '0.0.0.0'
        };
        Request({
            url: elasticURL + "/domaines_bannis/hote/" + hote + '?op_type=create',
            content: JSON.stringify(documentHote),
            contentType: 'application/json',
            onComplete: function (response) {
                console.info("Enregistrement hôte banni...", hote);
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerteErreurIndexation.show();
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine banni suivant:', hote, 'ip:', ip);
                    } else {
                        console.error('Document déjà banni:', hote);
                    }
                    return;
                } else {
                    console.info("Enregistrement hôte banni ok !");
                    context.domainesRefusés.push({_id: hote, _source: {ip: ip}});
                }
            },
            anonymous: true
        }).post();
    }
}

panel.port.on("hoteSupprimé", function (hoteSupprimé, ip) {

    for (var domaineIndex in context.domainesAutorises) {
        if (context.domainesAutorises[domaineIndex]._id === hoteSupprimé) {
            var indexSauvegardé = domaineIndex;
            if (modeSimple) {
                enregistrerNouveauDomaineRefusé(hoteSupprimé, context.domainesAutorises[indexSauvegardé]._source.ip);
                context.domainesAutorises.splice(indexSauvegardé, 1);
                prefs.setCharPref("hôtes_acceptés", JSON.stringify({domainesAutorises: context.domainesAutorises}));
                prefService.savePrefFile(null);
            } else {
                Request({
                    url: elasticURL + "/domaines/hote/" + hoteSupprimé,
                    contentType: 'application/json',
                    onComplete: function (response) {
                        console.info("Suppression...", hoteSupprimé);
                        if (response.status !== 404 && (response.status < 200 || response.status >= 300)) { //404 ignoré
                            alerteErreurIndexation.show();
                            console.error('Erreur', response.status, response.statusText, '=> Impossible de supprimer le domaine suivant: ' + hoteSupprimé);
                            return;
                        } else {
                            console.info("Suppression ok !");
                            enregistrerNouveauDomaineRefusé(hoteSupprimé, context.domainesAutorises[indexSauvegardé]._source.ip);
                            context.domainesAutorises.splice(indexSauvegardé, 1);
                        }
                    },
                    anonymous: true
                }).delete();
            }
        }
    }
});


