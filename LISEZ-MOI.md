# VIP

Amélioration de la **VIePrivée** des utilisateurs **Firefox** lors de la navigation sur Internet

Cette extension **Firefox** permet d'éviter la dispersion des données de l'utilisateur sur des domaines dont il n'a pas connaissance lors de connexions, invisibles pour lui, à différents domaines. Domaines dédiés le plus souvent au tracking publicitaire...

En effet, le plus souvent, les sites commerciaux utilisent le header HTTP **Access-Control-Allow-Origin** avec la valeur '*'.
Cette valeur permet de passer outre une protection normalement apportée par l'explorateur internet qui ne doit normalement pas accepter de charger des ressources sur d'autres domaines que celui de la page originale.
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
 - La liste blanche n'est pas obligatoirement vérifiée pour les onglets ouverts pour pointer vers une adresse directement saisie par l'utilisateur ou bien lors de la navigation sur des liens s'ouvrant dans un nouvel onglet ou dans une nouvelle fenêtre. Les liens pointant sur l'intérieur du site fonctionnent bien sûr dans l'onglet courant.

# Fonctionnement général

Cette extension, accepte les noms de domaines, www.les-crises.fr par exemple, saisis ou suivis directement, via un lien hypertext, par l'utilisateur puis se base sur une **liste blanche** de **noms de domaines** pour déterminer les liens qu'il est possible de visiter de manière indirecte à partir de l'adresse originale.
- Si un domaine est connu de l'utilisateur et autorisé par lui, la page originale autorise le chargement de resources et scripts de ce site.
- Si un domaine est inconnu de l'utilisateur, l'extension bloque la requête et ajoute le domaine en question à la liste des domaines bannis. Une notification système indique à l'utilisateur que des domaines ont été bloqués.

Dû à la problématique de sécurité, ce module amène quelques restrictions d'usage contournées par de nouvelles fonctionnalités plus adaptées à la sécurité recherchée.

Pour expliquer ces contraintes, prenons quelques exemples pour comprendre les différentes options de correction du **mauvais usage** par les sites commerciaux du header HTTP **Access-Control-Allow-Origin**.
Normalement, à des fins de sécurité, un site A ne peut proposer dans ses pages que des liens vers des ressources ou scripts du domaine A.
Mais pour **monétiser** votre parcours et pour pouvoir **segmenter les consommateurs** en **scrutant** les comportements de tous, les site commerciaux ajoutent des liens vers des domaines chargés de:
 - noter votre passage (site de provenance, site visité, ...)
 - noter vos identifiants techniques (ip, fournisseur d'accès, version de système d'exploitation, version de navigateur, ...)
 - noter les paramètres de vos recherches
 - stocker des informations dans des cookies, petits fichiers pouvant contenir des données sur votre navigation, ou le localStorage de votre machine, espace de stockage interrogeable depuis une page html5.
 - d'agréger ces résultats pour en déduire des statistiques, des règles de comportement...
 - ...
 **Exemples de domaines de traçage:**  **logc202.xiti.com**, **www.googleadservices.com**,  **adnext.fr**, ...
Par défaut, un navigateur internet n'accepte pas ces liens externes... Sauf avec un header HTTP  **Access-Control-Allow-Origin** permissif.
Ainsi, une page issue d'un domaine de nom A peut maintenant contenir des liens vers des domaines B et C par exemple. Et c'est ce qui est problématique ...

Mais pourquoi ne pas faire une extension qui supprime seulement ce header de manière à être protégé et, surtout, sans avoir à saisir une liste blanche me direz-vous ?
Eh bien parce que de nombreux sites ont pris pour habitude d'avoir cette protection désactivée et certains d'entre eux ne fonctionneraient pas sans ce header.
 
1. Certains domaines proposent ainsi des sites ou les pages dynamiques sont séparées des ressources statiques (images, sons, vidéos, feuilles de style, ...)
Ainsi, un site du domaine A peut aller chercher des ressources ou scripts sur un domaine B appartenant à la même entreprise ou entité pour des raisons techniques mais sans considération pour votre sécurité...
**Exemple:** Le site du journal **latribune.fr** dont le nom de domaine est **www.latribune.fr** utilise des liens vers le domaine **static.latribune.fr** pour y chercher ses ressources statiques

2. Certains domaines incorporent du contenu extérieur mais réellement utile pour rendre un service.
**Exemple:** un site du domaine A devra incorporer un lien vers le domaine **www.youtube.com** pour toutes les vidéos incorporées sur la page.
Encore une fois, ce sont les coûts de stockage et le service rendu qui fait passer votre sécurité au second plan.

Alors comment faire ?
La liste blanche est-elle suffisante ?

Non, la liste blanche **n'est pas suffisante** pour vous **protéger** et présente le désavantage d'être **fastidieuse** à mettre à jour !
En effet, si je veux éviter que le site du domaine A ne me piste avec des liens vers le domaine **www.facebook.com**, il me suffit de ne pas l'ajouter à ma liste.
Mais si je souhaite réellement utiliser le site facebook, je suis alors obligé de l'ajouter à la liste blanche.
Je rencontre donc le comportement suivant:

1. Lorsque je visite le site facebook, les liens internes fonctionnent et tout va pour le mieux
2. Lorsque je visite un site A qui utilise des liens '+1' ou autres, facebook est 'au courant' de mon passage sur A...

Il convient donc d'utiliser une troisième voie qui part du principe que toute adresse à l'initiative de l'utilisateur doit être considérée comme acceptée mais que tout appel suivant dans la page doit appartenir au domaine initial ou à la liste blanche !

Cette extension part donc du principe que toute première adresse visitée sur un onglet est acceptée pour cet onglet. Elle y ajoute éventuellement les domaines autorisés dans la liste blanche.
Mais, et c'est là où est la restriction, il n'est pas possible de libérer un onglet de ce premier domaine saisi... Cela car il n'est pas possible de déterminer quand une page à finit de se charger et qu'une réinitialisation de ce domaine autrisé en cours de route pourrait pointer... ailleurs.

Ex:
- certains sites utilisent des requêtes asynchrones et régulières pour charger des morceaux de page. Réinitialiser le domaine autorisé pour laisser le prochain domaine demandé devenir valide peut poser problème. Un appel bloqué auparavant pourrait devenir actif et devenir le seul domaine accessible sur la page... Ce n'est pas ce que l'on veut. 
- certains autres proposent une icône à dessiner dans l'onglet courant de la page(favicon). Le problème est que le chargement de cette image ne se fait pas forcément dans le même temps que la page prinicpale. Ainsi, une fois réinitialisé le domaine accepté, le domaine de l'icône est potentiellement positionnée comme unique domaine autorisé...  
 
La contrainte est donc la suivante: une fois un **premier domaine** saisi pour un **onglet**, **seul** un lien vers vers ce domaine est **accepté** sans recours à la **liste blanche**. il n'est donc **plus possible** de naviguer vers **un autre domaine** qui ne soit pas dans la **liste blanche**.

**Exemples de limitations:**

- **Les liens** dans les **réponses** du moteur de recherche Google **ne fonctionneront pas** sans ajouter les sites trouvés à la **liste blanche**...
La raison à cela est que Google, pour intercepter un maximum de choses avant de vous laisser naviguer, **ne vous renvoie pas directement vers le site visé** mais vers **un de ses serveurs**, qui lui, vous redirigera finalement **vers le site cible**.
L'inconvénient est que le **domaine google** devient alors le domaine **autorisé par défaut du nouvel onglet** et le **site cible reste alors inaccessible** si non présent sur la **liste blanche**.
- Certains liens d'une page qui pointent **vers un autre domaine** peuvent être ouverts dans une **nouvelle fenêtre** mais pas dans la **page même**.

Pour **tempérer** cette **contrainte forte**, un raccourci **'Alt-v'** permet de saisir une nouvelle adresse à visiter. 
L'**extension** se chargeant de **supprimer l'onglet courant**, d'en **créer un nouveau** et de considérer le **domaine concerné** comme **autorisé directement** par l'**utilisateur**.

Dernier point, il est recommandé de ne pas mettre d'adresse comme **'www.latribune.fr'** dans les **domaines autorisés** de la **liste blanche** mais d'y mettre plutôt les **domaines annexes** qui permettent leur **fonctionnement** car il sont rarement référencés directement dans les pages des autres sites.
**Exemples:**
- ne pas mettre **www.latribune.fr** dans la liste blanche mais y mettre **static.latribune.fr**
- pour **youtube**, vous serez obligé de mettre **www.youtube.com** dans la liste blanche ainsi que des expressions régulières pour correspondre aux différents nom de domaines annexes comme  **s.ytimg.com**, **s1.ytimg.com**, **s2.ytimg.com**, ...
- ne pas mettre **www.facebook.com** dans la liste blanche mais y mettre **static.xx.fbcdn.net** si vous utilisez réellement ce site
- Qwant ne se mettant pas en intermédiaire entre l'utilisateur et le site trouvé lors des recherches, il est conseillé de l'utiliser en lieu et place de Google. Pour cella, ne pas mettre **qwant.com** dans la liste blanche mais y mettre **api.qwant.com**

La combinaison de touches **'Alt-a'** ou **'Alt-h'** permet à l'utilisateur d'accéder à l'aide en ligne du module

La combinaison de touches **'Alt-d'** permet à l'utilisateur de voir les domaines autorisés et les domaines bannis.
Il peut alors choisir de bannir un domaine connu ou d'ajouter un domaine banni aux domaines autorisés.

La combinaison de touches **'Alt-e'** permet de passer du mode standard au mode étendu avec un moteur de recherche **Elasticsearch**
Lors du passage en **mode étendu**, un panneau de configuration permet de saisir l'**adresse url** ainsi que le **port** d'écoute du **moteur de recherche**. Ex : **'http://localhost:9200'**
Une option permet de demander le stockage des **requêtes bloquées et non bloquées** ainsi que des **réponses reçues(requêtes non bloquées)**.

La combinaison de touches **'Alt-f'** permet d'**activer**/**désactiver** le filtrage des sites.
> Attention, L'anonymisation du **User-agent**, du **Referer**, la désactivation du **localStorage** et des **scripts** directement inclus dans les pages sont toujours actifs.

La combinaison de touches **'Alt-j'** permet d'**activer**/**désactiver** le filtrage des **scripts** directement inclus dans les pages.

La combinaison de touches **'Alt-n'** permet de renseigner des **expressions régulières** correspondant à un ensemble de noms de domaine séparées par des points-virgule qui seront ajoutés à la **liste blanche des domaines autorisés**.
> Ex: Pour le site 'http://www.pagesjaunes.fr/', des noms de domaines de la forme 'static5.pagesjaunes.fr' nécessaires aux ressources statiques sont refusés.
Saisir une expression régulière de la forme 'static[0-9]{0,1}\\.pagesjaunes.fr' permet d'autoriser toutes les variantes des sous-domaines du site: 'static4.pagesjaunes.fr', 'static5.pagesjaunes.fr' , ...

La combinaison de touches **'Alt-p'** permet de revenir aux paramètres initiaux de Firefox ou d'appliquer une nouvelle fois les paramètres sécurisés.

La combinaison de touches **'Alt-v'** permet de fermer l'onglet actuellement ouvert pour en ouvrir un autre qui accepte une première et unique adresse non obligatoirement présente dans la **liste blanche**.
La boîte de dialogue proposée permet de saisir une adresse libre ou bien d'en choisir une à partir des marques pages existants. Des raccourcis permettent de ne pas utiliser la souris. Focus sur le champs de saisie, touche haut et bas pour se déplacer dans la liste des adresses des marques pages, touche entrée pour sélectionner une valeur puis touche entrée pour visiter l'adresse saisie.

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
  6. Création d'un xpi en exécutant **'jpm xpi'**. Attention, l'installation n'est pas possible dans firefox jusqu'à ce que l'une des conditions suivantes soit remplie:
    - Le plugin est signé par la **fondation Mozilla** après relecture du code
    - Le plugin est signé par le **développeur**, pour les testeurs en avant-première, mais ne peut être proposé sur le site **'addons.mozilla.org'** car le dévelopeur le distribue lui-même. Pour tester une telle version, il est conseillé de créer un [nouveau profil de test firefox](https://support.mozilla.org/fr/kb/utiliser-gestionnaire-profils-creer-supprimer-profils#w_craeer-un-profil)
    - le code est exécuté dans le répertoire du projet grâce au script **'vip-dev.sh'** une fois les chemins vers l'exécutable et le profil firefox à utiliser mis à jour.

Voir la documentation [Mozilla Developper Network (MDN)](https://developer.mozilla.org/fr/docs/Mozilla/Add-ons/SDK/Tools/jpm)

#Avantages

Voici une image qui présente la différence observée lors d'un chargement de la page d'un journal d'information grand public:

[Visualisation des avantages comparatifs de l'extension](https://github.com/tonyb1974/vip/blob/master/imgs/Avantages-comparatifs.png)

- En haut, le site chargé avec l'extension active
- En bas, le site chargé sans extension

A vous de voir ;-)
