var boutonFermer = document.getElementById("fermer");

boutonFermer.addEventListener('click', function(event) {
    self.port.emit("alerteVipBackendFermé");
}, false);

self.port.on("show", function() {
    boutonFermer.focus();
});




