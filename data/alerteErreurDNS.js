var boutonFermer = document.getElementById("fermer");

boutonFermer.addEventListener('click', function(event) {
    self.port.emit("alerteErreurDNSFermé");
}, false);

self.port.on("show", function(msg) {
    document.getElementById("msg").innerHTML = msg;
    boutonFermer.focus();
});




