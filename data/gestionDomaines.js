var champRecherche = document.getElementById('rechercheDomaines');
var listeDomainesAcceptés = document.getElementById('domainesAcceptés');
var listeDomainesRefusés = document.getElementById('domainesRefusés');
var ajouterDomaine = document.getElementById('ajouter');
var supprimerDomaine = document.getElementById('supprimer');
var boutonFermer = document.getElementById('fermer');
var suggestions = [];

boutonFermer.addEventListener('click', function (event) {
    self.port.emit('panelClosed');
}, false);

function créerNoeudAjout(parentNode, hoteReprésenté, ipReprésentée) {
    var div = document.createElement('div');
    div.setAttribute('id', hoteReprésenté);

    var input = document.createElement('input');
    input.setAttribute('type', 'button');
    input.setAttribute('value', '+');
    input.setAttribute('id', hoteReprésenté+'_bouton')
    input.setAttribute('onclick', 'document.getElementById(\'rechercheDomaines\').value=\'' + hoteReprésenté + '\';document.getElementById(\'ajouter\').click();');
    $(input).button();
    
    div.appendChild(input);
    div.appendChild(document.createTextNode(' ' + hoteReprésenté));
    if (ipReprésentée && ipReprésentée !== '0.0.0.0') {
        var ip = document.createElement('span');
        ip.setAttribute('id', hoteReprésenté + '_ip');
        div.appendChild(document.createTextNode(' - '));
        ip.appendChild(document.createTextNode(ipReprésentée));
        div.appendChild(ip);
    }
    parentNode.appendChild(div);
}

ajouterDomaine.addEventListener('click', function (event) {
    console.log('Hôte ajouté:', champRecherche.value);

    var noeudASupprimer = document.getElementById(champRecherche.value);
    var ipNode = document.getElementById(champRecherche.value + '_ip');
    var valeurIp;
    if (ipNode) {
        valeurIp = ipNode.innerHTML;
    }
    noeudASupprimer.setAttribute('id', 'vide');
    listeDomainesRefusés.removeChild(noeudASupprimer);

    créerNoeudSuppression(listeDomainesAcceptés, champRecherche.value, valeurIp);
    self.port.emit('hoteAjouté', champRecherche.value, valeurIp);
}, false);

function créerNoeudSuppression(parentNode, hoteReprésenté, ipReprésentée) {
    var div = document.createElement('div');
    div.setAttribute('id', hoteReprésenté);

    var input = document.createElement('input');
    input.setAttribute('type', 'button');
    input.setAttribute('value', '-');
    input.setAttribute('id',hoteReprésenté+'_bouton');
    input.setAttribute('onclick', 'document.getElementById(\'rechercheDomaines\').value=\'' + hoteReprésenté + '\';document.getElementById(\'supprimer\').click();');
    $(input).button();

    div.appendChild(input);
    div.appendChild(document.createTextNode(' ' + hoteReprésenté));

    if (ipReprésentée && ipReprésentée !== '0.0.0.0') {
        var ip = document.createElement('span');
        ip.setAttribute('id', hoteReprésenté + '_ip');
        div.appendChild(document.createTextNode(' - '));
        ip.appendChild(document.createTextNode(ipReprésentée));
        div.appendChild(ip);
    }
    parentNode.appendChild(div);
}

supprimerDomaine.addEventListener('click', function (event) {
    console.log('Hôte supprimé:', champRecherche.value);

    var noeudASupprimer = document.getElementById(champRecherche.value);
    var ipNode = document.getElementById(champRecherche.value + '_ip');
    var valeurIp;
    if (ipNode) {
        valeurIp = ipNode.innerHTML;
    }
    noeudASupprimer.setAttribute('id', 'vide');
    listeDomainesAcceptés.removeChild(noeudASupprimer);

    créerNoeudAjout(listeDomainesRefusés, champRecherche.value, valeurIp);
    self.port.emit('hoteSupprimé', champRecherche.value, valeurIp);
}, false);

function nettoyerLesListes() {
    while (listeDomainesAcceptés.hasChildNodes()) {
        listeDomainesAcceptés.removeChild(listeDomainesAcceptés.lastChild);
    }

    while (listeDomainesRefusés.hasChildNodes()) {
        listeDomainesRefusés.removeChild(listeDomainesRefusés.lastChild);
    }
}

self.port.on('show', function (domainesAcceptés, domainesBannis) {
   
    //réintialisation des suggestions
    suggestions = [];
    nettoyerLesListes();
    for (var indexDomaine in domainesAcceptés) {
        créerNoeudSuppression(listeDomainesAcceptés, domainesAcceptés[indexDomaine]._id, domainesAcceptés[indexDomaine]._source.ip);
        suggestions.push(domainesAcceptés[indexDomaine]._id);
        
    }
    for (var indexDomaineBanni in domainesBannis) {
        créerNoeudAjout(listeDomainesRefusés, domainesBannis[indexDomaineBanni]._id, domainesBannis[indexDomaineBanni]._source.ip);
        suggestions.push(domainesBannis[indexDomaineBanni]._id);
    }

    $('#ajouter').button();
    $('#supprimer').button();
    $('#accordion').accordion({heightStyle: 'content'});
    $('#fermer').button();
    $('#rechercheDomaines').autocomplete({source: suggestions});
    champRecherche.focus();
});




