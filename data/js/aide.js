var boutonFermer = document.getElementById('fermer');

boutonFermer.addEventListener('click', function () {
    self.port.emit('panelClosed');
}, false);

self.port.on('show', function () {
    $(boutonFermer).button();
    boutonFermer.focus();
});




