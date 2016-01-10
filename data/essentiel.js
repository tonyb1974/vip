function cheminRelatifOuMemeHote(chemin, hoteInitial, regexp) {
    if (!chemin.startsWith('/') && !chemin.startsWith('//') && !chemin.startsWith('.') && !regexp.exec(chemin)) {
        return false;
    } else {
        return true;
    }
}
self.on('message', function (msg, urlDemandé) {

    var pageCourante = document.location.href;
    var hoteCourant = document.location.host;
    self.port.emit('hoteDemandé', hoteCourant);

    var patronMultiProtocole = new RegExp('\w*[\:]{0,1}[\/]{0,2}' + hoteCourant + '.*');

//    $('*[data-href]').each(function () {
//        //Désactivation des liens hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('data-href'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('data-href', '#');
//        }
//    });

//    $('link').each(function () {
//        //Désactivation des liens hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('href'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('href', '#');
//        }
//    });

    //Attention, des blocs de commentaires peuvent contenir des liens ou du code :
    //Ex : <!--[if lte IE 7]>
    //         <link href="//mozorg.cdn.mozilla.net/media/css/oldIE-bundle.ea7fe0ba08ae.css" rel="stylesheet" type="text/css" />
    //     <![endif]-->
    //Nous les supprimons donc !
    $("*").contents().filter(function () {
        return this.nodeType == 8;
    }).each(function (i, e) {
            e.nodeValue = "#";
    });

    //Tous les scripts qui ne sont pas chez l'hôte initial ou inline est supprimé
    $('script').each(function () {
        var src = $(this).attr('src');
        //Désactivation des scripts hors domaine initial ou tentant une traversée du chemin.
        if (!src /*|| !cheminRelatifOuMemeHote(src, hoteCourant, patronMultiProtocole)*/) {
            $(this).replaceWith("<script></script>");
        }
    });

//    $('img').each(function () {
//        //Désactivation des images hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('src'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('src', '#');
//        }
//    });
//
//    //Les éléments audios ou vidéos HTML5 peuvent porter des sections source.
//    $('source').each(function () {
//        //Désactivation des sources hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('src'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('src', '#');
//        }
//    });
//
//    $('object').each(function () {
//        //Désactivation des sources hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('data'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('data', '#');
//        }
//    });
//
//    $('a').each(function () {
//        //Désactivation des liens hors domaine initial ou tentant une traversée du chemin.
//        if (!cheminRelatifOuMemeHote($(this).attr('href'), hoteCourant, patronMultiProtocole)) {
//            $(this).attr('href', '#');
//        }
//    });
});


