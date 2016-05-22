self.port.on('nettoyer', function (urlDemandé) {

    var hoteCourant = document.location.host;

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


    //Tous les scripts qui ne sont pas chez l'hôte initial ou inline est supprimé
    $("script").each(function (index, element) {
        var src = $(this).attr('src');
        //Désactivation des scripts qui n'ont pas de sources extérieures et localisées sur un serveur.
        if (!src) {
            $(this).replaceWith("<script></script>");
        }
    });

    self.port.emit('hoteDemandé', hoteCourant);
});


