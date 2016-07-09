var pageMod = require('sdk/page-mod');
var Request = require("sdk/request").Request;
var events = require("sdk/system/events");
var data = require('sdk/self').data;
var {Hotkey} = require("sdk/hotkeys");
var notifications = require("sdk/notifications");
var navigationPrivée = require("sdk/private-browsing");
var tabs = require("sdk/tabs");
var tabutils = require('sdk/tabs/utils');
var patronLocalhost1 = new RegExp('\w*[\:]{0,1}[\/]{0,2}localhost');
var patronLocalhost2 = new RegExp('\w*[\:]{0,1}[\/]{0,2}127\.0\.0\.1');
var patronReseauLocal = new RegExp('\w*[\:]{0,1}[\/]{0,2}192\.168\..*');
var adresseMaj = new RegExp('\w*[\:]{0,1}[\/]{0,2}aus5.mozilla.org.*');
var patronReferer = new RegExp('http[s]{0,1}[\:]{0,1}[\/]{0,2}([a-z|A-Z|\.|\\-|\_]*)[\/]{0,1}.*');
var adresseOcsp = new RegExp('\w*[\:]{0,1}[\/]{0,2}ocsp.*');
var sécurisation = require('profilSecurite/securisation');
var navigationPublique = false;
var jquery = data.url('js/jquery-2.2.4.min.js');
var jqueryUi = data.url('js/jquery-ui-1.11.4.min.js');
var {Cc, Ci, Cu} = require('chrome');
var dnsService = Cc["@mozilla.org/network/dns-service;1"].createInstance(Ci.nsIDNSService);
var thread = Cc["@mozilla.org/thread-manager;1"].getService(Ci.nsIThreadManager).currentThread;
var paramètresSécurisés = false;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
var { viewFor } = require("sdk/view/core");
var { search } = require("sdk/places/bookmarks");

var context = {
    ongletOuvertALinstant: tabs[0],
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
    }
}

//Ecouter l'appel d'une page par l'utilsateur et non par le système de chargement des sous-ressources d'une page...
//Gérer la navigation privée...

var myListener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener"]),
    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {},
    onLocationChange: function(aProgress, aRequest, aURI, aFlag) {
        if (context.urlVisitée !== aURI.prePath + aURI.path) {
            context.urlVisitée = aURI.prePath + aURI.path;
            context.idCorrellation = new Date().getTime();
        }
    },
    onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {},
    onSecurityChange: function(aWebProgress, aRequest, aState) {}
}

function addProgressListener(highLevelTab) {
    var browser = tabutils.getTabBrowserForTab(viewFor(highLevelTab));
    if (browser) {
        browser.removeProgressListener( myListener );
        browser.addProgressListener( myListener ); // Evite l'ajout multiple
    }
}
function removeProgressListener(highLevelTab) {
    var browser = tabutils.getTabBrowserForTab(viewFor(highLevelTab));
    if (browser) {
        browser.removeProgressListener( myListener );
    }
}
tabs[0].domainesRefusés=[];
tabs[0].hôteVisité = '';
tabs[0].filtreActif = true; //Par défaut, le module filtre les domaines qui ne sont pas dans la liste blanche
tabs[0].filtreJavascriptActif = true; //Par défaut, le module filtre le javascript inline des pages html chargées.
addProgressListener(tabs[0]);

tabs.on('open', function (tab) {
    tab.hôteVisité = ''; //Libère le host visité pour que l'on puisse choisir une nouvelle adresse.
    context.ongletOuvertALinstant  = tab;
    tab.activate();
    tab.domainesRefusés=[];
    tab.filtreActif = true; //Par défaut, le module filtre les domaines qui ne sont pas dans la liste blanche
    tab.filtreJavascriptActif = true; //Par défaut, le module filtre le javascript inline des pages html chargées.
});

function msgFiltreActif(filtreActif){
    if (filtreActif) {
        return ' > Filtre actif';
    } else {
        return ' > Filtre inactif';
    }
}
function msgFiltreJavascriptActif(filtreActif){
    if (filtreActif) {
        return ' > Filtre javascript actif';
    } else {
        return ' > Filtre javascript inactif';
    }
}
tabs.on('activate', function (tab) {
    notifications.notify({text: tab.hôteVisité + msgFiltreActif(tab.filtreActif) + msgFiltreJavascriptActif(tab.filtreJavascriptActif)});
    addProgressListener(tab)
    respectNavigationPrivée(tab);
});
tabs.on('deactivate', function (tab) {
    context.ongletPrécédent = tab;
    removeProgressListener(tab);
});

tabs.on('ready', function (tab) {
    if (tab === context.ongletOuvertALinstant) {
        delete context.ongletOuvertALinstant;
    }
});
//Fin d'écoute utilisateur

var prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);
var prefs = prefService
    .getBranch("extensions.vip.");

//Initialisation de la page d'installation
var panelAide = require("sdk/panel").Panel({
    width: 900,
    height: 690,
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
    return (request.URI.path !== '/requetes/requete' && request.URI.path !== '/requetes/reponse' && request.URI.port !== elasticPort);
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
}

TracingListener.prototype =
{
    onDataAvailable: function (request, context, inputStream, offset, count) {

        if (!this.startTime) {
            this.startTime = new Date().getTime();
        }
        this.originalListener.onDataAvailable(request, context,
            inputStream, offset, count);
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
                hôteVisité: tabs.activeTab.hôteVisité,
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
var panelOnglet = require("sdk/panel").Panel({
    width: 500,
    height: 700,
    contentURL: data.url("gestionDomaines.html"),
    contentScriptFile: [jquery, jqueryUi, data.url('js/gestionDomaines.js')]
});

panel.on("show", function () {
    //Passe la main au module gestionDomaines.js en lui envoyant le message 'show'
    panel.port.emit("show", context.domainesAutorises, context.domainesRefusés);
});

panelOnglet.on("show", function () {
    //Passe la main au module gestionDomaines.js en lui envoyant le message 'show'
    panelOnglet.port.emit("show", context.domainesAutorises, tabs.activeTab.domainesRefusés);
});

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panel.port.on("panelClosed", function () {
    panel.hide();
});

//Le bouton de fermeture du panneau de gestion des domaines a été clické
panelOnglet.port.on("panelClosed", function () {
    panelOnglet.hide();
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

//Le bouton de fermeture du panneau de gestion des domaines a été sélectionné
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
        enregistrerNouveauDomaineRefusé(context.domainesRefusés[indexDomaineBanni].hote, context.domainesRefusés[indexDomaineBanni].ip, false/*création*/)
    }
    notifications.notify({text: 'Moteur de recherche activé\n\nAdresse actuellement paramétrée pour ce serveur: ' + elasticURL});
});

var panelVisiterUneNouvelleAdresse = require("sdk/panel").Panel({
    width: 600,
    height: 350,
    contentURL: data.url("nouvelleAdresse.html"),
    contentScriptFile: [jquery, jqueryUi, data.url("js/nouvelleAdresse.js")]
});

panelVisiterUneNouvelleAdresse.on("show", function () {
    //Affiche un dialogue permettant de saisir une adresse url ou un hôte à visiter
    var marquesPages = [];
    search(
        { query: "" }, {}
    ).on("end", function (resultats) {
       for(var indexMarquePage in resultats) {
           marquesPages.push(resultats[indexMarquePage].url);
       }
       panelVisiterUneNouvelleAdresse.port.emit("show", marquesPages);
    });
});

panelVisiterUneNouvelleAdresse.port.on("panelClosed", function () {
    panelVisiterUneNouvelleAdresse.hide();
});

panelVisiterUneNouvelleAdresse.port.on("adresseChoisie", function (adresseDemandée) {
    panelVisiterUneNouvelleAdresse.hide();
    var activeTab = tabs.activeTab;
    var adresseRetravaillée = adresseDemandée;

    if (adresseDemandée.startsWith('http') === false) {
        adresseRetravaillée = 'http://' + adresseDemandée
    }
    tabs.open({
        url: adresseRetravaillée,
        isPinned: false,
        onOpen: function onOpen(tab) {
            tab.hôteVisité = '';
        }
    });
    activeTab.hôteVisité = '';
    activeTab.close();
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

var filtreJavascript = function (worker) {
    if (tabs.activeTab.filtreJavascriptActif) {
        worker.port.emit("nettoyer");
    } else {
        filtreNeutre(worker);
    }
}
var viderLocalStorage = function (worker) {
    worker.port.emit("localStorage");
}

var filtreNeutre = function(worker) {
    notifications.notify({text: 'Aucun filtrage'});
}

var moduleFiltrant = pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url('js/filtre.js'), jquery],
    contentScriptWhen: "ready",
    onAttach: filtreJavascript
});

var moduleFiltrant = pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url('js/filtre.js'), jquery],
    contentScriptWhen: "end",
    onAttach: viderLocalStorage
});

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

var gestionDomainesHotKey = Hotkey({
    combo: 'alt-d',
    onPress: function () {
        panel.show();
    }
});

var gestionDomainesHotKey = Hotkey({
    combo: 'alt-o',
    onPress: function () {
        panelOnglet.show();
    }
});

var gestionFiltrageHotKey = Hotkey({
    combo: 'alt-f',
    onPress: function () {
        if (tabs.activeTab.filtreActif) {
            notifications.notify({text: 'Filtrage désactivé\n\nAppuyez sur Alt-f pour réactiver le filtrage des sites.'});
            tabs.activeTab.filtreActif = false;
        } else {
            notifications.notify({text: 'Filtrage activé\n\nAppuyez sur Alt-f pour désactiver le filtrage des sites.'});
            tabs.activeTab.filtreActif = true;
        }
    }
});

var filtreJavascriptHotKey = Hotkey({
    combo: 'alt-j',
    onPress: function () {
        if (tabs.activeTab.filtreJavascriptActif) {
            tabs.activeTab.filtreJavascriptActif = false;
            notifications.notify({text: 'Filtrage du javascript \'inline\' désactivé\n\nAppuyez sur Alt-j pour réactiver le filtrage du javascript \'inline\'.'});
        } else {
            tabs.activeTab.filtreJavascriptActif = true;
            notifications.notify({text: 'Filtrage du javascript \'inline\' activé\n\nAppuyez sur Alt-j pour désactiver le filtrage du javascript \'inline\'.'});
        }
    }
});

var modeEtenduHotKey = Hotkey({
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

var modeEtenduHotKey = Hotkey({
    combo: 'alt-q',
    onPress: function () {
        notifications.notify({text: 'Hôte actuel pour l\'onglet courant: ' + tabs.activeTab.hôteVisité});
    }
});
var nomMultiplesHotKey = Hotkey({
    combo: 'alt-n',
    onPress: function () {
        panelDomainesMultiples.show();
    }
});

var nomMultiplesHotKey = Hotkey({
    combo: 'alt-v',
    onPress: function () {
        panelVisiterUneNouvelleAdresse.show();
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
    var onglet = tabs.activeTab;
    if (context.ongletOuvertALinstant) {
        onglet = context.ongletOuvertALinstant;
        delete context.ongletOuvertALinstant;
    }

    if (onglet.filtreActif) {

        var channel = event.subject.QueryInterface(Ci.nsIHttpChannel);
            var hôteVisité = new RegExp(onglet.hôteVisité);
            if (
                (patronLocalhost1.exec(channel.URI.host) ||
                patronLocalhost2.exec(channel.URI.host) ||
                patronReseauLocal.exec(channel.URI.host) ||
                hôteVisité.exec(channel.URI.host) ||
                hôteVisité.exec('www.' + channel.URI.host) ||
                estUnNomAccepté(channel.URI.host))) {

                //On installe un écouteur
                var newListener = new TracingListener();
                event.subject.QueryInterface(Ci.nsITraceableChannel);
                newListener.originalListener = event.subject.setNewListener(newListener);

                if (onglet.hôteVisité === '') { //Si l'hôte visité est vide, on accepte le nouvel hôte jusqu'à réinitialisation du tab par l'utilisateur ou un clic souris
                    if (!adresseOcsp.exec(channel.URI.host) && !adresseMaj.exec(channel.URI.host)) { // Si ocsp ou update, on enregistre pas comme adresse demandée par l'utilisateur...
                        onglet.hôteVisité = channel.URI.host;
                    }
                }
                if (nestPasUnAppelElastic(channel)) {
                    console.error("Dans le contexte " + onglet.hôteVisité + ' l\'adresse suivante a été acceptée: ' + channel.URI.asciiSpec);
                }
                accepter(channel, onglet);

                return;
            } else {
                var expressionRegulière;
                for (var cpt in context.domainesAutorises) {
                    expressionRegulière = new RegExp("\w*[\:]{0,1}[\/]{0,2}" + context.domainesAutorises[cpt]._id);
                    if (expressionRegulière.exec(channel.URI.host) ||
                        expressionRegulière.exec('www.' + channel.URI.host)) {
                        var newListener = new TracingListener();
                        event.subject.QueryInterface(Ci.nsITraceableChannel);
                        newListener.originalListener = event.subject.setNewListener(newListener);
                        console.error("Dans le contexte " + onglet.hôteVisité + ' l\'adresse suivante a été acceptée: ' + channel.URI.asciiSpec);
                        accepter(channel, onglet);
                        return;
                    }
                }
            }
            console.error("Dans le contexte " + onglet.hôteVisité + ' l\'adresse suivante a été bloquée: ' + channel.URI.asciiSpec);
            bloquer(channel, onglet);
    }
}

function accepter(channel, onglet) {
    if (navigationPublique) {
        journaliserRequête(channel, true, onglet);
    }

    //Dans tous les cas, nous ne donnons pas notre user agent.
    channel.setRequestHeader("User-Agent", new Date().getTime(), false);
    channel.setRequestHeader("Referer", "", false);
    channel.setRequestHeader("Host", channel.URI.host, false);
}

function abandonnerRequête(channel) {
    channel.cancel(0x804B0002); //On annule la requête avec un NS_BINDING_ERROR
}

function bloquer(channel, onglet) {
    abandonnerRequête(channel);

    var trouve = false;
    //Quelquesoit le cas, on enregistre le blocage sur l'onglet courant
    enregistrerDomaineRefuséParOnglet(channel.URI.host, null, onglet);
    for (var domaine in context.domainesRefusés) {
        if (context.domainesRefusés[domaine]._id === channel.URI.host) {
            trouve = true;
            break;
        }
    }
    if (trouve === false) {
        context.descriptionHote = channel.URI.host;
        if (navigationPublique) {
            enregistrerNouveauDomaineRefusé(context.descriptionHote, null, false);
            notifications.notify({text: 'Hôte bloqué: ' + context.descriptionHote });
        } else {
            notifications.notify({text: 'Hôte bloqué non enregistré (navigation privée): ' + context.descriptionHote });
        }
    }

    //Pour éviter de journaliser le user-agent
    channel.setRequestHeader("User-Agent", 0, false);
    if (navigationPublique) {
        journaliserRequête(channel, false, onglet);
    }
}

function journaliserRequête(channel, status, onglet) {
    if (!modeSimple && navigationPublique && modeEtenduElastic && nestPasUnAppelElastic(channel) === true) {

        var referer;
        var domaineReferer;
        try {
            referer = channel.getRequestHeader("Referer");
        } catch (error) {
            //nous avons affaire à une saisie utilisateur directe.
            domaineReferer = onglet.hôteVisité;
        }

        if (referer) {
            domaineReferer = patronReferer.exec(referer);
            if (domaineReferer) {
                domaineReferer = domaineReferer[1];
            }
        }

        var requête = {
            date: new Date().getTime(),
            fuseau: new Date().getTimezoneOffset(),
            idCorrellation: context.idCorrellation,
            hôteVisité: onglet.hôteVisité,
            urlVisitee: context.urlVisitée,
            format: channel.URI.scheme,
            sécurité: channel.URI.securityInfo,
            methode: channel.requestMethod,
            hote: getHeader(channel, "host"),
            port: channel.URI.port,
            chemin: channel.URI.path,
            corps: corps(channel),
            referer: domaineReferer,
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

function filtrerDomainesRefusés(hote) {
    for (var domaineIndex in context.domainesRefusés) {
        if (context.domainesRefusés[domaineIndex]._id === hote) {
            context.domainesRefusés.splice(domaineIndex, 1);
            break;
        }
    }
    for (var indexOnglet in tabs) {
        for (var domaineIndex2 in tabs[indexOnglet].domainesRefusés) {
            if (tabs[indexOnglet].domainesRefusés[domaineIndex2]._id === hote) {
                tabs[indexOnglet].domainesRefusés.splice(domaineIndex2, 1);
                break;
            }
        }
    }
}

function enregistrerNouveauDomaine(hote, ip, création) {

    if (modeSimple) {
        var domaine = {_id: hote, _source: {ip: ip}};
        context.domainesAutorises.push(domaine);
        filtrerDomainesRefusés(hote);
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
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerter('Impossible d\'indexer le nouveau domaine.');
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine suivant:', hote, 'ip=', ip);
                    }
                } else {
                    context.domainesAutorises.push({_id: hote, _source: {ip: ip}});
                    filtrerDomainesRefusés(hote);
                }
            },
            anonymous: true
        }).post();
    }
}

function ajouterHote(hote, ip) {
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
                        if (response.status !== 404 && (response.status < 200 || response.status >= 300)) {
                            //Echoue silencieusement
                        }
                        enregistrerNouveauDomaine(hote, record.getNextAddrAsString());
                    },
                    anonymous: true
                }).delete();
            }
        }
    };
    dnsService.asyncResolve(hote, 0, ecouteurDNS, thread);
}
//Le champ de recherche du panneau de gestion des domaines contient un nouveau texte
panel.port.on("hoteAjouté", function (hote, ip) {
    ajouterHote(hote, ip);
});
panelOnglet.port.on("hoteAjouté", function (hote, ip) {
    ajouterHote(hote, ip);
});

function ajoutDomaineRefuséSiNonRéférencé(hote, ip, onglet) {
    if(onglet){
        var trouvé = false;
        for (indexDomaine in onglet.domainesRefusés) {
            if (onglet.domainesRefusés[indexDomaine]._id === hote) {
                trouvé = true;
                break;
            }
        }
        if (trouvé === false) {
            onglet.domainesRefusés.push({_id: hote, _source: {ip: ip}});
        }
    }
}
function enregistrerDomaineRefuséParOnglet(hote, ip, onglet) {
    if (onglet) {
        for (indexOnglet in tabs) {
            if (onglet.hôteVisité === '' || tabs[indexOnglet].hôteVisité === onglet.hôteVisité) {
                ajoutDomaineRefuséSiNonRéférencé(hote, ip, tabs[indexOnglet]);
            }
        }
    }
}
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
                if (response.status < 200 || response.status >= 300) {
                    if (response.status !== 409) {
                        alerter('Impossible d\'indexer le nouveau domaine.');
                        console.error('Erreur', response.status, response.statusText, '=> Impossible d\'enregistrer le domaine banni suivant:', hote, 'ip:', ip);
                    } else {
                        console.error('Document déjà banni:', hote);
                    }
                } else {
                    context.domainesRefusés.push({_id: hote, _source: {ip: ip}});
                }
            },
            anonymous: true
        }).post();
    }
}

function supprimerHote(hoteSupprimé, ip) {
    for (var domaineIndex in context.domainesAutorises) {
        if (context.domainesAutorises[domaineIndex]._id === hoteSupprimé) {
            var indexSauvegardé = domaineIndex;
            if (modeSimple) {
                enregistrerNouveauDomaineRefusé(hoteSupprimé, context.domainesAutorises[indexSauvegardé]._source.ip, false);
                context.domainesAutorises.splice(indexSauvegardé, 1);
                prefs.setCharPref("hôtes_acceptés", JSON.stringify({domainesAutorises: context.domainesAutorises}));
                prefService.savePrefFile(null);
            } else {
                Request({
                    url: elasticURL + "/domaines/hote/" + hoteSupprimé,
                    contentType: 'application/json',
                    onComplete: function (response) {
                        if (response.status !== 404 && (response.status < 200 || response.status >= 300)) { //404 ignoré
                            alerter('Impossible d\'indexer le nouveau domaine.');
                            console.error('Erreur', response.status, response.statusText, '=> Impossible de supprimer le domaine suivant: ' + hoteSupprimé);
                        } else {
                            enregistrerNouveauDomaineRefusé(hoteSupprimé, context.domainesAutorises[indexSauvegardé]._source.ip, false);
                            context.domainesAutorises.splice(indexSauvegardé, 1);
                        }
                    },
                    anonymous: true
                }).delete();
            }
        }
    }
}
panel.port.on("hoteSupprimé", function (hoteSupprimé, ip) {
    supprimerHote(hoteSupprimé, ip);
});
panelOnglet.port.on("hoteSupprimé", function (hoteSupprimé, ip) {
    supprimerHote(hoteSupprimé, ip);
});


