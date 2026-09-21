# GRADNT — Audit comparatif et recentrage produit

Date : 21 septembre 2026  
Référence : dépôt `ac4ca16` et décisions produit transmises dans cette session.

## Verdict

GRADNT ne doit pas être vendu comme une nouvelle application de suivi de sorties.
Sa place est celle d’un **cockpit de progression cycliste** : il transforme un
objectif concret, un niveau réel et une disponibilité imparfaite en prochaine
action, puis explique ce qui change après chaque sortie.

La boucle commerciale à prouver est :

```text
objectif → état compréhensible → prochaine séance → sortie réelle
        → ressenti → bilan → adaptation proposée → progression visible
```

Le dépôt possède aujourd’hui les briques d’authentification, de connexion
Strava, d’activités, de feedback, de plan, de notifications et d’analyse IA.
L’écart principal est l’orchestration : les écrans exposent encore des morceaux
de produit, alors que la valeur doit être perçue en moins d’une minute sur la
Home.

## Comparaison concurrentielle

| Produit                | Force principale                                                                      | Limite exploitable pour GRADNT                                                      |
| ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Strava                 | réseau, historique, motivation sociale, découverte                                    | répond peu à « que dois-je faire cette semaine pour mon objectif ? »                |
| TrainingPeaks          | planification structurée, calendrier et profondeur coach                              | expérience experte, coûteuse et peu pédagogique pour un débutant                    |
| Intervals.icu          | analytics très riche, courbe de puissance, charge, outils gratuits                    | densité élevée, produit orienté analyse plutôt que décision quotidienne             |
| JOIN                   | plan adaptatif et disponibilité, positionnement coach                                 | moins différenciant sur la compréhension progressive, les ressentis et les parcours |
| Garmin Connect / Coach | intégration matérielle et écosystème                                                  | valeur maximale pour les utilisateurs Garmin, moins indépendante du matériel        |
| GRADNT                 | peut réunir progression, plan adaptatif, ressenti, parcours et explication accessible | doit démontrer une adaptation fiable et éviter de devenir un tableau de métriques   |

Ces concurrents confirment que la simple synchronisation Strava n’est pas une
valeur suffisante. La différence défendable est la **qualité de la décision
suivante**, expliquée avec des faits vérifiables et contrôlable par le cycliste.

## Ce qui est aligné avec le concept

- navigation Aujourd’hui / Progression / Plan / Parcours / Garage ;
- onboarding profil, objectif et disponibilités ;
- connexion GRADNT puis rattachement Strava côté serveur ;
- normalisation des activités et analyse déterministe ;
- notification après une sortie et formulaire de sensations ;
- saisie manuelle et import FIT original ;
- plans possiblement déplacés, ignorés et complétés ;
- interface mobile avec primitives GRADNT et divulgation progressive.

## Ce qui éloigne encore l’app de la promesse

### 1. La Home ne donne pas encore une réponse complète

Elle doit afficher, dans cet ordre :

1. objectif principal et progression fiable ;
2. état actuel expliqué (charge, fraîcheur, régularité, confiance) ;
3. prochaine action, avec raison et durée ;
4. état de la semaine (prévu / réalisé / restant) ;
5. une seule décision proposée par le Coach, jamais une conversation vide.

Les graphiques et les sorties récentes sont secondaires.

### 2. Le plan actuel ressemble encore à un calendrier généré

Il manque un vrai moteur de décision : blocs de progression, récupération,
disponibilités exceptionnelles, comparaison plan/réel et proposition visible
d’adaptation. Une séance terminée ne doit pas seulement passer à « completed ».

### 3. L’analyse de sortie doit rester utile sans IA

Pour chaque sortie, le détail doit répondre à :

- qu’est-ce qui s’est passé ;
- quelle qualité de donnée est disponible ;
- comment cela se compare à la période de référence ;
- quel est le prochain choix raisonnable.

Le bloc IA doit enrichir une analyse déjà vérifiable, jamais la remplacer.

### 4. Le flux post-sortie doit devenir la signature du produit

Notification → sensations en moins de 20 secondes → analyse → adaptation
proposée → validation utilisateur. Ce parcours doit être mesuré et testé sur
un débutant comme sur un cycliste équipé de puissance.

### 5. Les données sont encore trop dépendantes de la fenêtre Strava

Il faut afficher la fraîcheur, la provenance et la couverture de chaque état.
Un cycliste ne doit jamais croire que GRADNT a vu une puissance ou une séance
qui n’a pas été importée.

## IA et Strava : décision indispensable

La politique API Strava effective en 2026 interdit l’utilisation des données
Strava, directement ou indirectement, pour opérer une application IA. La règle
couvre les données dérivées, agrégées, les sorties de modèle, l’ingestion dans
un contexte et le RAG. Elle interdit aussi l’analytics produit construit à
partir de ces données. Voir [Strava API Policy, sections 5.3 et 5.4](https://www.strava.com/legal/api_policy).

Un consentement GRADNT ou un abonnement ne remplace pas cette autorisation
contractuelle. Envoyer l’historique Strava à Gemini pour générer un plan serait
donc une décision commercialement fragile et non livrable proprement avec la
seule API Strava.

Cela ne condamne pas le concept. L’architecture cible est :

```text
Strava → synchronisation → métriques déterministes GRADNT → état / progression
FIT, Garmin, saisie GRADNT → données possédées par GRADNT → Coach IA
profil, objectifs, disponibilités → Training Engine → plan adaptable
```

Pour que l’IA exploite l’historique réel, GRADNT doit proposer clairement un
parcours **Importer mes fichiers originaux** ou obtenir un accord séparé avec
Strava. Tant que cet accord n’existe pas, l’app ne doit pas promettre « analyse
IA de tes données Strava » dans le marketing.

## Priorités de développement corrigées

### P0 — rendre la boucle visible

- refondre la Home autour de l’objectif, l’état, la prochaine action et la
  semaine ;
- ajouter provenance, fraîcheur et couverture aux états calculés ;
- rendre le post-sortie notification → ressenti → détail irréprochable ;
- afficher la différence entre lecture déterministe et Coach IA.

### P1 — construire la valeur d’entraînement

- remplacer le motif de quatre semaines par blocs et récupération ;
- gérer disponibilités habituelles et exceptions ;
- comparer automatiquement sortie / séance prévue ;
- générer une proposition d’adaptation visible et validable ;
- produire un plan IA à partir d’un profil, d’objectifs, de disponibilités et
  de données FIT/Garmin/GRADNT possédées.

### P2 — gagner sur l’usage cycliste

- relier la séance suivante à trois parcours compatibles ;
- afficher distance, D+, surface, vent et niveau de tranquillité ;
- exporter GPX ;
- développer le garage seulement après validation de la boucle principale.

### P3 — commercialiser proprement

- instrumenter activation, première décision, feedback, adaptation acceptée,
  retour après sept jours et rétention à 30 jours ;
- lancer un pilote de 10 à 15 cyclistes débutants motivés et 5 cyclistes
  avancés ;
- tester un abonnement qui vend la décision et l’adaptation, pas le nombre de
  graphiques ;
- préparer confidentialité, suppression, support et provenance avant stores.

## Critères de réussite du prochain jalon

Un nouveau cycliste doit pouvoir :

1. créer son compte et définir un objectif en moins de cinq minutes ;
2. comprendre immédiatement son état et sa prochaine action ;
3. importer une sortie Strava et renseigner ses sensations ;
4. obtenir une analyse déterministe compréhensible ;
5. importer un FIT pour activer l’analyse IA complète ;
6. accepter ou refuser une adaptation du plan ;
7. expliquer en une phrase ce que GRADNT lui apporte par rapport à Strava.

La phrase cible est : **« GRADNT me dit où j’en suis, quoi faire maintenant et
comment adapter la suite à ma vraie vie. »**
