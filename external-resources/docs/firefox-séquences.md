# Suivre un lien vers un autre domaine avec la commande 'ouvrir dans un nouvel onglet'

Firefox appelle d'abord la méthode open du nouvel onglet (tab.url est about:blank)
Firefox  exécute alors la requête http et passe par le listener (Le referer est le domaine avant sélection de la commande)
Firefox désactive l'ancien onglet
Firefox active le nouvel onglet (tab.url toujours vide)

# Créer un nouvel onglet vide

Firefox appelle d'abord la méthode open du nouvel onglet (tab.url est about:blank)
Firefox désactive l'ancien onglet
Firefox active le nouvel onglet (tab.url toujours vide)