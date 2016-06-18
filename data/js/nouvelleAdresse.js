var champAdresse = document.getElementById('adresse');
var boutonFermer = document.getElementById('fermer');
var boutonVisiter = document.getElementById('visiter');
var boutonFermer;

function adresseChoisie() {
    if (boutonFermer.clic === false) {
        self.port.emit('adresseChoisie', champAdresse.value);
    }
}

boutonFermer.addEventListener('click', function () {
    boutonFermer.clic = true;
    self.port.emit('panelClosed');
}, false);

boutonVisiter.addEventListener('click', function () {
    boutonFermer.clic = false;
    adresseChoisie();
}, false);

self.port.on('show', function (marquesPages) {

    boutonFermer.clic = false;
    var suggestions = [];
    
    for (var indexMarquePage in marquesPages) {
        suggestions.push(marquesPages[indexMarquePage]);
    }
    $(boutonFermer).button();
    $('#visiter').button();
    $('#adresse').autocomplete({source: suggestions, minLength: 1}).val('').focusout(adresseChoisie).change(adresseChoisie);
    champAdresse.focus();
});




