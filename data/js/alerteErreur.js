var boutonFermer = document.getElementById('fermer');

boutonFermer.addEventListener('click', function() {
    self.port.emit('alerteErreurFermé');
}, false);

self.port.on('show', function(msg) {
    document.getElementById('msg').innerHTML = msg;
    $(boutonFermer).button();
    boutonFermer.focus();
});




