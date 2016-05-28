var pageMod = require('sdk/page-mod');
var Request = require("sdk/request").Request;
var events = require("sdk/system/events");
var data = require('sdk/self').data;
var {Hotkey} = require("sdk/hotkeys");
var notifications = require("sdk/notifications");
var navigationPrivée = require("sdk/private-browsing");
var windows = require("sdk/windows").browserWindows;
var tabs = require("sdk/tabs");
var patronLocalhost1 = new RegExp('\w*[\:]{0,1}[\/]{0,2}localhost');
var patronLocalhost2 = new RegExp('\w*[\:]{0,1}[\/]{0,2}127\.0\.0\.1');
var patronReseauLocal = new RegExp('\w*[\:]{0,1}[\/]{0,2}192\.168\..*');
var sécurisation = require('profilSecurite/securisation');
var filtreActif = true; //Par défaut, le module filtre les domaines qui ne sont pas dans la liste blanche
var navigationPublique = false;
var jquery = data.url('js/jquery-2.2.4.min.js');
var jqueryUi = data.url('js/jquery-ui-1.11.4.min.js');
var {Cc, Ci, Cu} = require('chrome');
var dnsService = Cc["@mozilla.org/network/dns-service;1"].createInstance(Ci.nsIDNSService);
var thread = Cc["@mozilla.org/thread-manager;1"].getService(Ci.nsIThreadManager).currentThread;
var paramètresSécurisés = false;

var context = {
    hoteDemandé: '', //l'hôte principal demandé lors du chargement de la page.
    descriptionHote: '',
    domainesAutorises: [],
    domainesRefusés: [],
    urlVisitée: '',
    idCorrellation: new Date().getTime()
};

function respectNavigationPrivée(objet) {
    navigationPublique = !navigationPrivée.isPrivate(objet);
    if (!navigationPublique) {
        notifications.notify({text: 'Navigation privée\n\nDans cette fenêtre et durant toute la durée de la navigation privée, le plugin ViP ne stockera plus les domaines bannis qui n\'étaient pas déjà dans les listes des domaines autorisés ou bannis.'});
    } else {
        notifications.notify({text: 'Navigation publique'});
    }
}

//Ecouter l'appel d'une page par l'utilsateur et non par le système de chargement des sous-ressources d'une page...
//Gérer la navigation privée...
function listenerLoad(tab) {
    if (context.urlVisitée !== tab.url) {
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
    respectNavigationPrivée(tab);
});
tabs.on('pageshow', function (tab) {
    listenerLoad(tab);
});
//Fin d'écoute utilisateur

var prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);
var prefs = prefService
    .getBranch("extensions.vip.");

//Initialisation de la page d'installation
var panelAide = require("sdk/panel").Panel({
    width: 850,
    height: 600,
    contentURL: data.url("aide.html"),
    contentScriptFile: [jquery, jqueryUi, data.url("js/aide.js")]
});

panelAide.on("show", function () {
    panelAide.port.emit("show");
});

panelAide.port.on("panelClosed", function () {
    panelAide.hide();
});
//Fin

//initialisation des paramètres Firefox
try {
    prefs.getBoolPref("Mode-simple");
    prefs.getCharPref("elastic-url");
    prefs.getCharPref("regexp_hôtes_acceptés");
    var hotesAutorises = prefs.getCharPref("hôtes_acceptés");
    if (hotesAutorises) {
        context.domainesAutorises = JSON.parse(hotesAutorises).domainesAutorises;
    }
}
catch (error) {
    prefs.setBoolPref("Mode-simple", true);//Par défaut, utilises un stockage dans les paramètres plutôt qu'Elasticsearch...
    prefs.setCharPref("elastic-url", "http://127.0.0.1:9200");
    prefs.setBoolPref("mode-étendu", false);
    prefs.setCharPref("regexp_hôtes_acceptés", "\w*[\:]{0,1}[\/]{0,2}.*googlevideo.com");
    prefs.setCharPref("hôtes_acceptés", JSON.stringify({domainesAutorises: []}));
    prefService.savePrefFile(null);
    panelAide.show();
}
//Fin

var elasticURL = prefs.getCharPref("elastic-url");
var elasticPort = majElasticPort(elasticURL);
var modeEtenduElastic = nouvellePréférenceBooléennePourNouvelleVersion("mode-étendu", false /*défaut*/);
var nomsMultiples = prefs.getCharPref("regexp_hôtes_acceptés");
var nomsMultiplesRegExp = buildExpRegNomsMultiples(nomsMultiples);
var modeSimple = prefs.getBoolPref("Mode-simple");
console.info('Elasticsearch:', elasticURL);

function buildExpRegNomsMultiples(prefs) {
    var expRegs = prefs.split(';');
    var nomsMultiplesRegExp = [];
    for (var indexExpReg in expRegs) {
        nomsMultiplesRegExp.push(new RegExp(expRegs[indexExpReg]));
    }
    return nomsMultiplesRegExp;
}

function estUnNomAccepté(nom) {
    var correspondances;
    for (var index in nomsMultiplesRegExp) {
        correspondances = nomsMultiplesRegExp[index].exec(nom);
        if (correspondances && correspondances.length === 1 && correspondances[0] === nom) {
            return true;
        }
    }
    return false;
}

function majElasticPort(données) {
    var parties = données.split(':');
    if (parties.length > 1) {
        return Number.parseInt(parties[2]);
    } else {
        return 9200;
    }
}

function nouvellePréférenceBooléennePourNouvelleVersion(nomPref, valeur) {
    try {
        var valeurExistante = prefs.getBoolPref(nomPref);
        return valeurExistante;
    } catch (error) {
        prefs.setBoolPref(nomPref, valeur);
        return valeur;
    }
}

function nestPasUnAppelElastic(request) {
    var httpChannel = request.QueryInterface(Ci.nsIHttpChannel);
    return (httpChannel.URI.path !== '/requetes/requete' && httpChannel.URI.path !== '/requetes/reponse' && httpChannel.URI.port !== elasticPort);
}

//Ecoute des réponses
function enregistrerReponse(reponse) {
    if (!modeSimple && modeEtenduElastic) {
        Request({
            url: elasticURL + "/requetes/reponse",
            content: JSON.stringify(reponse),
            contentType: 'application/json',
            onComplete: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerter('Impossible d\'indexer la réponse de la requête http');
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
};
// Fin écoute réponses

//Définition d'un panneau de recherche et attachement aux touches Alt-D
var panel = require("sdk/panel").Panel({
    width: 500,
    height: 700,
    contentURL: data.url("gestionDomaines.html"),
    contentScriptFile: [jquery, jqueryUi, data.url('js/gestionDomaines.js')]
});

panel.on("show", function () {
    //Passe la main au module gestionDomaines.js en lui envoyant le message 'show'
    panel.port.emit("show", context.domainesAutorises, context.domainesRefusés);
});

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panel.port.on("panelClosed", function () {
    panel.hide();
});

//Définition d'un panneau de configuration du moteur de recherche Alt-E
var panelMoteurRecherche = require("sdk/panel").Panel({
    width: 600,
    height: 205,
    contentURL: data.url("moteurRecherche.html"),
    contentScriptFile: [jquery, jqueryUi, data.url('js/moteurRecherche.js')]
});

panelMoteurRecherche.on("show", function () {
    //Passe la main au module moteurRecherche.js en lui envoyant le message 'show'
    panelMoteurRecherche.port.emit("show", elasticURL, modeEtenduElastic);
});

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panelMoteurRecherche.port.on("panelClosed", function (adresseMoteurRecherche, modeEtendu) {
    panelMoteurRecherche.hide();

    if (elasticURL !== adresseMoteurRecherche || modeEtendu !== modeEtenduElastic) {
        prefs.setCharPref("elastic-url", adresseMoteurRecherche);
        elasticURL = adresseMoteurRecherche;
        elasticPort = majElasticPort(elasticURL);
        prefs.setBoolPref("mode-étendu", modeEtendu);
        modeEtenduElastic = modeEtendu;
        prefService.savePrefFile(null);
    }
    for (var indexDomaine in context.domainesAutorises) {
        enregistrerNouveauDomaine(context.domainesAutorises[indexDomaine].hote, context.domainesAutorises[indexDomaine].ip, false/*création*/)
    }
    for (var indexDomaineBanni in context.domainesRefusés) {
        enregistrerNouveauDomaineRefusé(context.domainesRefusés[indexDomaine].hote, context.domainesRefusés[indexDomaine].ip, false/*création*/)
    }
    notifications.notify({text: 'Moteur de recherche activé\n\nAdresse actuellement paramétrée pour ce serveur: ' + elasticURL});
});


var panelDomainesMultiples = require("sdk/panel").Panel({
    width: 800,
    height: 420,
    contentURL: data.url("domainesMultiples.html"),
    contentScriptFile: [jquery, jqueryUi, data.url("js/domainesMultiples.js")]
});

panelDomainesMultiples.on("show", function () {
    //Passe la main au module alerteErreur.js en lui envoyant le message 'show'
    panelDomainesMultiples.port.emit("show", nomsMultiples);
});

panelDomainesMultiples.port.on("panelClosed", function (expRegulière) {
    panelDomainesMultiples.hide();
    prefs.setCharPref("regexp_hôtes_acceptés", expRegulière);
    nomsMultiples = prefs.getCharPref("regexp_hôtes_acceptés");
    nomsMultiplesRegExp = buildExpRegNomsMultiples(nomsMultiples);
    prefService.savePrefFile(null);
});

var alerteErreur = require("sdk/panel").Panel({
    width: 600,
    height: 135,
    contentURL: data.url("alerteErreur.html"),
    contentScriptFile: [jquery, jqueryUi, data.url("js/alerteErreur.js")]
});

alerteErreur.on("show", function () {
    //Passe la main au module alerteErreur.js en lui envoyant le message 'show'
    alerteErreur.port.emit("show", context.msg);
});

alerteErreur.port.on("alerteErreurFermé", function () {
    alerteErreur.hide();
});

function alerter(msg) {
    context.msg = msg;
    alerteErreur.show();
}

var aideHotKey = Hotkey({
    combo: 'alt-a',
    onPress: function () {
        panelAide.show();
    }
});

var aideHotKey_Anglais = Hotkey({
    combo: 'alt-h',
    onPress: function () {
        panelAide.show();
    }
});

var restaurerParamètres = Hotkey({
    combo: 'alt-p',
    onPress: function () {
        if (paramètresSécurisés) {
            paramètresSécurisés = sécurisation.restaurerLesParamètres();
        } else {
            paramètresSécurisés = sécurisation.navigationPrivee();
        }
    }
});

var showHotKey = Hotkey({
    combo: 'alt-d',
    onPress: function () {
        panel.show();
    }
});

var showHotKey = Hotkey({
    combo: 'alt-f',
    onPress: function () {
        if (filtreActif) {
            console.info('Alt-f: Désactivation du filtrage');
            notifications.notify({text: 'Filtrage désactivé\n\nAppuyez sur Alt-f pour réactiver le filtrage des sites.'});
            filtreActif = false;
        } else {
            console.info('Alt-f: Activation du filtrage');
            notifications.notify({text: 'Filtrage activé\n\nAppuyez sur Alt-f pour désactiver le filtrage des sites.'});
            filtreActif = true;
        }
    }
});

var showHotKey = Hotkey({
    combo: 'alt-e',
    onPress: function () {
        if (modeSimple) {
            modeSimple = false;
            panelMoteurRecherche.show();
        } else {
            chercherDomaines(true /*silencieux*/);
            chercherDomainesBannis(true /*silencieux*/);
            modeSimple = true;
            notifications.notify({text: 'Moteur de recherche désactivé'});
        }
        prefs.setBoolPref("Mode-simple", modeSimple);
        prefService.savePrefFile(null);
    }
});

var showHotKey = Hotkey({
    combo: 'alt-n',
    onPress: function () {
        panelDomainesMultiples.show();
    }
});

pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url('js/filtre.js'), jquery],
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
        console.error('tab.url:', worker.tab.url);
    }
});

chercherDomaines();
chercherDomainesBannis();
paramètresSécurisés = sécurisation.navigationPrivee();

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
            estUnNomAccepté(channel.URI.host)) {
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
    if (navigationPublique) {
        journaliserRequête(channel, true);
    }

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
        if (navigationPublique) {
            enregistrerNouveauDomaineRefusé(context.descriptionHote);
            notifications.notify({text: 'Hôte bloqué: ' + context.descriptionHote + '\n\nAppuyez sur Alt-d pour autoriser ou refuser de nouveaux domaines.\n\nAppuyez sur Alt-f pour activer ou désactiver le filtrage des sites.'});
        } else {
            console.info('Hôte bloqué non enregistré (navigation privée): ' + context.descriptionHote);
        }
    }

    //Pour éviter de journaliser le user-agent
    channel.setRequestHeader("User-Agent", 0, false);
    if (navigationPublique) {
        journaliserRequête(channel, false);
    }
}

function journaliserRequête(channel, status) {
    if (!modeSimple && navigationPublique && modeEtenduElastic && nestPasUnAppelElastic(channel) === true) {
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
                        alerter('Impossible d\'indexer la requête http');
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer la requete:', requête);
                    }
                }
            },
            anonymous: true
        }).post();
    }
}
events.on("http-on-modify-request", listener);

function chercherDomaines(silencieux) {

    if (!modeSimple) {
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
                if (!silencieux && (response.status < 200 || response.status >= 300)) {
                    alerter('Impossible de se connecter au service d\'interrogation des noms de domaines.\n\nMoteur de reherche installé ?');
                    console.error('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
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

function chercherDomainesBannis(silencieux) {
    if (!modeSimple) {
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
                if (!silencieux && (response.status < 200 || response.status >= 300)) {
                    alerter('Impossible de se connecter au service d\'interrogation des noms de domaines.\n\nMoteur de recherche installé ?');
                    console.error('Erreur', response.status, response.statusText, '=> Impossible de se connecter au serveur de gestion des noms de domaine.');
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

function enregistrerNouveauDomaine(hote, ip, création) {

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
        var requestURL = elasticURL + "/domaines/hote/" + hote;
        if (création) {
            requestURL += '?op_type=create';
        }
        Request({
            url: requestURL,
            content: JSON.stringify(documentHote),
            contentType: 'application/json',
            onComplete: function (response) {
                console.info("Enregistrement hôte autorisé...", hote);
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerter('Impossible d\'indexer le nouveau domaine.');
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine suivant:', hote, 'ip=', ip);
                    } else {
                        console.info('Document déjà autorisé:', hote);
                    }
                } else {
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
                alerter('Impossible de se connecter au service DNS.');
            } else if (status === 0x804B001E || !record) {
                alerter('Hôte introuvable.');
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


function enregistrerNouveauDomaineRefusé(hote, ip, création) {

    if (modeSimple) {
        var domaine = {_id: hote, _source: {ip: ip}};
        context.domainesRefusés.push(domaine);
    } else {
        var documentHote = {
            date: new Date().getTime(),
            fuseau: new Date().getTimezoneOffset(),
            ip: ip || '0.0.0.0'
        };
        var requestURL = elasticURL + "/domaines_bannis/hote/" + hote;
        if (création) {
            requestURL += '?op_type=create';
        }
        Request({
            url: requestURL,
            content: JSON.stringify(documentHote),
            contentType: 'application/json',
            onComplete: function (response) {
                console.info("Enregistrement hôte banni...", hote);
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerter('Impossible d\'indexer le nouveau domaine.');
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine banni suivant:', hote, 'ip:', ip);
                    } else {
                        console.error('Document déjà banni:', hote);
                    }
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
                            alerter('Impossible d\'indexer le nouveau domaine.');
                            console.error('Erreur', response.status, response.statusText, '=> Impossible de supprimer le domaine suivant: ' + hoteSupprimé);
                        } else {
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


