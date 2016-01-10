var boutonAjouter = document.getElementById("ajouter");
var boutonFermer = document.getElementById("fermer");

boutonAjouter.addEventListener('click', function(event) {
    self.port.emit("confirmationAjout", document.getElementById("nomDomaine").innerHTML);
}, false);

boutonFermer.addEventListener('click', function(event) {
    self.port.emit("ajoutAnnule");
}, false);

self.port.on("show", function(nomDomaine) {
    document.getElementById("nomDomaine").innerHTML = nomDomaine;
    boutonAjouter.focus();
});




