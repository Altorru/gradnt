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
- [ ] Ajouter provenance, fournisseur, consentement, fraîcheur et attribution au modèle métier.
- [ ] Obtenir une revue contractuelle Strava avant toute extension IA.

### Valeur produit

- [x] Ajouter une première décision déterministe du Coach sur la Home.
- [ ] Remplacer la Home par la hiérarchie objectif → état → action → semaine.
- [ ] Ajouter le Coach déterministe au détail post-sortie.
- [ ] Ajouter une proposition d’adaptation du plan visible et validable.
- [ ] Ajouter les disponibilités exceptionnelles et le report intelligent.
- [ ] Mesurer feedback, adaptation acceptée et retour après sept jours.

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

### Produit

- remplacer la distinction technique « analyse IA disponible / indisponible »
  par une explication de provenance utile ;
- afficher sur chaque insight sa source et son niveau de confiance ;
- faire de la Home le point d’entrée objectif → état → prochaine action ;
- conserver Strava dans la boucle de progression déterministe ;
- ajouter un parcours FIT visible après connexion Strava.

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
