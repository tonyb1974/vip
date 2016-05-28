# VIP

Amélioration de la **VIePrivée** des utilisateurs **Firefox** lors de la navigation sur Internet

Cette extension **Firefox** permet d'éviter la dispersion des données de l'utilisateur sur des domaines dont il n'a pas connaissance lors de connexions, invisibles pour lui, à différents domaines. Domaines dédiés le plus souvent au tracking publicitaire...

En effet, le plus souvent, les sites commerciaux utilisent le header HTTP **Access-Control-Allow-Origin** avec la valeur '*'.
Cette valeur permet de passer outre une protection normalement apportée par l'explorateur qui ne doit normalement pas accepter de charger des ressources sur d'autres domaines que celui de la page originale.
Ceci permet notemment de lutter contre une attaque de type [Cross-Site-Scripting](https://en.wikipedia.org/wiki/Cross-site_scripting)


Dans cette première version:
 - le **User-agent** qui trahit votre système d'exploitation, votre navigateur et leurs versions respectives est transformé en date et heure de la requête
 - le **Referer** qui trahit le site qui vous envoie vers une page est vidé de sa valeur fournie par l'explorateur.
 - le **localStorage(dont l'usage est proche de celui d'un cookie)** est désactivé dans toutes les pages visitées.
 - Les **scripts** directement inclus dans les pages visitées sont désactivés
 - Un ensemble de **paramètres firefox** sont modifiés pour apporter une plus grande **sécurité** et de meilleurs **performances**. voir la liste [ici](https://github.com/dfkt/firefox-tweaks).
 - Un **mode étendu** permet de stocker les domaines autorisés et bannis dans un moteur de recherche comme **Elasticsearch**. Ce mode nécessite d'installer un **cluster Elasticsearch** accessible depuis le poste client où s'exécute **Firefox**
 - Ce **mode étendu** permet également de  stocker les **requêtes bloquées et non bloquées** à des fins de calculs statistiques et d'analyse de l'historique de navigation
 - Ce **mode étendu** permet également de stocker les **réponses reçues(requêtes non bloquées)** à des fins de calculs statistiques et d'analyse de l'historique de  navigation
 - La saisie de la liste blanche des domaines autorisés est complétée par un paramètre permettant de définir des **expressions régulières** séparées par des points-virgule. Ex: *.com pour autoriser tous les sites de nom de domaine finissant par .com

# Fonctionnement général

Cette extension, se base sur une **liste blanche** de **noms de domaines** qu'il est possible de visiter.
- Si un domaine est connu de l'utilisateur et autorisé par lui, il est possible de visiter les sites internet de ce domaine.
- Si un domaine est inconnu de l'utilisateur, l'extension bloque la requête et ajoute le domaine en question à la liste des domaines bannis. Une notification système indique à l'utilisateur que des domaines ont été bloqués.

La combinaison de touches **'Alt-a'** ou **'Alt-h'** permet à l'utilisateur d'accéder à l'aide en ligne du module

La combinaison de touches **'Alt-d'** permet à l'utilisateur de voir les domaines autorisés et les domaines bannis.
Il peut alors choisir de bannir un domaine connu ou d'ajouter un domaine banni aux domaines autorisés.

La combinaison de touches **'Alt-e'** permet de passer du mode standard au mode étendu avec un moteur de recherche **Elasticsearch**
Lors du passage en **mode étendu**, un panneau de configuration permet de saisir l'**adresse url** ainsi que le **port** d'écoute du **moteur de recherche**. Ex : **'http://localhost:9200'**
Une option permet de demander le stockage des **requêtes bloquées et non bloquées** ainsi que des **réponses reçues(requêtes non bloquées)**.

La combinaison de touches **'Alt-f'** permet d'**activer**/**désactiver** le filtrage des sites.
> Attention, L'anonymisation du **User-agent**, du **Referer**, la désactivation du **localStorage** et des **scripts** directement inclus dans les pages sont toujours actifs.

La combinaison de touches **'Alt-n'** permet de renseigner des **expressions régulières** correspondant à un ensemble de noms de domaine séparées par des points-virgule qui seront ajoutés à la **liste blanche des domaines autorisés**.
> Ex: Pouur le site 'http://www.pagesjaunes.fr/', des noms de domaines de la forme 'static5.pagesjaunes.fr' nécessaires aux ressources statiques sont refusés.
Saisir une expression régulière de la forme 'static[0-9]{0,1}\.pagesjaunes.fr' permet d'autoriser toutes les variantes des sous-domaines du site: 'static4.pagesjaunes.fr', 'static5.pagesjaunes.fr' , ...

La combinaison de touches **'Alt-p'** permet de revenir aux paramètres initiaux de Firefox ou d'appliquer une nouvelle fois les paramètres sécurisés.

Dans la version standard, sans mode étendu et moteur de recherche, seule la liste des domaines autorisés reste persistente entre deux exécutions de Firefox.

# Respect de la vie privée et des consignes de développement **Mozilla**

Ce plugin respecte les [usages en vigueur](https://www.mozilla.org/en-US/about/legal/acceptable-use/) sur les produits basés sur les outils **Mozilla**

Ce plugin est créé spécialement pour tenter d'améliorer encore le respect de la vie privée

Ce plugin sera soumis à signature sur la plateforme de gestion des plugins **Firefox**

Avant une diffusion plus large, il suivra notamment:
 - Le [process de signature](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox?as=u&utm_source=inproduct) des extensions
 - Un [process de revue de code](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox?as=u&utm_source=inproduct) pour vérification des consignes **Mozilla** de développement
 - Un [process de submission des sources](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox?as=u&utm_source=inproduct)

# Installation pour une utilisation en mode étendu

Pour fonctionner sans se fonder sur le [stockage de pamètres de Firefox](#), les noms de **domaines autorisés** ou **bannis** sont stockés dans un cluster **Elasticsearch**(Moteur de recherche).

Ce moteur de recherche peut permettre à de nombreuses extensions de partager un stockage externe commun tout en proposant un moteur de recherche local utilisable par les utilisateurs du poste informatique.

- Télécharger l'application [Elasticsearch](https://www.elastic.co/downloads/elasticsearch)
- Si vous êtes expert, changez la configuration située dans le répertoire **'config/elasticsearch.yml'**
- Lancez [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) en mode service (démarera le moteur de recherche à chaque lancement du système)
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

Installation d'un index pour les requêtes et réponses:
```json
curl -XPOST http://localhost:9200/requetes -d '{
  "settings": {
    "analysis": {
      "analyzer": {
        "analyse_chemin": {
          "type": "custom",
          "tokenizer": "path_hierarchy",
          "filter": [],
          "char_filter": []
        }
      }
    }
  },
  "mappings": {
    "requete": {
      "properties": {
        "date": {
          "type": "date",
          "format": "epoch_millis"
        },
        "fuseau": {
          "type": "long"
        },
        "idCorrellation": {
          "type": "long"
        },
        "urlVisitee": {
          "type": "string",
          "index": "not_analyzed"
        },
        "format": {
          "type": "string",
          "index": "not_analyzed"
        },
        "sécurité": {
          "type": "string",
          "index": "not_analyzed"
        },
        "methode": {
          "type": "string",
          "index": "not_analyzed"
        },
        "hote": {
          "type": "string",
          "index": "not_analyzed"
        },
        "port": {
          "type": "long"
        },
        "chemin": {
          "type": "string",
          "analyzer": "analyse_chemin",
          "search_analyzer": "keyword"
        },
        "corps": {
          "type": "string",
          "index": "not_analyzed"
        },
        "referer": {
          "type": "string",
          "index": "not_analyzed"
        },
        "mode": {
          "type": "string",
          "index": "not_analyzed"
        },
        "contexte": {
          "type": "string",
          "index": "not_analyzed"
        },
        "taille": {
          "type": "long"
        },
        "type": {
          "type": "string",
          "index": "not_analyzed"
        },
        "md5": {
          "type": "string",
          "index": "not_analyzed"
        },
        "utilisateur": {
          "type": "string",
          "index": "not_analyzed"
        },
        "de": {
          "type": "string",
          "index": "not_analyzed"
        },
        "auth": {
          "type": "string",
          "index": "not_analyzed"
        },
        "proxyAuth": {
          "type": "string",
          "index": "not_analyzed"
        },
        "origine": {
          "type": "string",
          "index": "not_analyzed"
        },
        "via": {
          "type": "string",
          "index": "not_analyzed"
        },
        "accès": {
          "type": "string",
          "index": "not_analyzed"
        }
      }
    },
    "reponse": {
      "properties": {
        "date": {
          "type": "date",
          "format": "epoch_millis"
        },
        "fuseau": {
          "type": "long"
        },
        "idCorrellation": {
          "type": "long"
        },
        "urlVisitee": {
          "type": "string",
          "index": "not_analyzed"
        },
        "sécurité": {
          "type": "string",
          "index": "not_analyzed"
        },
        "methode": {
          "type": "string",
          "index": "not_analyzed"
        },
        "hote": {
          "type": "string",
          "index": "not_analyzed"
        },
        "port": {
          "type": "long"
        },
        "chemin": {
          "type": "string",
          "analyzer": "analyse_chemin",
          "search_analyzer": "keyword"
        },
        "taille": {
          "type": "long"
        },
        "tps_chargement": {
          "type": "string",
          "index": "not_analyzed"
        },
        "type": {
          "type": "string",
          "index": "not_analyzed"
        },
        "status": {
          "type": "long"
        }
      }
    }
  }
}
```

#Développement

Pour reprendre ce module et augmenter son code:

  1. CLoner ce repository **Git**
  2. Installer [NodeJs](https://nodejs.org/en/)
  3. Exécuter la commande **'npm install jpm --global'**
  4. Modifier le code à l'aide de votre ide préféré (Netbeans, IntelliJ,...)
  5. Exécuter le projet en exécutant un **'jpm run'**

Voir la documentation [Mozilla Developper Network (MDN)](https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/SDK/Tools/jpm)

#Avantages

Voici une image qui présente la différence observée lors d'un chargement de la page d'un journal d'information grand public:

[Visualisation des avantages comparatifs de l'extension](https://github.com/tonyb1974/vip/blob/master/imgs/Avantages-comparatifs.png)

- En haut, le site chargé avec l'extension active
- En bas, le site chargé sans extension

A vous de voir ;-)
