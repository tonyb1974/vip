# VIP

Amélioration de la **VIePrivée** des utilisateurs **Firefox** lors de la navigation sur Internet

Cette extension **Firefox** permet d'éviter la dispersion des données de l'utilisateur sur des domaines dont il n'a pas connaissance lors de connexions invisibles pour lui à différents domaines. Domaines dédiés le plus souvent au tracking ou à la publicité...

En effet, le plus souvent, les sites commerciaux utilisent le header HTTP **Access-Control-Allow-Origin** avec la valeur '*'.
Cette valeur permet de passer outre une protection normalement apportée par l'explorateur qui ne doit normalement pas accepter à partir d'une page d'un domaine de charger des ressources sur d'autres domaines.
Ceci permet notemment de lutter contre une attaque de type [Cross-Site-Scripting](https://en.wikipedia.org/wiki/Cross-site_scripting)


> Dans cette première version, le **User-agent** est transformé en date et heure de la requête et le **Referer** est vidé de sa valeur fournie par l'explorateur.

#Fonctionnement général

Cette extension, se base sur une **liste blanche** de **noms de domaines** qu'il est possible de visiter.
- Si un domaine est connu de l'utilisateur, il est possible de visiter les sites internet de ce domaine.
- Si un domaine est inconnu de l'utilisateur, l'extension bloque la requête et ajoute le domaine en question à la liste des domaines bannis. Une notification système indique à l'utilisateur que des domaines ont été bloqués.

La combinaison de touches **'Alt-c'** Permet à l'utilisateur de voir les domaines connus et les domaines bannis.
Il peut alors choisir de bannir un domaine connu ou d'ajouter un domaine banni aux domaines connus.

#Installation

Pour fonctionner sans se fonder sur le [LocalStorage](http://www.w3.org/TR/webstorage/) HTML5, les noms de **domaines autorisés** ou **bannis** sont stockés dans un cluster **Elasticsearch**(Moteur de recherche).

Ce moteur de recherche peut permettre à de nombreuses extensions de partager un stockage externe commun tout en proposant un moteur de recherche local utilisable par les utilisateurs du poste informatique.

- Télécharger l'application [Elasticsearch](https://www.elastic.co/downloads/elasticsearch)
- Si vous êtes expert, changez la configuration située dans le répertoire **'config/elasticsearch.yml'**
- Lancez [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) en mode service (démarera à chaque lancement du système)
- Exécuter les requêtes http suivantes à partir de [curl](http://man.cx/curl), [wget](http://man.cx/wget), l'extension firefox [HttpRequester](https://addons.mozilla.org/fr/firefox/addon/httprequester/) ou tout autre outil de construction de requêtes http

Installation d'un index de recherche des domaines autorisés:
```json
curl -XPUT http://localhost:9200/domaines -d '{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 0
  },
  "mappings": {
    "hote": {
      "properties": {
        "ip": {
          "type": "ip",
          "store": false
        },
        "date": {
          "type": "long",
          "store": false
        },
        "fuseau": {
          "type": "long",
          "store": false
        }
      }
    }
  }
```

Installation d'un index de recherche des domaines bannis:
```json
curl -XPUT http://localhost:9200/domaines_bannis -d '{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 0
  },
  "mappings": {
    "hote": {
      "properties": {
        "ip": {
          "type": "ip",
          "store": false
        },
        "date": {
          "type": "long",
          "store": false
        },
        "fuseau": {
          "type": "long",
          "store": false
        }
      }
    }
  }
```

#Paramètres

Dans le cas où l'installation du noeud [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) ne puisse être faite sur l'hôte local ou bien si l'on souhaite partager la liste blanche sur plusieurs machines, il est possible d'indiquer un nouveau chemin d'accès au moteur de recherche.

> Pour celà, visiter l'adresse **'about:config'** et confirmez votre volonté de modifier les paramètres du navigateur.
> 
> Ensuite, sous la clef **'extensions.vip.elastic'**, donner l'adresse http du noeud à interroger. Ex: **http://localhost:9200**

#Développement

Pour reprendre ce module et augmenter son code:

  1. CLoner ce repository **Git**
  2. Installer [NodeJs](https://nodejs.org/en/)
  3. Exécuter la commande **'npm install'**
  4. Modifier le code à l'aide de votre ide préféré (Betbeans, IntelliJ,...)
  5. Exécuter le projet en exécutant un **'jpm run'**

Voir la documentation [Mozilla Developper Network (MDN)](https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/SDK/Tools/jpm)
