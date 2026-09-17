# GRADNT — Audit produit et plan de commercialisation

Date : 17 septembre 2026. Révision du dépôt auditée : `d01f66a`.

## 1. Décision recommandée

**GRADNT possède un socle produit cohérent, mais n’est pas encore prêt à être vendu comme un service d’entraînement adaptatif.** La priorité est de rendre fiable et utile une boucle complète : objectif → prochaine action → sortie réalisée → retour du cycliste → adaptation expliquée → progression observable.

La question produit, « Où suis-je par rapport à mes objectifs, et que dois-je faire ensuite ? », est bonne. Elle rejoint précisément la boucle figée dans le chat transmis : « où j’en suis → où je veux aller → ce que je dois faire maintenant → adaptation après chaque sortie ». L’implémentation répond déjà partiellement à la première moitié et propose un calendrier pour la seconde. Elle ne relie pas encore réellement les deux.

La commercialisation solide exige trois preuves, dans cet ordre :

1. Les données et le calendrier restent justes dans le temps.
2. Les conseils font prendre de meilleures décisions et donnent envie de revenir.
3. Un segment précis accepte de payer pour cette valeur récurrente.

**Segment de lancement proposé : cyclistes route débutants motivés et amateurs réguliers préparant un premier défi concret, avec un emploi du temps variable.** Les compétiteurs avancés doivent participer à la validation dès le début. L’offre destinée aux professionnels constitue une étape distincte, exigeant une validation métier et des outils de collaboration avec leur entraîneur.

Ce ciblage est une hypothèse à tester, pas une conclusion issue d’entretiens déjà réalisés. Préserver la profondeur nécessaire aux experts dans le modèle de données et les calculs, puis l’exposer progressivement.

## 2. Périmètre et limites de l’analyse

### Sources effectivement utilisées

- Instructions produit et marque de [AGENTS.md](../AGENTS.md).
- Routes, écrans, composants du design system, hooks, modèles et fonctions métier dans `apps/mobile/src`.
- Services Strava, FTP, plans, stockage local, notifications et Explore.
- Configuration mobile, dépendances, tests existants et fonctions Edge dans `supabase`.
- Documentation du dépôt et spécification des notifications.
- Extrait détaillé de la conversation ChatGPT fourni directement par l’utilisateur pendant l’audit : 37 sections de cadrage produit, architecture, roadmap et définition du MVP. La comparaison porte sur cet extrait ; le reste de la conversation n’a pas été récupéré.
- Pages officielles des concurrents et règles officielles des plateformes, consultées le 17 septembre 2026. Les offres peuvent changer.

### Conversation ChatGPT demandée

Lien fourni : <https://chatgpt.com/c/6a9eaab7-072c-83eb-85c8-60efbd6ea148>.

L’outil de lecture n’a pas pu récupérer directement cette conversation. La recherche de connecteurs n’a pas identifié d’accès pertinent à l’historique ChatGPT. **L’utilisateur a ensuite transmis l’extrait de cadrage dans cette session : il est bien intégré à cet audit.** Les décisions historiques ci-dessous sont attribuées à cet extrait, sans prétendre avoir lu toute la conversation privée. Ses exemples chiffrés sont des maquettes de comportement, pas des résultats validés ni des prescriptions d’entraînement.

### Vérifications effectuées

| Vérification                       | Résultat                       | Ce que cela prouve                                                     |
| ---------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `pnpm lint`                        | Réussi                         | L’application passe les règles ESLint configurées.                     |
| `pnpm typecheck`                   | Réussi                         | Le périmètre TypeScript mobile configuré compile sans erreur de types. |
| `pnpm test`                        | 28 fichiers, 274 tests réussis | Les comportements couverts par les tests existants passent.            |
| Inspection iOS avec `agent-device` | Impossible : commande absente  | Aucun parcours sur simulateur validé pendant cet audit.                |

Les résultats ne prouvent ni la justesse physiologique des prescriptions, ni la fiabilité sur appareils, ni une validation de production. Les scripts lint et typecheck racine ciblent le mobile ; ils ne constituent pas une validation indépendante des fonctions Deno. Aucun déploiement, compte développeur, quota réel, abonnement, entretien utilisateur ou test de paiement n’a été vérifié. L’identité visuelle a été examinée dans les composants et tokens, sans revue visuelle complète sur téléphone.

Les problèmes détaillés plus bas sont des constats de lecture du code et leurs conséquences déduites ; ils ne sont pas tous reproduits dans un environnement mobile réel.

## 3. État réel de l’app et écart avec le concept

| Domaine                 | Présent dans le dépôt                                                                                                                                           | Écart à combler pour vendre                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marque et design system | Primitives GRADNT, thèmes clair/sombre, tokens, assets Soft Topography, typographie et haptique                                                                 | Vérifier contrastes, lecteurs d’écran, texte agrandi et cohérence des graphiques. L’identité est un atout de reconnaissance, pas encore une preuve d’utilité.                       |
| Architecture            | Routes généralement fines, écrans dédiés, domaine typé, services séparés, validation Zod                                                                        | Le domaine importe encore certains types du feature onboarding et de l’i18n ; clarifier ces frontières à mesure que le moteur devient autonome.                                     |
| Onboarding              | Profil, objectif, disponibilités, connexion Strava facultative, notifications, récapitulatif ; reprise locale                                                   | Sept étapes avant l’usage. FTP à 280 W présélectionnée, date d’événement absente du parcours initial, minimum de 45 min par créneau. Accessibilité débutant à améliorer.            |
| Compte GRADNT           | Profil local et connexion OAuth Strava                                                                                                                          | Aucun compte GRADNT ni sauvegarde cloud métier observés. Définir récupération, synchronisation, identité et rattachement des achats. Strava OAuth ne remplace pas un compte GRADNT. |
| Strava                  | Connexion réelle, vérification `state`, échange et renouvellement côté serveur, jetons dans le trousseau natif, normalisation des activités, erreurs distinctes | Pas de webhook observé. Import à l’ouverture sur une fenêtre glissante de 12 semaines. Capacité réelle et conformité du futur produit à établir.                                    |
| FTP                     | Historique daté, saisie, correction, suppression ; déduction à partir des zones Strava soumise à confirmation                                                   | Ce n’est pas une détection de FTP à partir des performances. La provenance de l’historique n’est pas toujours conservée dans les valeurs affichées.                                 |
| Objectifs               | FTP, distance, dénivelé, forme, événement ; distinction cumul/meilleure sortie dans les réglages                                                                | Baseline, période et identité durables manquent. « Forme » mesure du volume ; un événement mesure un compte à rebours, pas la préparation.                                          |
| Accueil                 | Objectif, séance suivante, données réelles, comparaisons de volume/distance/sorties, conseil déterministe                                                       | « En bonne voie » dépend de la présence d’une valeur. Le conseil observé décrit surtout un nombre de sorties. Pas encore d’évaluation de trajectoire.                               |
| Progression             | Séries calculées à partir des sorties, volume, régularité, objectif                                                                                             | Aucun moteur CTL/ATL/TSB, charge individualisée, courbe de puissance ou estimation de confiance observé. Quelques libellés ne correspondent pas à la période calculée.              |
| Plan                    | Générateur déterministe sur quatre semaines ; terminer, ignorer, déplacer d’un jour ; modifications locales persistées                                          | Motif répété, calendrier régénéré depuis aujourd’hui, pas de périodisation, adaptation à la fatigue ou aux sorties supplémentaires.                                                 |
| Séances                 | Fiche avec durée, intensité, structure textuelle et raison liée au type d’objectif                                                                              | Pas de blocs d’intervalles métier, joueur de séance, cibles individualisées, export structuré ni rapprochement automatique activité/séance observés.                                |
| Notifications           | Préférences, rappels locaux, résumé, inactivité, jalons, réconciliation et tests                                                                                | À éprouver sur iOS/Android, fuseaux et changements de plan ; les séances déplacées sont exclues des rappels de séance.                                                              |
| Explore                 | Géolocalisation, cartes natives, vraies propositions HeiGIT/ORS, surfaces, ascensions, filtres et classement déterministe                                       | Pas de sauvegarde/export GPX/navigation observés. Intention choisie manuellement, pas de lien actif avec la prochaine séance. Routage web désactivé.                                |
| Garage                  | Écran Beta et explications                                                                                                                                      | Bouton « Ajouter un vélo » sans action. Feature non fonctionnel à retirer de la navigation commerciale tant qu’il n’apporte pas de valeur.                                          |
| IA                      | Architecture produit voulue dans les instructions                                                                                                               | Aucun service d’inférence/coaching IA opérationnel observé. Établir la politique des sources avant sa construction.                                                                 |
| Exploitation et vente   | Socle de tests et configuration mobile                                                                                                                          | Pas de chaîne CI, configuration EAS, télémétrie de crash ou paiement identifiés dans les fichiers audités. Statut réel des comptes stores inconnu.                                  |

Attention au nom `MockGradntRepository` : malgré son nom, ce repository lit le profil local et des activités Strava réelles. **L’app n’est pas entièrement une démonstration.** Le renommage est un nettoyage de compréhension ; il ne remplace pas les corrections métier.

### Comparaison précise avec les décisions du chat transmis

« Aligné » signifie que la direction est conservée ; cela ne signifie pas que le résultat a été validé sur téléphone ou auprès de cyclistes.

| Décision historique du chat                                                                                | État mobile constaté                                                                                       | Écart et traitement recommandé                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App privée route, cockpit de progression, pas de feed                                                      | Aligné : objectif et prochaine séance structurent l’accueil                                                | Conserver cette hiérarchie et éviter les refontes vers un journal d’activités.                                                                                                                 |
| Profil réel et état forme/charge/fraîcheur/progression                                                     | Partiel : profil déclaratif, volume et régularité                                                          | Construire `CyclistState` et ses limites ; ne pas fabriquer ces états à partir du seul volume.                                                                                                 |
| Simple par défaut, détails avancés au tap                                                                  | Partiel : vocabulaire accessible et cartes, peu de profondeur métier                                       | Ajouter méthode, couverture, références et détails seulement quand calculables.                                                                                                                |
| Courbe de puissance aux durées définies, périodes 30/90 jours/année/record                                 | Absent des calculs et écrans observés ; source actuelle limitée aux résumés et à 12 semaines               | Créer une filière de séries temporelles autorisées, records datés et courbe ; ajouter les durées du chat comme preset.                                                                         |
| Scores sprint/anaérobie/VO₂max/seuil/endurance sur 100                                                     | Absent                                                                                                     | Définir population de référence, méthode et incertitude avant affichage ; ces scores illustratifs ne deviennent pas une vérité physiologique.                                                  |
| FTP estimée avec intervalle, acceptation ou conservation de la FTP actuelle                                | Partiel : saisie et déduction depuis zones Strava avec confirmation                                        | Ajouter estimation sur performances autorisées et validation ; préserver FTP effective, estimation, date et décision utilisateur.                                                              |
| Objectifs performance, volume, challenge, épreuve, libre                                                   | Partiel : cinq types, pas de W/kg, puissance sur durée, heures/sorties ciblées ou objectif libre structuré | Garder toutes les familles dans le backlog ; prioriser les défis compris par le segment initial, puis ajouter chaque mesure correctement.                                                      |
| Plusieurs objectifs, un principal, secondaires                                                             | Absent : un objectif local                                                                                 | Persister une collection, priorité et relations au plan ; gérer incompatibilités sans optimiser silencieusement tous les objectifs à la fois.                                                  |
| Épreuve avec date, distance, D+, ambition                                                                  | Partiel : nom saisi, date possible dans les réglages, contexte incomplet dans le domaine                   | Compléter le modèle et le parcours avant de promettre préparation spécifique.                                                                                                                  |
| Horizon jusqu’à 24 semaines, blocs de 3–5 semaines, semaine détaillée                                      | Absent : quatre semaines de motif identique                                                                | Ajouter horizon et blocs, laisser le lointain peu détaillé ; les quatre semaines actuelles ne constituent pas un macrocycle.                                                                   |
| Récupération adaptative selon réel, fatigue et disponibilité                                               | Absent : séance recovery dans un motif                                                                     | Distinguer une séance facile d’une semaine de récupération et définir des règles métier relues.                                                                                                |
| Disponibilités habituelles + exceptions et créneaux supplémentaires                                        | Partiel : planning d’onboarding, déplacement d’un jour                                                     | Ajouter règles habituelles, exceptions datées et replanification, sans refaire l’onboarding.                                                                                                   |
| Séances guidées/structurées et lieu indoor/outdoor/indifférent                                             | Partiel : description et intensité textuelles ; aucune préférence de lieu métier identifiée                | Ajouter blocs, variantes et choix de lieu ; tester les exports réellement supportés.                                                                                                           |
| Analyse après chaque sortie, comparaison prévu/réalisé, adaptation                                         | Absent de bout en bout ; import et complétion manuelle présents                                            | C’est le principal chantier du MVP commercial, avant les extensions.                                                                                                                           |
| Parcours boucle, A→B, waypoints, trois variantes                                                           | Partiel : boucles réelles ; faux A→B avec même point ; pas de waypoints observés                           | Supporter les modes réellement exposés ; viser trois variantes valides, tout en autorisant moins ou aucune avec explication.                                                                   |
| RouteScore : séance 25 %, cyclabilité 20 %, circulation 20 %, surface 15 %, D+ 10 %, vent 5 %, variété 5 % | Différent : distance 25 %, D+ 15 %, surface 15 %, intention 30 %, exposition 15 %                          | Documenter cette divergence. Les poids du chat sont une hypothèse initiale ; comparer aux choix de cyclistes et à la couverture des données avant de les figer.                                |
| Quiet Score enrichi, météo/vent et itinéraires connus/nouveaux                                             | Partiel pour exposition par types de voies ; météo, vent et historique non observés                        | Enrichir après validation du routage utile, en conservant unknown et données partielles.                                                                                                       |
| Valhalla et MapLibre GL JS                                                                                 | Différent : HeiGIT/ORS et MapLibre natif                                                                   | Garder l’existant pour les essais ; comparer qualité, contrôle, coûts et exploitation avant une éventuelle migration.                                                                          |
| Coach global avec fonctions Profile/Activity/Training/Adapter/Route                                        | Absent                                                                                                     | Conserver les responsabilités comme contrats métier ; ne pas créer six agents complexes avant que leurs entrées et validations existent.                                                       |
| Garage Beta minimal, composants et alertes ; pression pneus ultérieure                                     | Présentation Beta, aucun ajout de vélo opérationnel                                                        | Conserver l’extension après le cœur ; masquer l’onglet commercial ou livrer une vraie bêta minimale. Pression reste différée.                                                                  |
| Notifications sobres liées au service, pas de relance pour simple absence d’ouverture                      | Partiel : notifications locales de séance/bilan/jalons ; nudge après quatre jours sans sortie connue       | Réévaluer le nudge, facultatif et jamais culpabilisant. Ne pas assimiler absence de sortie et besoin de s’entraîner ; pas d’alerte maintenance/analyse sans service effectif.                  |
| Auth email/Google et compte propre                                                                         | Absent ; OAuth Strava et profil local seulement                                                            | Garder un compte indépendant des fournisseurs, ou définir explicitement la récupération sans compte ; vérifier le parcours des achats.                                                         |
| Tout l’historique avec chargement progressif des streams et snapshots                                      | Différent : résumés sur 12 semaines, sans base métier persistante                                          | Prévoir historique progressif uniquement pour les sources permettant sa conservation et son usage ; revoir le pipeline historique Strava proposé.                                              |
| Local/staging/production, GitLab CI/CD, build et smoke tests                                               | Non identifié comme chaîne livrée dans les fichiers audités                                                | Introduire la CI sur l’hébergeur existant ; GitLab est la préférence du chat, pas une configuration déjà démontrée.                                                                            |
| PWA web, Next/shadcn/Better Auth, app native explicitement différée                                        | Divergence majeure : Expo/React Native/Tamagui déjà retenus dans AGENTS.md                                 | Traiter le chat comme cadrage historique. Recommandation : commercialiser le mobile actuel, préserver l’architecture métier et ne pas reconstruire en Next pour satisfaire une stack ancienne. |
| Topo Clay, neutres + vert électrique                                                                       | Direction conservée, affinée en Soft Topography avec vert unique et rôles de lisibilité                    | Les instructions de marque actuelles précisent le concept. Ne pas revenir au vert fluorescent ni supprimer `accentInk`.                                                                        |

Le chat n’apporte pas de preuve de supériorité concurrentielle, de volonté de payer ou de validité des estimations « +7 % » et « encore 6–8 semaines ». Il apporte une intention produit claire. L’audit distingue cette intention, le logiciel livré et les résultats à obtenir.

## 4. Comparaison avec les offres actuelles

Les caractéristiques suivantes sont celles annoncées par leurs éditeurs. Elles n’ont pas été comparées par des essais pratiques pendant cet audit. Les bénéfices et résultats promotionnels des concurrents ne sont pas des preuves indépendantes.

| Offre                | Valeur annoncée et repère tarifaire                                                                                                                                                                                                                        | Implication pour GRADNT                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strava               | Interprétation personnalisée des activités via Athlete Intelligence. [Source officielle](https://press.strava.com/en-gb/articles/stravas-athlete-intelligence-translates-workout-data-into-simple-and)                                                     | Résumer une sortie en langage simple ne suffit pas à différencier GRADNT. Centrer la valeur sur une décision liée au projet du cycliste.                              |
| JOIN                 | Plans selon objectifs, forme et disponibilités ; adaptation avec données de séance, effort perçu et readiness. 16,99 €/mois ou 119,99 €/an. [Fonctionnement](https://join.cc/why-join), [tarifs](https://join.cc/pricing)                                  | Concurrent direct. Simplicité et adaptation à la vie quotidienne sont déjà promises ; notre avantage doit être démontré en usage.                                     |
| TrainerRoad          | Plans adaptatifs, analyse des sorties extérieures, détection de FTP, séances transférables sur appareils. 21,99 $/mois ou 209,99 $/an. [Source officielle](https://www.trainerroad.com/)                                                                   | Se positionner uniquement sur « entraînement + IA » placerait GRADNT face à une offre déjà profonde.                                                                  |
| TrainingPeaks        | Planification, analyse, suivi de forme et communication avec le coach. Premium : 19,95 $/mois ou 134,99 $/an ; coaching vendu séparément. [Source officielle](https://www.trainingpeaks.com/pricing/for-athletes/)                                         | Pour les pros, la fiabilité, les exports et le travail avec l’entraîneur priment sur l’ajout de graphiques.                                                           |
| Intervals.icu        | Analyse, charge, calendrier, constructeur de séances et courbes de puissance ; socle gratuit, Supporter à 4 $/mois. [Source officielle](https://www.intervals.icu/pricing/)                                                                                | Un tableau de bord de métriques seul sera difficile à vendre. Il faut réduire le travail d’interprétation et de décision.                                             |
| komoot               | Planification par sport, surfaces, dénivelé, navigation et cartes hors ligne. [Fonctionnalités](https://www.komoot.com/features), [détails du planificateur](https://support.komoot.com/hc/en-us/articles/10194270667034-Plan-routes-on-the-website)       | Un générateur de boucles ne constitue pas un avantage suffisant. Tester l’intérêt d’un parcours adapté à une séance précise.                                          |
| Garmin Cycling Coach | Plans adaptés aux performances, à la récupération et aux exigences du parcours ; matériel compatible, cardio et puissance requis pour ce programme. [Source officielle](https://www.garmin.com/en-US/garmin-technology/garmin-coach/garmin-cycling-coach/) | Rendre le produit utile sans capteur est une piste, mais pas une exclusivité à revendiquer. L’intégration au matériel devient essentielle pour les cyclistes équipés. |

Les prix sont des repères affichés sur les pages consultées, dans leur devise d’origine. Ils ne sont pas normalisés pour taxes, pays, stores ou promotions.

### Valeur ajoutée à construire et à prouver

Proposition de positionnement :

> GRADNT t’aide à préparer ton prochain défi à vélo : tu comprends ta progression, tu sais quoi faire aujourd’hui et ton programme s’ajuste à tes sorties et à ton temps disponible, avec une explication à chaque changement.

Quatre leviers à valider :

1. **Compréhension immédiate** : une décision et une raison intelligibles avant les données détaillées.
2. **Continuité entre objectif, séance et terrain** : passer du « pourquoi » à une séance puis, lorsque pertinent, à un parcours exploitable.
3. **Adaptation sous contrôle** : changements visibles, alternatives, refus, retour à la version précédente et prise en compte du choix du cycliste.
4. **Profondeur progressive** : même moteur rigoureux, présentation simple pour le débutant et méthodes consultables pour l’expert.

Ces leviers se recoupent avec des offres existantes. L’opportunité est la qualité de leur combinaison et de leur exécution, pas une fonctionnalité supposée absente partout ailleurs. Leur pertinence doit se mesurer face aux outils réellement utilisés par les testeurs.

L’avantage durable potentiel repose sur un moteur validé, une bibliothèque de séances experte, la confiance dans les explications et la compréhension des contraintes des utilisateurs. Les couleurs, un chatbot et des métriques classiques ne suffisent pas.

## 5. Dépendance Strava : décision préalable à l’IA et au modèle économique

La politique API effective au 1er juin 2026 interdit l’utilisation des données Strava et de leurs dérivés pour l’exploitation d’applications d’IA, notamment leur introduction dans un contexte de modèle. Elle limite le cache à sept jours et impose de refléter les suppressions sous 48 heures. Les usages analytiques et la facturation sont également encadrés. Le MCP Strava personnel n’autorise pas un usage commercial tiers. [Politique officielle, §§ 3.5, 5.3–5.8, 6.2–6.3](https://www.strava.com/legal/api_policy).

**Conséquence de conception proposée : ne pas fonder le coaching IA commercial sur les données obtenues via l’API Strava.** Un consentement utilisateur ne constitue pas une autorisation contractuelle du fournisseur. L’anonymisation ou l’envoi des seules métriques dérivées n’est pas un contournement à retenir.

Actions :

- [ ] Cartographier tous les usages prévus : calculs personnels, planification, IA, mesures produit, export et accès coach.
- [ ] Faire examiner leur compatibilité contractuelle et obtenir les clarifications écrites nécessaires ; ne pas présumer que les calculs déterministes actuels ou leur monétisation sont autorisés.
- [ ] Vérifier la provenance et le traitement de la FTP déduite des zones, conservée dans l’historique local.
- [ ] Décider d’une architecture de sources : données saisies directement, fichiers originaux issus d’un appareil, intégrations directes approuvées, Strava limité aux usages validés.
- [ ] Propager la source et les restrictions jusque dans les métriques dérivées, sauvegardes, logs et contextes IA.
- [ ] Prévoir un fonctionnement utile quand Strava est indisponible ou non connecté.

Chaque source alternative demande sa propre vérification des droits ; récupérer le même contenu via un intermédiaire ne supprime pas les obligations attachées à son origine. Modifier la priorité actuelle « Strava source principale » demande une décision produit documentée, puisqu’elle figure dans AGENTS.md.

Les nouvelles apps commencent avec un accès individuel, puis peuvent demander un accès à dix athlètes ; au-delà, une revue est nécessaire. Vérifier la capacité effective du projet avant de recruter une cohorte. [Guide officiel Strava](https://developers.strava.com/docs/getting-started/).

Les quotas sont partagés par application et les augmentations ne sont pas garanties. Prévoir ingestion incrémentale, webhooks et gestion des limites à partir des en-têtes réels, plutôt qu’un import complet répété. [Limites officielles](https://developers.strava.com/docs/rate-limits/).

La revue du produit doit aussi examiner les restrictions de concurrence et d’affichage. **L’absence de feed social ne suffit pas à garantir l’acceptation de GRADNT.** [Accord API officiel](https://www.strava.com/legal/api).

## 6. Corrections prioritaires identifiées dans le code

P0 = bloque la confiance, l’architecture autorisée ou une ouverture payante. P1 = nécessaire à une première version utile et vendable. P2 = extension après validation. Les priorités portent sur un lancement commercial ; elles n’interdisent pas une recherche utilisateur encadrée.

| ID  | Priorité | Constat et preuve locale                                                                                                                                                                                     | Action et critère d’acceptation                                                                                                                                                                                                                         |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | P0       | `plan.repository.ts` génère depuis `new Date()` à chaque lecture ; `first-plan.ts` trie les créneaux depuis cette date et réutilise `first-plan-<semaine>-<index>`. Les overrides ne connaissent que cet ID. | Persister un plan avec date d’ancrage, identités de séances durables, versions et historique. Une séance terminée jeudi ne doit jamais devenir une séance terminée samedi parce que l’app est rouverte vendredi.                                        |
| A02 | P0       | `getNextWorkout()` retourne le premier statut `planned`, sans tri ni contrôle de date ; `notification-plan.ts` filtre aussi uniquement `planned`.                                                            | Traiter `planned` et `moved` comme séances à venir, trier par date, définir les séances échues. Une séance déplacée reste visible et rappelée, sans proposer une séance passée comme prochaine action.                                                  |
| A03 | P0       | `HomeScreen.tsx` affiche `onTrack` dès que `currentGoalValue` n’est pas nul.                                                                                                                                 | Définir des états déterministes et une confiance : inconnu, données insuffisantes, progression observée, trajectoire évaluée. Ne jamais afficher « En bonne voie » sur la seule présence d’une mesure.                                                  |
| A04 | P0       | `getWeeklyRideCount()` retourne `activities.length`. `ProgressScreen.tsx` l’utilise pour « cette semaine », sur une source chargée sur 12 semaines.                                                          | Calculer explicitement chaque période. Même fenêtre pour valeur, libellé et comparaison ; des sorties anciennes ne changent pas le compteur hebdomadaire.                                                                                               |
| A05 | P0       | `getIntensityDistribution()` affecte toute la durée d’une activité à une zone selon puissance pondérée ou moyenne / FTP. Le schéma Strava ne conserve pas `device_watts`.                                    | Distinguer classe d’intensité globale d’une sortie et temps passé en zones. Pour le second, utiliser des séries temporelles autorisées et des zones datées. Séparer puissance mesurée et estimée ; ne pas présenter une approximation comme une mesure. |
| A06 | P0       | `gradnt.repository.ts` recrée `createdAt` pour les objectifs ; cumul et meilleure sortie utilisent toute la fenêtre chargée.                                                                                 | Persister création, baseline et intervalle d’évaluation de l’objectif. Un défi créé aujourd’hui ne se retrouve pas terminé par des sorties antérieures non choisies ; le progrès acquis ne disparaît pas à cause d’une fenêtre glissante.               |
| A07 | P0       | `getCurrentGoalValue()` exige des activités avant de lire une FTP ; une valeur disponible devient `observed`, même si elle était saisie manuellement.                                                        | Lire la FTP indépendamment des sorties, conserver sa source et sa date. Une FTP déclarée sans activité reste disponible et clairement déclarée.                                                                                                         |
| A08 | P0       | Profil, objectif et disponibilités sont sauvegardés via `void saveOnboardingSnapshot()` ; les services relisent le disque. Certaines actions refetchent immédiatement.                                       | Garantir la fin de l’écriture avant navigation/refetch, sérialiser les sauvegardes et gérer les erreurs. Aucune modification perdue ou lecture de l’ancien profil après sauvegarde rapide.                                                              |
| A09 | P0       | `first-plan.ts` n’utilise ni expérience, ni demande réelle de l’événement, ni historique pour choisir les types ; les créneaux intermédiaires sont Sweet Spot, répétées chaque semaine.                      | Définir prescriptions et contraintes avec un entraîneur qualifié. Tester disponibilités nombreuses, débutant, faible volume et reprise ; ne pas confondre créneau disponible et obligation de séance intense.                                           |
| A10 | P1       | Objectif par défaut FTP 280 W dans `GoalScreen.tsx` ; expérience « regular » et volume présélectionnés.                                                                                                      | Recueillir un choix explicite et proposer des objectifs compréhensibles selon le projet. Un débutant ne valide pas accidentellement une cible de puissance arbitraire.                                                                                  |
| A11 | P1       | Date d’événement uniquement dans les réglages ; `targetDate` accepte une chaîne arbitraire ; nom d’événement absent du modèle `Goal`.                                                                        | Saisir nom, date, distance et dénivelé pertinents ; valider et normaliser la date. Calendrier et préparation utilisent les mêmes données, sans date invalide acceptée silencieusement.                                                                  |
| A12 | P1       | `lt3` correspond à une cible « forme » de 3 h ; disponibilité minimale 45 min, maximale proposée 150 min ; pas d’éditeur après onboarding identifié.                                                         | Définir régularité et cible choisie indépendamment d’un indicateur de forme. Accepter créneaux courts, longues sorties et semaine indisponible ; offrir un éditeur quotidien/hebdomadaire.                                                              |
| A13 | P1       | Structure de séance issue d’un texte fixe par type, sans blocs dans `plannedWorkoutSchema`.                                                                                                                  | Modéliser échauffement, répétitions, récupération et retour au calme. Les blocs et cibles expliquent toute la durée et permettent guidage, exécution et export.                                                                                         |
| A14 | P0       | Usage futur de Strava pour IA, stockage et vente non validé ; aucun webhook observé ; déconnexion locale sans révocation distante observée.                                                                  | Résoudre la décision de sources décrite en section 5 ; vérifier les droits, gérer révocation/suppression et différencier déconnexion locale, retrait d’autorisation et effacement.                                                                      |
| A15 | P1       | HeiGIT utilise `EXPO_PUBLIC_HEIGIT_API_KEY`, trois appels par génération, pas de timeout identifié ; un échec rejette l’ensemble.                                                                            | Placer la clé et les quotas derrière un service contrôlé, selon les conditions du fournisseur. Annulation, timeout, réponses partielles et messages d’erreur utiles ; aucun abus de quota possible par extraction du bundle.                            |
| A16 | P1       | Hors boucle, ORS reçoit deux fois le point de départ ; longueur de boucle plafonnée à 100 km ; aucun GPX/sauvegarde observé.                                                                                 | Restreindre honnêtement l’UI aux boucles supportées, ou ajouter destination et flux complet. Expliquer les limites avant recherche. Un parcours choisi peut être conservé et utilisé sur le terrain.                                                    |
| A17 | P1       | `getTrafficExposure()` est une heuristique de types de voies ; le panel traduit `unknown` en « faible ».                                                                                                     | Conserver inconnu comme inconnu, afficher couverture et méthode. Tester données manquantes ; aucune promesse de trafic réel ou de sécurité issue d’un proxy cartographique.                                                                             |
| A18 | P1       | `RouteDetailPanel.tsx` utilise `colors.alpine/orange` pour SVG ; `GradntIntensityBreakdown.tsx` conserve des labels français et emploie `accentInk` pour des marques.                                        | Appliquer les rôles via `useThemeColor`, `accent` pour marques et catalogue pour labels ; vérifier les contrastes réels des textes et graphiques en clair/sombre.                                                                                       |
| A19 | P1       | Garage possède un bouton sans handler ; plusieurs erreurs de mutation plan n’ont pas de feedback visible identifié.                                                                                          | Retirer les fonctionnalités inactives de la version vendue et traiter chargement, réussite, échec et nouvelle tentative pour chaque action.                                                                                                             |
| A20 | P0       | `getGoalProgressPercentage()` calcule valeur actuelle / cible pour tous les objectifs chiffrés. Une FTP de 253 W pour une cible de 280 W affiche environ 90 %, sans point de départ.                         | Distinguer niveau actuel par rapport à une cible et part du progrès depuis une baseline. Définir le sens du pourcentage par type d’objectif ; aucune estimation de délai sans méthode, données et incertitude.                                          |

Les tests actuels confirment certaines règles, dont le motif répété sur quatre semaines. Ils ne valident pas que ces règles répondent à la promesse produit. Ajouter des scénarios de régression métier ciblés aux corrections, sans multiplier les tests qui recopient le code.

## 7. Expérience à viser pour les différents cyclistes

| Profil                      | Besoin principal                                       | Expérience proposée                                                                                                              | Preuve à obtenir                                                                                                               |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Débutant sans capteurs      | Comprendre comment progresser sans jargon ni surcharge | Objectif simple, séances en effort perçu/test de parole, créneaux courts, retour très rapide, indicateurs de régularité          | Il sait expliquer la prochaine séance et l’adapter à son temps sans aide. Il comprend ce qui est connu et ce qui ne l’est pas. |
| Amateur régulier            | Progresser en conservant sorties plaisir et club       | Planning flexible, intégration des sorties supplémentaires, bilan clair, objectif daté                                           | Une sortie club imprévue entraîne une proposition pertinente plutôt qu’un empilement de séances.                               |
| Compétiteur avancé          | Préparer une course avec des données vérifiables       | Blocs structurés, puissance/cardio datés, charge contextualisée, historique, exports, explications détaillées                    | Cohérence évaluée avec des entraîneurs et situations réelles ; comparaisons reproductibles sur les données autorisées.         |
| Professionnel et entraîneur | Décider ensemble dans un cadre de travail existant     | Mode lecture/commentaire/validation selon les droits, calendrier durable, méthode transparente, saisie et exports interopérables | Le coach garde l’autorité sur les prescriptions ; le produit fait gagner du temps sans modifier secrètement son plan.          |

Ne pas utiliser un bouton « mode pro » pour masquer l’absence de profondeur métier. Un amateur avancé n’est pas automatiquement un athlète professionnel ; leur support, leur organisation et leurs exigences diffèrent.

### Exemple de boucle vendable

Cas de recherche : préparer une première sortie de 100 km dans 12 semaines, avec trois créneaux variables et sans capteur de puissance.

1. GRADNT établit le point de départ à partir des informations déclarées et des sorties disponibles, en indiquant les limites.
2. L’accueil présente une prochaine action : durée, effort ressenti, intérêt pour l’objectif et alternative courte.
3. Le cycliste conserve ses sorties de groupe ; leur charge est intégrée par une méthode adaptée aux données disponibles.
4. Après une séance, il confirme durée, effort perçu et état ressenti ; activité et séance sont rapprochées avec possibilité de correction.
5. Si le temps manque ou la fatigue change, GRADNT propose une modification et explique son effet sur la semaine.
6. Le cycliste accepte, refuse ou choisit une alternative ; la décision et la version du plan restent consultables.
7. Le bilan répond à trois questions : ce qui a été fait, ce que cela change pour le projet, ce qui vient ensuite.

Cet exemple est un scénario produit cible. Il ne constitue pas un programme d’entraînement prescrit par cet audit.

## 8. Périmètre de la première offre payante

Le chat décrit une V1 ambitieuse et un MVP plus étroit : analyse → comparaison au plan → adaptation. **Le découpage commercial proposé ci-dessous réduit la première offre, sans effacer les fonctionnalités de la vision.** C’est une recommandation de séquencement issue de cet audit, à distinguer d’une décision historique déjà prise. Ne pas annoncer « V1 complète du concept » si seule la boucle initiale est livrée.

### À inclure

- [ ] Onboarding raccourci avec valeur visible avant les permissions optionnelles.
- [ ] Profil local utilisable sans Strava et objectif concret correctement daté.
- [ ] Stockage fiable, récupération et rattachement des achats clairement définis.
- [ ] Sources de données autorisées, import/saisie et état de fraîcheur visibles.
- [ ] Plan persistant, séances structurées et historique de changements.
- [ ] Modification des disponibilités, déplacement, saut, reprise et sortie supplémentaire.
- [ ] Retour post-séance avec effort perçu et confirmation/correction du rapprochement.
- [ ] Adaptation déterministe validée par un expert, proposition expliquée et contrôle utilisateur.
- [ ] Bilan hebdomadaire utile et progrès défini par objectif.
- [ ] Horizon d’entraînement lié à l’échéance et premiers blocs cohérents ; futur moins détaillé que la semaine courante. L’extension jusqu’à 24 semaines exige des scénarios spécifiques avant annonce commerciale.
- [ ] Rappels facultatifs, réglables et cohérents avec les séances déplacées.
- [ ] Paiement, restauration, gestion de l’abonnement, export/effacement et support.

### À différer tant que la boucle ne retient pas les utilisateurs

- Garage complet, social, classements, défis communautaires.
- Généralisation gravel/MTB avant validation route.
- Navigation propriétaire complète, suivi GPS en direct et cartes hors ligne développées de zéro.
- Chat IA illimité, biométrie extensive et prédictions de performance non validées.
- Portail coach complet et offre équipe professionnelle.

**Explore : tester son pouvoir différenciant dès la bêta sur une zone limitée.** Pour une vente centrée sur l’adaptation, il peut rester optionnel. Pour une promesse commerciale « séance + parcours », le parcours doit être réellement exploitable : géométrie valide, compatibilité terrain, sauvegarde et GPX/transfert testé. Ne pas communiquer cette promesse avant ce critère.

## 9. Architecture et qualité à construire

### Domaines et modèles

Faire évoluer les schémas existants avec des migrations explicites :

- `AthleteProfile` : niveau, matériel disponible, contraintes et préférences nécessaires à la personnalisation ; collecte minimale.
- `Goal` : identifiant durable, création, baseline, mesure, dates, besoins de l’événement, statut et critères de réussite.
- `Activity` : source, droits d’usage, fraîcheur, mesure/estimation, temps écoulé/en mouvement selon l’usage, qualité et séries disponibles.
- `Workout` : blocs, cibles puissance/cardio/effort perçu, variantes et intention.
- `TrainingPlan` : date d’ancrage, versions, semaines et phases explicites, séances durables.
- `WorkoutCompletion` : activité liée, déclarations, corrections et confiance du rapprochement.
- `TrainingState` : métriques calculées, méthode/version, couverture de données et incertitude.
- `PerformanceRecord` et `PowerCurve` : durées, fenêtres d’observation, origine mesurée/estimée et validité ; FTP configurée distincte de la FTP estimée.
- `AvailabilityRule` et `AvailabilityException` : semaine habituelle distincte des changements datés, créneaux ajoutés et périodes sans disponibilité.
- `AdaptationProposal` : événement déclencheur, avant/après, règles appliquées, explication et choix du cycliste.
- `DataPermission` et `Entitlement` : consentements, restrictions des sources et droits d’accès payants.

Éviter que le schéma d’un formulaire onboarding devienne la définition métier permanente. Les libellés restent traduisibles à l’interface ; le domaine expose des codes et résultats structurés.

### Moteur déterministe

- [ ] Définir une méthode adaptée à chaque niveau de données : déclaratif/RPE, cardio, puissance mesurée et séries temporelles.
- [ ] Versionner formules, paramètres et seuils ; vérifier des jeux de référence avec un expert.
- [ ] Gérer démarrage sans historique, trous de capteur, FTP changée, maladie déclarée, retour après pause et entraînements hors vélo.
- [ ] Empêcher les collisions, tenir compte des jours disponibles et distinguer séance passée, échue, déplacée et réalisée.
- [ ] Établir règles de récupération, progression, semaines allégées et préparation d’événement avec le référent métier.
- [ ] Ne pas utiliser CTL/ATL/TSB ou une hausse de volume comme preuve suffisante de progression physiologique.
- [ ] Présenter les limites de chaque estimation ; ne pas convertir une donnée absente en zéro physiologique.

### Données et exploitation

- [ ] Choisir explicitement entre fonctionnement local avec récupération et compte synchronisé ; pour un abonnement récurrent, privilégier une récupération fiable sans imposer un compte avant la première valeur.
- [ ] Si un backend métier est retenu : authentification, autorisation par utilisateur, migrations, protections des accès, sauvegarde et exercice de restauration.
- [ ] Adapter le stockage local à des historiques croissants ; réserver le trousseau aux secrets, plutôt qu’à de grands documents JSON.
- [ ] Séparer environnements développement, bêta et production, secrets et quotas.
- [ ] Sécuriser les endpoints publics : validation, limitation de débit, délais et logs sans jetons, codes OAuth ni données de parcours.
- [ ] Exécuter lint, typecheck et tests dans une CI ; ajouter contrôles dédiés aux fonctions Edge, puis builds natifs et smoke tests de parcours critiques.
- [ ] Mesurer crashes, erreurs de synchronisation et latence ; prévoir arrêt d’un service fautif et procédure de correction/version précédente.

### IA, après validation des sources et du moteur

- [ ] Donner à l’IA uniquement un contexte dont l’usage est autorisé ; aucune clé fournisseur dans le client mobile.
- [ ] Laisser les calculs et contraintes au moteur ; utiliser l’IA pour interprétation contextualisée et explication.
- [ ] Valider par Zod les sorties structurées et par règles métier toute proposition qui change l’état.
- [ ] Demander un choix explicite pour un changement significatif, puis persister la décision ; aucun texte libre ne modifie directement un plan.
- [ ] Prévoir fallback déterministe, budgets, cache autorisé et limites de fréquence.
- [ ] Évaluer contextes incomplets, sortie difficile, interruption, objectifs irréalistes et demandes incompatibles avec les contraintes.
- [ ] Conserver version du modèle/contexte et traçabilité minimale sans enregistrer inutilement des données sensibles.

La première preuve de valeur peut être obtenue avec un moteur déterministe et des explications préparées avec un entraîneur. L’IA n’est pas une dépendance obligatoire du lancement.

### Extensions conservées du concept, avec conditions de livraison

| Extension                                                                     | Dépendances                                                                                 | Condition avant mise en vente                                                                                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objectifs secondaires, W/kg, puissance sur durée, heures et nombre de sorties | Collection d’objectifs, poids daté si pertinent, records et périodes définies               | Principal réellement priorisé, calculs explicables, données absentes gérées ; pas de confusion entre poids/performance et injonction à maigrir.                                           |
| Objectif libre interprété                                                     | Contexte du cycliste, sortie de modèle structurée et validation utilisateur                 | Indicateurs proposés confirmés avant création. « Suivre le groupe à 30 km/h » demande terrain, groupe et conditions ; une vitesse moyenne brute ne constitue pas une prescription fiable. |
| Power curve, profils et FTP estimée                                           | Données temporelles autorisées, qualité capteurs, historique des zones et jeux de référence | Durées et records reproductibles ; confiance de l’estimation, protocole d’évaluation et décision FTP conservés.                                                                           |
| Analyse de chaque sortie                                                      | Activité détaillée, éventuels laps/streams, rapprochement au plan                           | Analyse pertinente même sans puissance ; séparer description, déduction et interprétation.                                                                                                |
| Macrocycle jusqu’à 24 semaines                                                | Objectif daté, blocs, contraintes et récupération                                           | Modifier un bloc ne réécrit pas les séances déjà réalisées ; futur lointain indiqué comme prévisionnel.                                                                                   |
| Météo, vent et variété des parcours                                           | Fournisseur autorisé, heure de départ, géométrie et historique utilisable                   | Prévision datée, couverture visible et repli sans données ; aucune assurance de conditions sûres.                                                                                         |
| Garmin, puis autres plateformes indoor/outdoor                                | Accès fournisseurs, formats et règles d’usage validés                                       | Aller-retour réellement testé sur les appareils annoncés ; ne pas vendre l’accès à une API supposée disponible.                                                                           |
| Garage Beta                                                                   | Vélos, composants, kilométrage et maintenance                                               | Ajout/édition effectifs, affectation des sorties, seuils choisis et alertes sans fausse précision sur l’usure.                                                                            |
| Coach global                                                                  | Contrats d’analyse, contexte autorisé, budgets et validations                               | Conseils et actions cohérents avec le moteur ; aucune action cachée, aucune dépendance obligatoire à une clé IA personnelle.                                                              |

Le BYOK/Gemini du chat était un choix pour un outil privé. Pour un produit commercial débutant, recommander une expérience gérée par GRADNT, avec budget inclus et fournisseur remplaçable ; garder éventuellement BYOK pour les experts, après validation des droits et de l’ergonomie.

## 10. Validation auprès des cyclistes

### Étape 1 — Comprendre le problème avant d’élargir le produit

Proposition : 24 entretiens, répartis en 8 débutants, 10 amateurs réguliers, 4 compétiteurs dont 1–2 professionnels si accessibles, et 2 entraîneurs dont au moins un travaillant avec des athlètes de haut niveau. Recrutement diversifié en âge, genre, terrain, équipement et contraintes d’emploi du temps. Si aucun professionnel n’est recruté, ne pas considérer ses besoins comme validés par les amateurs avancés.

Questions utiles : dernière décision d’entraînement difficile, façon actuelle de préparer un défi, outils utilisés, abonnement déjà payé, séance annulée récente, confiance dans les recommandations et données disponibles. Demander des situations vécues avant de présenter GRADNT.

Livrable : trois besoins prioritaires par segment, solutions actuelles, obstacles et déclencheur d’achat. Exclure les intentions vagues du type « sympa comme app » des preuves de demande.

### Étape 2 — Tester la compréhension

Proposition : 12 sessions observées. Faire choisir un objectif, expliquer la prochaine action, déplacer une séance, ajouter une sortie et comprendre une modification. Comparer aux outils habituels des testeurs, sans demander de remplacer toute leur organisation.

Objectifs internes proposés : au moins 10/12 expliquent correctement ce qu’ils doivent faire et pourquoi ; aucune interprétation fausse d’une estimation comme mesure ; principales tâches terminées sans aide. Ces seuils ne sont pas des benchmarks de marché.

### Étape 3 — Bêta accompagnée sur huit semaines

Proposition : 40 cyclistes, dont 15 débutants, 20 réguliers et 5 avancés, avec deux entraîneurs référents. Utiliser des sources autorisées et adapter l’effectif à la capacité réellement obtenue pour chaque intégration.

- Entretien court initial et final ; points de retour réguliers.
- État initial et objectif documentés ; journal des décisions/adaptations.
- Évaluer la compréhension, l’assiduité choisie, l’intérêt, la confiance et le temps gagné.
- Faire relire les cas complexes et toutes les adaptations jugées mauvaises par un expert.
- Tester les capteurs manquants, sorties club, interruptions, semaines à zéro disponibilité et changement de téléphone.
- Distinguer plaisir/adhésion, amélioration observable et effet causal : une bêta sans groupe de comparaison ne prouve pas que GRADNT cause une hausse de FTP.

### Étape 4 — Vérifier la disposition à payer

Présenter un prix et une offre précis lorsque le parcours est fiable. Mesurer des achats réels et leur maintien, avec conditions transparentes. Les entretiens de prix et une liste d’attente aident au cadrage ; ils ne remplacent pas la conversion payante et la rétention.

## 11. Commercialisation et modèle économique

### Offre proposée à tester

| Offre             | Contenu                                                                                                         | Hypothèse de prix                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Découverte        | Objectif, profil, première recommandation et aperçu du fonctionnement ; pas de promesse d’adaptation non livrée | Gratuit, périmètre permanent à définir avec les coûts réels                                                      |
| GRADNT            | Plan adaptatif expliqué, suivi de l’objectif, bilan, séances structurées et intégrations réellement disponibles | Tester 9,99 € puis 12,99 €/mois sur des cohortes transparentes ; tester 89–109 €/an une fois la rétention connue |
| Coach/Performance | Collaboration, outils métier et service adapté à l’entraîneur/athlète                                           | À définir après pilotes ; aucune offre « Pro » de façade au lancement                                            |

Il s’agit de propositions, sans prix validé ni conversion existante. Éviter des contrats annuels pour masquer l’absence de rétention. Le moment du paywall doit suivre une première valeur comprise ; tester la durée d’essai selon le temps nécessaire à l’utilisateur pour l’évaluer.

### Économie à instrumenter

Calculer par pays, canal et formule : revenu net encaissé − frais de distribution − coûts de données/IA/infrastructure − remboursements − support variable = marge de contribution.

Exemple purement illustratif, sans hypothèse fiscale ou contractuelle validée : prix 9,99 €/mois, taxe supposée de 20 %, frais supposés de 15 % appliqués au montant hors taxe, coûts variables supposés de 2,10 € → environ 4,98 € de contribution par abonné/mois. Avec 30 % de frais dans ce même modèle, environ 3,73 €. Remplacer ces hypothèses par les contrats et règlements réellement applicables avant toute décision budgétaire.

- [ ] Mesurer coût par utilisateur actif, abonné et tâche IA, y compris les utilisateurs gratuits.
- [ ] Définir plafonds de consommation et scénarios de forte utilisation.
- [ ] Calculer coût d’acquisition par abonné encore actif, durée de remboursement du CAC et revenu réellement conservé.
- [ ] Inclure coûts fixes : développement, expertise sportive, juridique, support, contenus et exploitation.
- [ ] Projeter trésorerie à trois scénarios sans transformer un objectif commercial en prévision acquise.

### Acquisition initiale

- [ ] Tester une landing page avec une promesse centrée sur un défi route concret et une démonstration du parcours réel.
- [ ] Construire trois démonstrations : premier 100 km, entraînement avec emploi du temps variable, préparation d’une cyclosportive.
- [ ] Recruter par clubs, sorties débutants, magasins partenaires, organisateurs et entraîneurs ; documenter les accords et la provenance des inscriptions.
- [ ] Publier des contenus utiles sur les décisions d’entraînement, pas uniquement des annonces de fonctionnalités.
- [ ] Obtenir des témoignages autorisés et contextualisés : profil, durée d’usage, aide réellement reçue et limites.
- [ ] Tester les canaux un par un avec une attribution minimale ; développer ceux qui apportent des cyclistes retenus.
- [ ] Préparer captures stores, site, FAQ et emails transactionnels dans un français/anglais cohérent avec le produit livré.
- [ ] Donner un canal support simple, un délai annoncé réaliste et une procédure de traitement des mauvaises recommandations.

Éviter l’acquisition payante à grande échelle avant d’avoir une cohorte payante retenue et une marge de contribution positive.

## 12. Vie privée, sécurité et distribution

Ces points constituent du travail de préparation à faire valider pour le périmètre réel de GRADNT, pas une certification de conformité.

- [ ] Cartographier données, finalités, sources, destinataires, conservation et restrictions ; documenter la base légale de chaque traitement.
- [ ] Examiner avec un spécialiste la qualification des informations et inférences de santé et la nécessité d’une analyse d’impact ; ne pas supposer que toutes les données sportives relèvent automatiquement du même régime.
- [ ] Prévoir consentements distincts quand nécessaires, retrait simple, collecte minimale, information contextuelle et refus des fonctions facultatives. La permission technique de l’OS ne remplace pas automatiquement le consentement RGPD. [CNIL — permissions mobiles](https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee).
- [ ] Publier confidentialité et conditions de service accessibles dans l’app/site ; préciser limites des conseils, usage des sources, abonnements et support.
- [ ] Prévoir export et effacement des données GRADNT ; vérifier séparément ce qui peut être exporté pour les données de chaque fournisseur.
- [ ] Vérifier sous-traitants, localisation, transferts, accès, conservation et traitement des incidents. Auditer SDKs et logs. [CNIL — recommandations applications mobiles](https://cnil.fr/fr/recommandations-applications-mobiles).
- [ ] Définir accès bêta et tranche d’âge ciblée ; ne pas ouvrir implicitement les parcours à tous les mineurs sans conception et validation dédiées.
- [ ] Garder un positionnement sportif ; faire relire les conseils sensibles et les allégations. Ne pas promettre prévention des blessures, diagnostic ou résultats physiologiques garantis.
- [ ] Définir un flux d’effacement depuis l’app si création de compte ; dissocier suppression et gestion de l’abonnement. [Apple — suppression de compte](https://developer.apple.com/support/offering-account-deletion-in-your-app).
- [ ] Choisir et tester les achats intégrés adaptés aux marchés visés, droits côté serveur, restauration et renouvellement ; vérifier les règles locales plutôt que supposer une politique mondiale unique. [Apple — App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play — paiements](https://support.google.com/googleplay/android-developer/answer/9858738).
- [ ] Finaliser déclarations de confidentialité, permissions, comptes reviewer ou mode dédié, contenus et métadonnées exactes. Revoir les exigences Google Play et Apple applicables à la date de soumission.
- [ ] Documenter builds signés, versionnement, validation bêta, déploiement progressif et récupération après incident.

Le texte actuel des réglages dit que rien n’est conservé sur les serveurs GRADNT. Toute introduction d’un backend métier, d’analytics ou d’une IA distante demande de mettre à jour cette information et les consentements applicables avant activation.

## 13. Indicateurs et critères de lancement

Indicateur principal proposé : **proportion de cyclistes activés qui utilisent GRADNT pour prendre et suivre une décision liée à leur objectif sur une semaine**. Le repos choisi et une adaptation pertinente peuvent compter ; ouvrir l’app ou remplir une séance artificiellement ne compte pas comme bénéfice.

Mesurer avec des événements produit minimaux dont l’usage est autorisé, sans recopier données Strava, GPS ou informations de santé dans la télémétrie. Séparer les sources et vérifier la politique de chacune.

Les seuils suivants sont des objectifs internes de départ, à revoir avec la taille des cohortes ; aucun n’est présenté comme standard du secteur.

| Indicateur               | Définition                                                                                   | Objectif proposé                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Activation               | Nouvel utilisateur qui définit son projet et comprend/confirme une première action sous 48 h | ≥ 65 % des inscrits bêta                                               |
| Première valeur          | Temps actif jusqu’à la première recommandation utile, hors attente fournisseur               | Médiane ≤ 5 minutes                                                    |
| Rétention utile S4       | Activés avec une décision utile dans la quatrième semaine                                    | ≥ 40 % ; publier effectifs par segment                                 |
| Rétention utile S8       | Activés avec une décision utile dans la huitième semaine                                     | ≥ 30 % ; examiner les raisons d’abandon                                |
| Qualité des propositions | Propositions relues par expert selon grille et données disponibles                           | Aucun cas critique ; ≥ 90 % pertinents sur le jeu évalué               |
| Compréhension            | Testeur explique ce qu’il doit faire et pourquoi sans aide                                   | ≥ 10/12 lors du test observé                                           |
| Synchronisation          | Tentatives admissibles réussies, avec indisponibilités fournisseur séparées                  | ≥ 98 % sur la bêta instrumentée                                        |
| Stabilité                | Sessions sans crash                                                                          | ≥ 99,5 %, avec appareil et version identifiés                          |
| Conversion               | Activés exposés à une offre précise qui deviennent payants                                   | Premier objectif ≥ 8 % ; montrer le dénominateur                       |
| Maintien payant          | Nouveaux abonnés toujours abonnés au deuxième mois, après remboursement éventuel             | Premier objectif ≥ 70 % ; observation sur vraies échéances             |
| Coût et support          | Contribution par abonné, tickets/100 abonnés et coût réel de résolution                      | Contribution positive, support compatible avec la capacité de l’équipe |

Les adaptations acceptées ne sont pas automatiquement bonnes ; analyser aussi les refus, corrections, modifications manuelles et retours négatifs. Une hausse de charge ou un taux de séances terminées élevé ne suffit pas à prouver l’intérêt du produit.

Décision d’ouverture payante : sources validées, aucun P0 ouvert, valeur et compréhension démontrées, parcours de paiement/effacement fonctionnels, support opérationnel. Décision d’accélération : rétention et économie observées sur plusieurs cohortes, avec les limites statistiques explicites.

## 14. Feuille de route avec livrables et responsables

Estimation de séquencement : 16–20 semaines ou davantage, avec un développeur principal, appui produit/design, entraîneur référent et soutien juridique ponctuel. **Ce n’est pas un engagement de livraison.** Les délais d’approbation fournisseurs/stores, la taille de l’équipe et les entretiens peuvent modifier fortement le calendrier. Certaines recherches se mènent pendant le développement ; ne pas comprimer les huit semaines d’observation ni la deuxième échéance payante.

| Phase                               | Fenêtre indicative            | Responsable principal                 | Livrables                                                                                                             | Condition de sortie                                                                         |
| ----------------------------------- | ----------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 0. Concept, droits et segment       | S1–S2                         | Fondateur/produit + juridique         | Conversation intégrée si disponible, carte des sources, segment et promesse, premiers entretiens, dossier fournisseur | Architecture de données utilisable ; pas de dépendance commerciale à un usage non autorisé  |
| 1. Fiabilité métier                 | S2–S4                         | Développement                         | Plan ancré, IDs durables, périodes justes, provenance, sauvegardes fiables, objectifs et états honnêtes               | P0 techniques corrigés et scénarios temporels couverts                                      |
| 2. Boucle utile                     | S4–S8                         | Développement + entraîneur + design   | Séances structurées, retours, disponibilités, rapprochement, premières adaptations et bilan                           | Parcours simple complet ; prescriptions relues ; tests de compréhension réussis             |
| 3. Bêta terrain                     | S8–S16                        | Produit + entraîneurs                 | Cohorte suivie huit semaines, retours documentés, erreurs corrigées, pilote Explore si pertinent                      | Compréhension, confiance et rétention évaluées ; aucune recommandation critique non résolue |
| 4. Offre et préparation commerciale | S10–S16, en parallèle         | Fondateur + développement + juridique | Prix testé, achats/restauration, confidentialité, effacement, CI/builds, support et fiches stores                     | Version candidate opérationnelle ; revue fournisseurs et stores compatible avec l’offre     |
| 5. Ouverture payante limitée        | S16–S20+                      | Fondateur/produit                     | Premiers abonnés, acquisition locale limitée, contribution et maintien au deuxième mois                               | Qualité et économie observées ; décision explicite d’accélérer ou corriger                  |
| 6. Performance et coach             | Après preuves, sans date fixe | Produit + entraîneurs + développement | Pilotes avec entraîneurs/athlètes, intégrations directes, méthodes avancées et collaboration                          | Gain de temps et intérêt métier démontrés avant l’offre professionnelle                     |

Si les droits de sources ou les autorisations retardent le calendrier, avancer avec données directement saisies et jeux de test autorisés ; ne pas présenter une démonstration comme le suivi personnel réel d’un cycliste.

### Les dix premiers tickets à ouvrir

| Ordre | Ticket                                                    | Effort indicatif                                | Responsable                    | Validation attendue                                                                       |
| ----- | --------------------------------------------------------- | ----------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| 1     | Consolider le concept et les usages autorisés des sources | 2–5 jours de travail, réponses externes exclues | Produit + juridique            | Décision écrite sur Strava, IA, conservation et accès coach                               |
| 2     | Persister plan et objectif avec IDs stables et migrations | 4–8 jours                                       | Développement                  | Rouvrir à J+1/J+7 ne réaffecte pas les statuts à d’autres séances                         |
| 3     | Corriger sélection et rappels des séances déplacées       | 1–3 jours                                       | Développement                  | Date, tri, détails et rappels cohérents pour `planned`/`moved`                            |
| 4     | Corriger périodes, progression et provenance FTP          | 3–6 jours                                       | Développement                  | Valeurs, origine, baseline et libellés concordent sur les cas de référence                |
| 5     | Fiabiliser sauvegardes et invalidations des données       | 2–4 jours                                       | Développement                  | Séquence sauvegarde/refetch et erreurs contrôlées ; modifications concurrentes conservées |
| 6     | Redéfinir l’entrée débutant et les objectifs datés        | 2–4 jours                                       | Produit/design + développement | Aucun objectif puissance arbitraire ; projet et temps disponibles compris                 |
| 7     | Définir règles d’entraînement et séances structurées      | 5–10 jours, revue métier incluse                | Entraîneur + développement     | Cas débutant/avancé relus ; blocs et variantes compatibles avec la durée                  |
| 8     | Ajouter retours et éditeur de disponibilités              | 4–8 jours                                       | Développement/design           | Semaine indisponible, fatigue déclarée et sortie supplémentaire prises en compte          |
| 9     | Livrer une adaptation explicable de bout en bout          | 5–10 jours                                      | Développement + entraîneur     | Proposition, alternatives, décision, nouvelle version et possibilité de retour            |
| 10    | Organiser recherche, instrumentation minimale et bêta     | 3–6 jours d’installation, suivi ensuite         | Produit                        | Cohortes, consentements, grille d’évaluation et événements autorisés prêts                |

Ces fourchettes sont des hypothèses de charge après inspection, non des devis. Elles ne couvrent pas tout le lancement : compte/récupération, paiements, durcissement serveur, QA appareils et distribution restent dans les phases correspondantes.

## 15. Critères concrets « prêt à commercialiser »

- [ ] Le concept source est consolidé et toute divergence assumée est documentée.
- [ ] Le segment et le besoin prioritaire sont étayés par des situations réelles.
- [ ] Aucun P0 technique, métier ou de droits de données n’est ouvert.
- [ ] Le plan reste stable sur plusieurs semaines et conserve son historique.
- [ ] Les objectifs, données manquantes, estimations et mesures sont honnêtement présentés.
- [ ] Un débutant sans capteurs comprend et suit une prochaine action utile.
- [ ] Les experts peuvent inspecter la méthode et corriger les données utilisées.
- [ ] Une séance imprévue, sautée ou déplacée produit un résultat cohérent et expliqué.
- [ ] Aucune fonctionnalité inactive n’est exposée comme disponible.
- [ ] Les parcours critiques passent sur iOS et Android réels, en FR/EN et clair/sombre.
- [ ] Hors ligne, session expirée, refus de permissions et panne fournisseur ont des issues compréhensibles.
- [ ] Sauvegarde/récupération, effacement, abonnement et restauration ont été réellement éprouvés.
- [ ] Les informations de confidentialité reflètent tous les traitements actifs.
- [ ] Le support peut traiter un problème de données ou de recommandation.
- [ ] Des cyclistes reviennent pour la décision apportée, et des achats réels confirment la demande.
- [ ] La contribution et les coûts de support sont mesurés avant d’accélérer l’acquisition.

## 16. Décisions à formaliser à partir du concept transmis

Le contenu fourni permet la comparaison. Il reste à transformer ces divergences en décisions écrites dans le PRD et le backlog, sans rouvrir un brainstorming général :

1. **Plateforme** : conserver Expo/React Native/Tamagui comme plateforme mobile actuelle ; éventuel web complémentaire ultérieur, sans migration motivée seulement par la stack historique.
2. **Sources** : revoir la dépendance principale à Strava au regard des usages envisagés et des règles consultées ; conserver normalisation et modèle propre.
3. **MVP** : rendre exceptionnel le parcours après une vraie sortie avant de compléter toutes les catégories d’objectifs et les features secondaires.
4. **Mesures** : définir forme, charge, fraîcheur, progression, confiance et estimation ; les exemples de maquette ne sont pas des spécifications de calcul.
5. **Routage** : comparer ORS et l’intention historique Valhalla sur un besoin observé ; poids du score documentés et validés, trois alternatives visées sans inventer des propositions manquantes.
6. **Commercialisation** : compléter le concept privé avec récupération des données, paiements, droits, support et validation terrain ; l’IA BYOK ne doit pas devenir un obstacle pour les débutants.
7. **Professionnels** : conserver ambition et profondeur, mais réserver les promesses de performance et collaboration aux fonctions réellement validées avec eux.

Livrables à dériver de ce plan : PRD mobile V1, cartographie des parcours, contrats du domaine, grille de validation des calculs, décision de sources et backlog ordonné. Le schéma PostgreSQL/Drizzle et les packages Next du chat ne doivent pas être appliqués mécaniquement à une app dont la stack actuelle est différente.

## 17. Points d’entrée dans le code pour exécuter le plan

- Génération et répétition des séances : [first-plan.ts](../apps/mobile/src/lib/domain/first-plan.ts).
- Régénération du calendrier et mutations : [plan.repository.ts](../apps/mobile/src/services/plan.repository.ts), [plan-overrides.ts](../apps/mobile/src/services/plan-overrides.ts).
- Sélection prochaine séance, périodes et intensités : [selectors.ts](../apps/mobile/src/lib/domain/selectors.ts).
- Valeurs d’objectifs et provenance : [gradnt.repository.ts](../apps/mobile/src/services/gradnt.repository.ts).
- Modèles métier : [schemas.ts](../apps/mobile/src/lib/domain/schemas.ts).
- Import et normalisation : [strava-activity.service.ts](../apps/mobile/src/services/strava/api/strava-activity.service.ts), [strava-activity.normalize.ts](../apps/mobile/src/services/strava/api/strava-activity.normalize.ts).
- Sauvegardes du profil et disponibilités : [onboarding.store.ts](../apps/mobile/src/features/onboarding/store/onboarding.store.ts), [onboarding.persistence.ts](../apps/mobile/src/features/onboarding/services/onboarding.persistence.ts).
- Rappels et synchronisation : [notification-plan.ts](../apps/mobile/src/lib/domain/notification-plan.ts), [use-notification-sync.ts](../apps/mobile/src/features/app/hooks/use-notification-sync.ts).
- Appels de routage : [openrouteservice-routing.service.ts](../apps/mobile/src/features/explore/adapters/openrouteservice/openrouteservice-routing.service.ts).
- Présentation et limites du routage : [route-analytics.ts](../apps/mobile/src/features/explore/domain/route-analytics.ts), [RouteDetailPanel.tsx](../apps/mobile/src/features/explore/components/RouteDetailPanel.tsx).
- Sécurité et exploitation des échanges : [strava-exchange](../supabase/functions/strava-exchange/index.ts), [strava-refresh](../supabase/functions/strava-refresh/index.ts), [README backend](../supabase/README.md).
