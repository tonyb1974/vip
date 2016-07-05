self.port.on('nettoyer', function () {

    //Attention, des blocs de commentaires peuvent contenir des liens ou du code :
    //Ex : <!--[if lte IE 7]>
    //         <link href="//mozorg.cdn.mozilla.net/media/css/oldIE-bundle.ea7fe0ba08ae.css" rel="stylesheet" type="text/css" />
    //     <![endif]-->
    //Nous les supprimons donc !
    var filter = function (index, element) {
        return element.nodeType == 8;
    };

    //Pour que les utilisateurs google puisse l'utiliser avec ce plugin tout en conservant un minimum de vie privée ;-)
    if(document.location.host.startsWith('www.google.')){
        var googleTranslate = function(index, element) {
            var params = $(element).attr('href').split('&');
            if (params[0]) {
                var urlGoogle = params[0].split('q=');
                if (urlGoogle) {
                    var urlRéèlle = urlGoogle[urlGoogle.length - 1].split(':');
                    if (urlRéèlle) {
                        $(element).attr('href', urlRéèlle[urlRéèlle.length - 1 ]);
                    } else {
                        $(element).attr('href', urlGoogle[urlGoogle.length - 1]);
                    }
                }
            }
        }
        $("a[href^='/url']").each(googleTranslate);
    }

    var inhiber = function (index, element) {
        element.nodeValue = "#";
    };

    $("*").contents().filter(filter).each(inhiber);
    $("document").contents().filter(filter).each(inhiber);
    $(":root").contents().filter(filter).each(inhiber);


    //Tous les scripts qui ne sont pas chez l'hôte initial ou inline est supprimé
    $("script").each(function (index, element) {
        var src = $(this).attr('src');
        //Désactivation des scripts qui n'ont pas de sources extérieures et localisées sur un serveur.
        if (!src) {
            $(this).replaceWith("<script></script>");
        }
    });
});

self.port.on('localStorage', function () {
    if (localStorage) {
        localStorage.clear();
    }
    if (window.localStorage) {
        window.localStorage.clear();
    }
});


