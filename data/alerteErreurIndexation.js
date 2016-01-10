var boutonFermer = document.getElementById("fermer");

boutonFermer.addEventListener('click', function(event) {
    self.port.emit("alerteErreurIndexationFermé");
}, false);

self.port.on("show", function() {
    boutonFermer.focus();
});




