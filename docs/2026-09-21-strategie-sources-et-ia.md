# GRADNT — Stratégie sources, IA et intégrations

## Décision

GRADNT ne contournera pas les règles Strava en envoyant à l’IA un historique
Strava consolidé, des métriques dérivées ou un état agrégé. La politique API
Strava interdit aussi l’usage indirect de ces dérivés et l’ingestion dans un
contexte IA.

La stratégie retenue est :

| Source                        | Usage GRADNT                                                                                                | Coach IA                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Strava                        | synchronisation, historique visible, feedback, métriques déterministes autorisées après revue contractuelle | désactivé tant qu’un accord Strava spécifique n’existe pas       |
| FIT importé par l’utilisateur | activité complète, provenance originale, analyse et plan IA                                                 | activé                                                           |
| Garmin Connect Activity API   | activité complète, backfill, synchronisation serveur                                                        | activé après validation Garmin et attribution obligatoire        |
| Saisie manuelle               | contexte, sensations et sorties sans capteur                                                                | activé, avec niveau de confiance adapté                          |
| Wahoo / COROS / autres        | à ajouter via accord officiel ou import FIT                                                                 | activé uniquement après validation des conditions du fournisseur |

## Pourquoi Garmin est la priorité suivante

Le programme Garmin Connect fournit une Activity API avec les détails complets
des activités et les fichiers FIT, ainsi qu’une Training API pour publier des
séances et plans vers Garmin Connect. L’accès nécessite une demande développeur
et une validation commerciale. Les données Garmin utilisées dans un modèle ou
une analyse doivent conserver une attribution explicite à Garmin.

Références : [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program/), [Activity API](https://developer.garmin.com/gc-developer-program/activity-api/), [Training API](https://developer.garmin.com/gc-developer-program/training-api/).

## Architecture cible

```text
Provider adapter
  ├── Strava adapter → activity provenance=strava
  ├── Garmin adapter → provenance=garmin
  ├── FIT adapter → provenance=file
  └── Manual adapter → provenance=manual

NormalizedActivity
  ↓
DeterministicCyclistState
  ↓
TrainingEngine
  ├── Strava-compatible deterministic views
  └── AI context only from allowed sources

AI provenance gate
  ├── allowed: file, manual, garmin (with provider attribution)
  └── forbidden: strava
```

Le contrôle doit exister dans le mobile, le service partagé et l’Edge
Function. Une modification du client ne doit jamais pouvoir contourner la
provenance.

## Produit à afficher

Le message marketing devient :

> **GRADNT transforme tes sorties en prochaine décision utile.**

L’onboarding propose trois choix clairs :

1. connecter Strava pour démarrer rapidement avec une lecture déterministe ;
2. connecter Garmin pour la synchronisation complète et les séances envoyées
   sur l’appareil, quand l’intégration est approuvée ;
3. importer un fichier FIT pour activer immédiatement le Coach IA sur les
   données originales.

Il ne faut pas promettre « Coach IA sur ton historique Strava » sans accord
écrit de Strava. La proposition de valeur reste forte si l’utilisateur voit
son état, reçoit une prochaine séance et peut activer le coaching complet avec
la source appropriée.

## Une expérience Coach, deux moteurs

L’interface peut rester unifiée et conversationnelle sans mélanger les
traitements :

```text
Coach GRADNT
  ├── Evidence Coach
  │   └── règles déterministes + faits Strava autorisés
  └── AI Coach
      └── modèle IA + FIT / Garmin / saisie GRADNT
```

Pour une activité Strava, le Coach peut répondre à des questions comme
« comment évolue mon volume ? », « que reste-t-il cette semaine ? » ou
« quelle séance est prévue ensuite ? » à partir de réponses structurées et de
textes localisés générés par GRADNT. Il ne doit pas transmettre ces faits à un
modèle pour les reformuler.

Pour une activité FIT, Garmin ou manuelle, il peut expliquer les mêmes faits,
comparer le ressenti et proposer un plan ou une adaptation avec le modèle IA.
Le message doit indiquer le moteur utilisé : `Lecture GRADNT` ou `Coach IA`.

## Actions immédiates

## Checklist de livraison

### Fondations et conformité

- [x] Décider une expérience Coach unifiée avec moteur déterministe et moteur IA séparés.
- [x] Centraliser la politique de provenance dans `source-policy.ts`.
- [x] Bloquer Strava côté mobile et Edge Function pour les appels IA.
- [x] Retirer les sorties Strava du contexte IA des sorties possédées.
- [x] Ajouter des tests de provenance et de mode Coach.
- [x] Afficher la provenance Strava, FIT, saisie manuelle et Garmin dans le détail d’une sortie.
- [ ] Ajouter fournisseur, consentement, fraîcheur et attribution complète au modèle métier.
- [ ] Obtenir une revue contractuelle Strava avant toute extension IA.

### Valeur produit

- [x] Ajouter une première décision déterministe du Coach sur la Home.
- [x] Remplacer la Home par la hiérarchie objectif → état → action → semaine.
- [x] Ajouter le Coach déterministe au détail post-sortie.
- [x] Ajouter une proposition d’adaptation du plan visible et validable.
- [x] Ajouter une première disponibilité exceptionnelle persistée et un report d’un jour validable.
- [x] Mesurer feedback, adaptation acceptée et retour après sept jours.

### Sources et IA premium

- [x] Conserver Strava comme source de démarrage et de progression déterministe.
- [x] Conserver l’import FIT comme voie IA immédiatement disponible.
- [ ] Soumettre GRADNT au Garmin Connect Developer Program.
- [ ] Implémenter OAuth Garmin côté Edge Function après approbation.
- [ ] Synchroniser les activités Garmin avec attribution obligatoire.
- [ ] Publier les workouts via Garmin Training API.
- [ ] Ajouter Wahoo/COROS seulement via accord officiel ou import FIT.

### Offre et lancement

- [ ] Définir l’offre gratuite : connexion, objectif, lecture déterministe, plan de base.
- [ ] Définir Premium : plan adaptatif, parcours, objectifs multiples, IA autorisée, Garmin/FIT.
- [ ] Ajouter abonnement Google Play à 9,99 €/mois ou 79,99 €/an après validation pilote.
- [ ] Créer les cartes partageables de progression et de prochaine action.
- [ ] Préparer le pilote de 10–15 débutants et 5 cyclistes avancés.
- [ ] Préparer la fiche Play Store et mesurer activation, rétention et conversion.

## Audit UX/UI runtime du 21 septembre 2026

Constats reproduits sur l’émulateur Android et confirmés par la lecture des
écrans :

- [x] La Home plaçait la carte de sensations avant la réponse principale du
      Coach et répétait la prochaine séance dans une seconde section.
- [x] La Home affiche désormais l’objectif, le Coach, la semaine, la prochaine
      séance puis le suivi post-sortie, sans carte de prochaine action dupliquée.
- [x] Réduire la hauteur de la carte objectif sur petit écran et rendre la
      prochaine action visible sans scroll initial.
- [x] Simplifier l’onboarding en regroupant les étapes secondaires et clarifier
      ce qui est obligatoire avant la création du compte : le récapitulatif
      redondant est retiré du parcours principal et le compte est la dernière
      étape obligatoire.
- [x] Retirer ou masquer le Garage tant que l’ajout de vélo n’est pas fonctionnel :
      la route reste disponible pour la suite, mais ne promet plus une fonction
      bêta dans la navigation principale.
- [x] Ajouter un état vide crédible pour Explorer au lieu de laisser croire à
      une génération de parcours toujours disponible : l’écran explique la
      disponibilité du moteur et renvoie vers Plan.
- [x] Harmoniser les libellés « Progression », « État actuel » et « Coach »
      pour éviter quatre mots qui décrivent la même idée.
- [ ] Vérifier chaque écran en français et en anglais avec texte long, clavier,
      rotation interdite et taille de police augmentée.

### Produit

- [x] remplacer la distinction technique « analyse IA disponible / indisponible »
      par une explication de provenance utile ;
- [x] afficher sur chaque insight sa source et son niveau de confiance ;
- [x] faire de la Home le point d’entrée objectif → état → prochaine action ;
- conserver Strava dans la boucle de progression déterministe ;
- [x] ajouter un parcours FIT visible après connexion Strava.

### Technique

- créer un `SourcePolicy` centralisé partagé par les providers et l’IA ;
- compléter le modèle de provenance avec fournisseur, consentement, fraîcheur
  et attribution ;
- encapsuler Garmin dans une Edge Function OAuth et une file de synchronisation ;
- préparer l’export des workouts vers Garmin Training API après approbation ;
- conserver l’import FIT comme chemin de production immédiatement testable ;
- journaliser uniquement les décisions de provenance, jamais le contenu complet
  dans les logs.

### Commercial

- demander l’accès au Garmin Connect Developer Program ;
- présenter GRADNT comme un coach indépendant multi-source, pas comme un
  remplacement de Strava ;
- obtenir un avis juridique écrit avant toute utilisation IA de données Strava ;
- ne pas lancer de campagne promettant une capacité non autorisée.

## Offre et lancement — version pilote

### Offre gratuite

L’offre gratuite doit permettre de comprendre la valeur de GRADNT avant tout
paiement :

- création de compte et profil cycliste ;
- un objectif principal ;
- connexion Strava et synchronisation de l’historique visible ;
- lecture déterministe de l’état et de la prochaine action ;
- plan de base sur quatre semaines ;
- feedback post-sortie ;
- import FIT et saisie manuelle disponibles, sans garantie de fonctionnalités
  Premium futures ;
- aucune promesse de Coach IA sur les données Strava.

### GRADNT Premium

L’abonnement Premium débloque :

- plan adaptatif ;
- objectifs multiples ;
- parcours quand le moteur est disponible ;
- Coach IA sur FIT, Garmin et saisie GRADNT ;
- import et historique FIT avancés ;
- synchronisation Garmin après approbation ;
- export des séances vers Garmin après approbation ;
- cartes partageables avancées.

Prix pilote proposés, à valider avant publication : **9,99 € par mois** ou
**79,99 € par an**. L’offre annuelle doit afficher explicitement son économie
par rapport au mensuel, sans masquer le prix total facturé.

### Configuration Google Play / RevenueCat

Le client utilise `react-native-purchases` avec l’entitlement `premium` et une
offre courante RevenueCat. Avant une build native de production :

1. créer l’application Android `com.altorru.gradnt` dans Google Play Console ;
2. créer les abonnements mensuel et annuel avec les prix validés ;
3. connecter Google Play à RevenueCat ;
4. créer l’entitlement `premium` ;
5. rattacher les deux produits à l’offering courant ;
6. renseigner `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` dans l’environnement EAS ;
7. construire une development build Android, car Expo Go ne réalise pas les
   achats natifs ;
8. tester achat, restauration, expiration et changement de compte avec des
   comptes de licence Google Play ;
9. ne publier qu’après vérification de l’état Premium après redémarrage et
   après déconnexion/reconnexion.

La clé RevenueCat utilisée dans l’application est une clé publique SDK. Aucun
secret Google Play, RevenueCat ou Supabase service role ne doit être ajouté à
`EXPO_PUBLIC_*` ou au dépôt.

### Activation, rétention et conversion

Les événements mesurés par `product_events` sont volontairement minimaux. Les
indicateurs sont :

| Étape           | Événement / définition                                         | Cible pilote                               |
| --------------- | -------------------------------------------------------------- | ------------------------------------------ |
| Activation      | compte terminé + objectif enregistré + première ouverture Home | ≥ 70 %                                     |
| Première valeur | première décision Coach affichée                               | ≥ 60 % des activés                         |
| Première sortie | première sortie Strava, FIT ou manuelle                        | ≥ 50 % des activés                         |
| Feedback        | `ride_feedback_saved` après une sortie                         | ≥ 35 % des activés                         |
| Adaptation      | `adaptation_accepted` lorsqu’une proposition est validée       | ≥ 20 % des feedbacks                       |
| Rétention J7    | `app_opened` au moins un jour entre J3 et J10                  | ≥ 35 %                                     |
| Conversion      | achat Premium parmi les activés éligibles                      | à mesurer, sans seuil artificiel au pilote |

Le calcul de rétention doit utiliser des utilisateurs agrégés et des dates,
jamais le contenu d’une sortie, d’une note ou d’un prompt IA.

## Pilote utilisateurs

### Échantillon

- 10 à 15 cyclistes débutants ;
- 5 cyclistes avancés ;
- au moins trois utilisateurs Android avec Google Play actif ;
- au moins trois utilisateurs en français et deux en anglais ;
- au moins deux utilisateurs avec capteur de puissance ;
- au moins trois utilisateurs sans historique Strava exploitable pour tester FIT
  et la saisie manuelle.

### Parcours à observer

1. onboarding et choix de l’objectif ;
2. connexion Strava ou démarrage sans Strava ;
3. lecture de la Home `objectif → état → action → semaine` ;
4. ajout d’une sortie FIT ou manuelle ;
5. feedback post-sortie ;
6. proposition d’adaptation ;
7. retour entre J3 et J10 ;
8. compréhension de la différence `Lecture GRADNT` / `Coach IA` ;
9. compréhension de la provenance affichée ;
10. intention de payer, sans forcer l’achat pendant les premiers tests.

### Questionnaire court

Après chaque parcours, noter de 1 à 5 :

- « Je comprends où j’en suis. »
- « Je sais quoi faire ensuite. »
- « Je comprends d’où viennent les données. »
- « Je sais quand GRADNT utilise l’IA. »
- « Je ferais confiance à cette recommandation. »

Ajouter une question ouverte : **« Qu’est-ce qui t’a semblé inutile ou confus ? »**

### Critères de sortie du pilote

Le pilote est exploitable lorsque chaque segment a réalisé au moins une sortie,
un feedback et un retour à sept jours, et que les incompréhensions critiques sont
classées par fréquence et non corrigées par une promesse marketing.

## Fiche Google Play — brouillon

### Nom court

**GRADNT — Coach vélo**

### Accroche

**Transforme tes sorties en prochaine décision utile.**

### Description courte

**Un coach vélo qui relie objectif, état, prochaine séance et vraie vie.**

### Description longue — français

GRADNT t’aide à savoir quoi faire ensuite, sans te noyer dans les chiffres.

Définis ton objectif, indique tes disponibilités et connecte Strava pour obtenir
une lecture déterministe de ton point de départ. GRADNT affiche la provenance de
chaque insight et sépare clairement la Lecture GRADNT du Coach IA.

Tu peux aussi importer un fichier FIT original ou saisir une sortie manuellement.
Ces sources peuvent activer le Coach IA lorsqu’elles remplissent les conditions
de provenance requises. Les données Strava ne sont pas envoyées au Coach IA tant
qu’un accord spécifique n’existe pas.

Avec GRADNT :

- vois ton objectif et ton état actuel ;
- reçois une prochaine action concrète ;
- suis un plan adapté à tes disponibilités ;
- partage un feedback après ta sortie ;
- valide toi-même toute adaptation du plan ;
- comprends la source et le niveau de confiance de tes insights.

Garmin et les fonctionnalités Premium seront disponibles uniquement après les
validations nécessaires. GRADNT ne remplace pas un avis médical.

### Description longue — anglais

GRADNT helps you know what to do next without drowning you in numbers.

Set your goal, choose your availability and connect Strava to get a deterministic
reading of your starting point. GRADNT shows the provenance of every insight and
clearly separates the GRADNT reading from the AI Coach.

You can also import an original FIT file or enter a ride manually. These sources
may activate the AI Coach when their provenance requirements are met. Strava data
is not sent to the AI Coach while a specific agreement is unavailable.

With GRADNT you can:

- see your goal and current state;
- receive one concrete next action;
- follow a plan that respects your availability;
- record post-ride feedback;
- approve every plan adaptation yourself;
- understand the source and confidence of each insight.

Garmin and Premium features will be available only after the required approvals.
GRADNT does not replace medical advice.

### Assets à préparer

- icône adaptive Android ;
- captures Home en français et en anglais ;
- capture détail de sortie avec provenance ;
- capture import FIT ;
- capture Coach IA sur source autorisée ;
- capture plan et adaptation validable ;
- visuel avant/après illustrant la prochaine action.
