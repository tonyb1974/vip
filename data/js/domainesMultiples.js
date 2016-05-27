var boutonFermer = document.getElementById('fermer');
var expressionRégulière = document.getElementById('expressionRégulière');

boutonFermer.addEventListener('click', function() {
    self.port.emit('panelClosed', expressionRégulière.value);
}, false);

self.port.on('show', function(nomsMultiples) {
    $(boutonFermer).button();
    $(expressionRégulière).attr('value', nomsMultiples);
    expressionRégulière.focus();
});




