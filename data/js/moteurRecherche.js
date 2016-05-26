var champAdresse = document.getElementById('adresseMoteurRecherche');
var optionModeEtendu = document.getElementById('modeEtendu');
var boutonFermer = document.getElementById('fermer');

boutonFermer.addEventListener('click', function () {
    self.port.emit('panelClosed', champAdresse.value, optionModeEtendu.checked);
}, false);

self.port.on('show', function (adresse, modeEtendu) {
    $('#fermer').button();
    $(champAdresse).attr('value', adresse);
    $(optionModeEtendu).attr('checked', modeEtendu);
    boutonFermer.focus();
});




