var pageMod = require('sdk/page-mod');
var Request = require("sdk/request").Request;
var events = require("sdk/system/events");
var data = require('sdk/self').data;
var { Hotkey } = require("sdk/hotkeys");
var notifications = require("sdk/notifications");
var patronLocalhost1 = new RegExp('\w*[\:]{0,1}[\/]{0,2}localhost');
var patronLocalhost2 = new RegExp('\w*[\:]{0,1}[\/]{0,2}127\.0\.0\.1');
var patronReseauLocal = new RegExp('\w*[\:]{0,1}[\/]{0,2}192\.168\..*');


var {Cc, Ci} = require('chrome');
var dnsService = Cc["@mozilla.org/network/dns-service;1"].createInstance(Ci.nsIDNSService);
var thread = Cc["@mozilla.org/thread-manager;1"].getService(Ci.nsIThreadManager).currentThread;

this.prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);
this.prefs = this.prefService
    .getBranch("extensions.vip.");

try {
    this.prefs.getCharPref("elastic");
}
catch (error) {
    this.prefs.setCharPref("elastic", "http://127.0.0.1:9200");
    this.prefService.savePrefFile(null);
}

var elasticURL = this.prefs.getCharPref("elastic");
console.log(elasticURL);


var context = {
    hoteDemandé: '', //l'hôte principal demandé lors du chargement de la page.
    descriptionHote: '',
    domainesAutorises: [],
    domainesRefusés: []
};

chercherDomaines();
chercherDomainesBannis();

var nouveauDomaine;

//Définition d'un panneau de recherche et attachement aux touches Alt-C
var panel = require("sdk/panel").Panel({
    width: 600,
    height: 400,
    contentURL: require("sdk/self").data.url("gestionDomaines.html"),
    contentScriptFile: data.url("recherche.js")
});

var ajoutDomaine = require("sdk/panel").Panel({
    width: 250,
    height: 150,
    contentURL: require("sdk/self").data.url("ajoutDomaine.html"),
    contentScriptFile: data.url("ajoutDomaine.js")
});

var alerteDNSVipIntrouvable = require("sdk/panel").Panel({
    width: 450,
    height: 175,
    contentURL: require("sdk/self").data.url("alerteVipBackend.html"),
    contentScriptFile: data.url("alerteVipBackend.js")
});

var alerteErreurDNS = require("sdk/panel").Panel({
    width: 450,
    height: 100,
    contentURL: require("sdk/self").data.url("alerteErreurDNS.html"),
    contentScriptFile: data.url("alerteErreurDNS.js")
});

var alerteErreurIndexation = require("sdk/panel").Panel({
    width: 450,
    height: 100,
    contentURL: require("sdk/self").data.url("alerteErreurIndexation.html"),
    contentScriptFile: data.url("alerteErreurIndexation.js")
});

panel.on("show", function () {
    //Passe la main au module recherche.js en lui envoyant le message 'show'
    panel.port.emit("show", context.domainesAutorises, context.domainesRefusés);
});

ajoutDomaine.on("show", function () {
    //Passe la main au module ajoutDomaine.js en lui envoyant le message 'show' et le nom du domaine à ajouter
    ajoutDomaine.port.emit("show", nouveauDomaine);
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
        panel.show();
    }
});

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
    var channel = event.subject.QueryInterface(Ci.nsIHttpChannel);
    context.descriptionHote = channel.URI.host;
    var trouve = false;
    var ip = channel.URI.host; //Pour localhost, 127.0.0.1 ou 192.168.*, ip aura la valeur du host

    if (patronLocalhost1.exec(channel.URI.host) || patronLocalhost2.exec(channel.URI.host) || patronReseauLocal.exec(channel.URI.host)) {
        accepter(channel);
        return;
    } else {
        //console.log('Hôte demandé: ' + channel.URI.host);
        for (var cpt in context.domainesAutorises) {
            var expressionRegulière = new RegExp("\w*[\:]{0,1}[\/]{0,2}" + context.domainesAutorises[cpt]._id);
            if (expressionRegulière.exec(channel.URI.host)) {
                ip = context.domainesAutorises[cpt]._source.ip;
                accepter(channel);
                return;
            }
        }
    }
    bloquer(channel);
}

function accepter(channel) {
    //Dans tous les cas, nous ne donnons pas notre user agent.
    channel.setRequestHeader("User-Agent", new Date().getTime(), false);
    channel.setRequestHeader("Referer", "", false);
    channel.setRequestHeader("Host", channel.URI.host, false);

    journaliserRequête(channel, 'Accès');
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
        notifications.notify({text: 'Hôte bloqué: ' + context.descriptionHote + '\n\nAppuyez sur Alt-C pour autoriser ou refuser de nouveaux domaines.'});
    }
    journaliserRequête(channel, 'Refus');
}

function journaliserRequête(channel, status) {
    var request = {
        date: new Date().getTime(),
        fuseau: new Date().getTimezoneOffset(),
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
        taille: getHeader(channel, "Content-Length"),
        type: getHeader(channel, "Content-Type"),
        md5: getHeader(channel, "Content-MD5"),
        agent: getHeader(channel, "User-Agent"),
        utilisateur: getHeader(channel, "username"),
        de: getHeader(channel, "From"),
        auth: getHeader(channel, "Authorization"),
        proxyAuth: getHeader(channel, "Proxy-Authorization"),
        origine: getHeader(channel, "Origin"),
        via: getHeader(channel, "Via"),
        status: status
    }
    //console.log(request);
}

events.on("http-on-modify-request", listener);

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panel.port.on("panelClosed", function () {
    panel.hide();
});

ajoutDomaine.port.on("ajoutAnnule", function () {
    ajoutDomaine.hide();
});

ajoutDomaine.port.on("confirmationAjout", function (domaine) {
    console.log('Ajout du domaine: ' + domaine);
    ajoutDomaine.hide();
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
                console.log('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
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
}

function chercherDomainesBannis() {
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
                console.log('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
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

function enregistrerNouveauDomaine(hote, ip) {
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
            console.log("Enregistrement hôte autorisé...", hote);
            if (response.status < 200 || response.status >= 300) {
                if (response.status !== 409) {
                    alerteErreurIndexation.show();
                    console.log('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine suivant:', hote, 'ip=', ip);
                } else {
                    console.log('Document déjà autorisé:', hote);
                }
                return;

            } else {
                console.log("Enregistrement ok !");
                context.domainesAutorises.push({_id: hote,_source: {ip: ip}});
                var indexSuppression;
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

//Le champ de recherche du panneau de gestion des domaines contient un nouveau texte
panel.port.on("hoteAjouté", function (hote, ip) {
    console.log('Recherche en cours... == >' + hote);

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

            //Supprime le domaine bannis avant d'ajouter aux hôtes autorisés
            Request({
                url: elasticURL + "/domaines_bannis/hote/" + hote,
                contentType: 'application/json',
                onComplete: function (response) {
                    console.log("Suppression hôte banni...");
                    if (response.status !== 404 && (response.status < 200 || response.status >= 300)) {
                        //Echoue silencieusement
                    }
                    console.log("Suppression hôte banni ok !");
                    enregistrerNouveauDomaine(hote, record.getNextAddrAsString());
                },
                anonymous: true
            }).delete();
        }
    };
    dnsService.asyncResolve(hote, 0, ecouteurDNS, thread);
});


function enregistrerNouveauDomaineRefusé(hote, ip) {
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
            console.log("Enregistrement hôte banni...", hote);
            if (response.status < 200 || response.status >= 300) {
                if (response.status !== 409) {
                    alerteErreurIndexation.show();
                    console.log('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine banni suivant:', hote, 'ip:', ip);
                } else {
                    console.log('Document déjà banni:', hote);
                }
                return;
            } else {
                console.log("Enregistrement hôte banni ok !");
                context.domainesRefusés.push({_id: hote, _source: {ip: ip}});
            }
        },
        anonymous: true
    }).post();
}

panel.port.on("hoteSupprimé", function (hoteSupprimé, ip) {

    for (var domaineIndex in context.domainesAutorises) {
        if (context.domainesAutorises[domaineIndex]._id === hoteSupprimé) {
            var indexSauvegardé = domaineIndex;
            Request({
                url: elasticURL + "/domaines/hote/" + hoteSupprimé,
                contentType: 'application/json',
                onComplete: function (response) {
                    console.log("Suppression...", hoteSupprimé);
                    if (response.status !== 404 && (response.status < 200 || response.status >= 300)) { //404 ignoré
                        alerteErreurIndexation.show();
                        console.log('Erreur', response.status, response.statusText, '=> Impossible de supprimer le domaine suivant: ' + hoteSupprimé);
                        return;
                    } else {
                        console.log("Suppression ok !");
                        enregistrerNouveauDomaineRefusé(hoteSupprimé, context.domainesAutorises[indexSauvegardé]._source.ip);
                        context.domainesAutorises.splice(indexSauvegardé, 1);
                    }
                },
                anonymous: true
            }).delete();
        }
    }
});

pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url('essentiel.js'), data.url('jquery-1.10.2.min.js')],
    contentScriptWhen: "ready",
    onAttach: function (worker) {
        worker.postMessage("nettoyer", worker.url);
        worker.port.on("hoteDemandé", function (hoteDemandé) {
            context.hoteDemandé = hoteDemandé;
        });
    }
});
