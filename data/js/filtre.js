var noeudParentSignigfiant = function (el) {
    if (el && el.classList && el.classList.contains('userContentWrapper')) return el;

    var parent = el.parentNode;
    while (parent) {
        parent = parent.parentNode;
        if (parent && parent.classList && parent.classList.contains('userContentWrapper')) {
            return parent;
        }
    }
    return parent;
}

var supprimer = function (el) {
    var parentASupprimer = noeudParentSignigfiant(el);
    if (parentASupprimer.nodeName === 'body') {
        alert('Racine du document atteinte !');
    } else {
        parentASupprimer.parentNode.removeChild(parentASupprimer);
    }
}

var running = false;

var filtresFB = function () {
    if (running === true) {
        return;
    }
    else {
        running = true;

        /*var pymk = document.getElementById('pagelet_pymk_timeline'); //Supprime les propositions de contact
        if (pymk) {
            pymk.parentNode.removeChild(pymk);
        }*/

        //Supprimer la colonne de droite dans son journal perso
        var egoPanel = document.getElementById('pagelet_ego_pane');
        if (egoPanel) {
            egoPanel.parentNode.removeChild(egoPanel);
        }

        //Supprimer la colonne de droite sur le mur
        egoPanel = document.getElementById('u_0_q');
        if (egoPanel) {
            egoPanel.parentNode.removeChild(egoPanel);
        }

        var elements = document.getElementsByTagName('span');
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].innerText === 'Publication suggérée' || elements[i].innerText === "Créer une publicité" || elements[i].innerText === 'Jeu suggéré') {
                supprimer(elements[i]);
            }
        }
        running = false;
    }
}

self.port.on('nettoyagesPrimaires', function () {

    document.vip = {};

    if (document.location.host.startsWith('www.facebook.')) {
        filtresFB();
        window.document.onload = filtresFB;
        window.document.onready = filtresFB;
        window.onscroll = filtresFB;
    }
});

self.port.on('nettoyer', function () {

    //Attention, des blocs de commentaires peuvent contenir des liens ou du code :
    //Ex : <!--[if lte IE 7]>
    //         <link href="//mozorg.cdn.mozilla.net/media/css/oldIE-bundle.ea7fe0ba08ae.css" rel="stylesheet" type="text/css" />
    //     <![endif]-->
    //Nous les supprimons donc !
    var filter = function (index, element) {
        return element.nodeType == 8;
    };

    var inhiber = function (index, element) {
        element.nodeValue = "#";
    };

    $("*").contents().filter(filter).each(inhiber);
    $("document").contents().filter(filter).each(inhiber);
    $(":root").contents().filter(filter).each(inhiber);


    //Tous les scripts qui ne sont pas chez l'hôte initial ou inline sont supprimés
    $("script").each(function (index, element) {
        var src = $(this).attr('src');
        //Désactivation des scripts qui n'ont pas de sources extérieures et localisées de manière identifiable sur un serveur.
        if (!src) {
            $(this).replaceWith("<script></script>");
        }
    });


    //Pour que les utilisateurs google et de Qwant puissent les utiliser avec ce plugin tout en conservant un minimum de vie privée ;-)
    if (document.location.host.startsWith('www.google.')) {
        var googleTranslate = function (index, element) {
            var params = $(element).attr('href').split('&');
            if (params[0]) {
                var urlGoogle = params[0].split('q=');
                if (urlGoogle) {
                    var urlRéèlle = urlGoogle[urlGoogle.length - 1].split(':');
                    if (urlRéèlle) {
                        $(element).attr('href', decodeURIComponent(urlRéèlle[urlRéèlle.length - 1]));
                    } else {
                        $(element).attr('href', decodeURIComponent(urlGoogle[urlGoogle.length - 1]));
                    }
                    $(element).attr('target', '_blank');
                }
            }
        }
        $("a[href^='/url']").each(googleTranslate);
    }
    else if (document.location.host.startsWith('lite.qwant.com')) {
        var qwantTranslate = function (index, element) {
            var params = $(element).attr('href').split('%3D/');
            if (params[1]) {
                var urlRéèlle = params[1].split('?') [0];
                $(element).attr('href', decodeURIComponent(urlRéèlle));
                $(element).attr('target', '_blank');
            }
        }
        $("a[href^='/redirect']").each(qwantTranslate);
    }
    else if (document.location.host.startsWith('www.facebook.')) {
        window.document.onload = filtresFB;
        window.document.onready = filtresFB;
        window.onscroll = filtresFB;
    }
    else {
        $("a[href^='http']").each(function (i, e) {
            var href = $(e).attr('href');
            if (href.startsWith(document.location.protocol + '//' + document.location.host) === false) {
                $(e).attr('target', '_blank');
            }
        });
    }
});

self.port.on('localStorage', function () {
    if (localStorage) {
        localStorage.clear();
    }
    if (window.localStorage) {
        window.localStorage.clear();
    }
});


