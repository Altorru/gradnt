# GRADNT — recette et pilote de la boucle après-sortie

## Ce qui peut être essayé aujourd’hui

Depuis Progression, les trois dernières sorties permettent d’ajouter des sensations et d’ouvrir le détail. Le formulaire demande un effort perçu de 1 à 10, les sensations générales, la fatigue et une note facultative. Aucune réponse n’est préremplie comme un fait réel.

Un compte GRADNT connecté sauvegarde les réponses dans Supabase ; sans compte, elles restent sur l’appareil. Un brouillon distinct par compte et sortie permet de reprendre une saisie. Une révision ancienne est refusée, et le rechargement des réponses exige un abandon explicite du brouillon.

Le détail sépare les chiffres de sortie, les réponses personnelles et un conseil déterministe basé uniquement sur ces réponses. Il ne calcule pas une nouvelle FTP, ne prétend pas faire une analyse IA et ne modifie pas le plan.

**Non disponibles dans ce lot :** listener Strava, notifications après sortie, analyse IA, adaptation du plan, saisie manuelle et fichiers originaux. La sortie doit appartenir à l’historique récent accessible depuis la connexion Strava de cet appareil. Le formulaire revérifie cette disponibilité avant la validation.

## Recette sur téléphone avant bêta

Les tests automatisés ne remplacent pas cette recette. Refaire une build native contenant SQLite et vérifier iOS et Android, en français et anglais, thèmes clair et sombre.

| Cas                   | Action                                                            | Résultat attendu                                                                                                               |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Débutant sans capteur | Ouvrir une sortie sans puissance ni FC                            | Distance, durée et D+ lisibles ; capteurs absents représentés par un tiret, sans estimation inventée                           |
| Réponse rapide        | Choisir seulement une fatigue                                     | Enregistrement possible, détail de la bonne sortie, conseil expliqué                                                           |
| Formulaire vide       | Ne rien renseigner ou seulement des espaces                       | Aucune fausse réponse sauvegardée ; « Plus tard » disponible                                                                   |
| Effort                | Choisir 1, 7 puis 10 et toucher à nouveau la sélection            | Libellés compréhensibles ; effacement possible ; pas de valeur par défaut                                                      |
| Brouillon             | Saisir une note, revenir en arrière puis rouvrir ; relancer l’app | Même brouillon pour la même sortie et le même compte                                                                           |
| Hors connexion        | Remplir le formulaire puis valider sans réseau                    | Brouillon conservé, erreur visible, aucun message de succès ni navigation de validation                                        |
| Reconnexion           | Réactiver le réseau puis réessayer                                | Une seule réponse active et retour au détail après sauvegarde                                                                  |
| Deux appareils        | Ouvrir le formulaire sur A et B ; répondre sur A, puis B          | B reçoit un conflit ; A n’est pas écrasé ; rechargement explicite possible                                                     |
| Brouillon ancien      | Laisser un brouillon sur B, répondre sur A puis rouvrir B         | Avertissement ; aucune réutilisation silencieuse comme réponse récente                                                         |
| Deux cyclistes        | Passer du compte A au compte B                                    | Réponses, brouillons et caches isolés ; aucune note de A affichée dans B                                                       |
| Sortie indisponible   | Retirer l’accès Strava ou supprimer la sortie avant validation    | Validation refusée ; texte explicite lors du rechargement ; brouillon non présenté comme analyse                               |
| Ergonomie             | Petit écran, grande police, clavier ouvert, VoiceOver/TalkBack    | Champs et actions accessibles, choix annoncés, cibles tactiles d’au moins 48 points, aucune information uniquement par couleur |

Pour chaque échec, noter plateforme/build, étapes minimales et résultat attendu/observé. Utiliser des données fictives dans les captures partagées ; ne pas exposer les notes personnelles des testeurs.

## Pilote de valeur, avant publicité et abonnement

### Phase 1 : 12 cyclistes pendant deux semaines

Recruter volontairement quatre débutants sans capteur de puissance, quatre pratiquants réguliers et quatre cyclistes expérimentés équipés. Ne pas présenter ce groupe comme une validation pour les professionnels.

Chaque participant réalise au moins deux sorties. Après la première, observer la découverte du formulaire sans aide ; après la seconde, mesurer s’il revient spontanément et s’il comprend la prochaine action. Un refus de renseigner des sensations est une information produit utile, pas une faute de l’utilisateur.

Questions à recueillir séparément des notes privées :

1. « Qu’as-tu compris de cette sortie et que comptes-tu faire ensuite ? »
2. « Qu’est-ce que GRADNT t’a apporté en plus de ton outil habituel ? »
3. « Quelle réponse n’avais-tu pas envie de renseigner, et pourquoi ? »
4. « Qu’est-ce qui manque pour que tu utilises l’app après ta prochaine sortie ? »

### Critères de décision — hypothèses à tester

| Signal           | Hypothèse initiale                                                                           | Décision si non atteinte                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Temps de saisie  | Médiane inférieure à 30 secondes pour les réponses courtes                                   | Réduire le formulaire et reporter la note dans un détail progressif       |
| Compréhension    | Au moins 9/12 expliquent la prochaine action sans aide                                       | Revoir les conseils et les labels avant d’ajouter l’IA                    |
| Réutilisation    | Au moins 8/12 répondent après leur deuxième sortie sans relance personnelle                  | Corriger découverte et utilité ; ne pas acheter de trafic pour compenser  |
| Valeur distincte | Au moins 8/12 décrivent un bénéfice concret différent de la simple consultation des chiffres | Prioriser comparaison prévu/réel et adaptations avant le polish marketing |
| Fiabilité        | Aucun mélange entre comptes, aucune perte silencieuse ni fausse validation                   | Corriger avant tout élargissement de la bêta                              |

Ces seuils sont des hypothèses de pilotage, pas des résultats obtenus. Avec 12 personnes, les taux ne constituent pas une preuve statistique de rétention. Les compteurs produit ne sont pas encore instrumentés : commencer avec une observation consentie, puis ajouter les événements minimaux sans envoyer de notes, de santé ou de localisation dans les outils marketing.

### Phase 2 : entraînement exigeant

Après intégration du prévu/réel et des adaptations, faire relire les règles par deux entraîneurs et tester avec des cyclistes de compétition, dont des professionnels si accessibles. Comparer les décisions, la maîtrise des changements et la qualité des explications ; ne pas promettre un gain de FTP sans étude adaptée.

## Ordre vers une offre payante

1. Réussir cette recette et le pilote ; corriger les points bloquants.
2. Ajouter saisie manuelle et import original, utilisables sans Strava.
3. Relier le compte GRADNT à Strava côté serveur, puis implémenter listener et push idempotents.
4. Comparer séance prévue et sortie réelle, intégrer les sensations et proposer une adaptation acceptée par l’utilisateur.
5. Implémenter et évaluer l’analyse IA sur les sources prévues avec provenance traçable.
6. Finaliser export/suppression de compte, récupération de mot de passe, support, suivi des erreurs, coûts et validation stores.
7. Tester la disposition à payer pour le bénéfice réel constaté. Annoncer uniquement les capacités livrées ; établir le prix après les essais et l’analyse des coûts.

Le message de bêta peut être : **« Comprends tes sorties, ajoute tes sensations et prépare la suite. »** Le message commercial final « Ride what’s next. » devra être soutenu par des adaptations réellement utiles et vérifiées.
