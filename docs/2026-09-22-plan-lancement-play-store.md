# GRADNT — Plan de lancement Play Store

## Promesse à rendre évidente

**GRADNT dit au cycliste où il en est, quoi faire maintenant, puis adapte la
suite à sa vraie vie.**

Un débutant doit comprendre cette phrase sans connaître la FTP, la charge ou
les zones. Un cycliste expérimenté doit pouvoir ouvrir les faits et la méthode
derrière le conseil. La progression et les décisions passent avant la liste de
sorties.

## 1. Boucle post-sortie — signature produit

- [x] Une création d’activité Strava est reçue par le webhook Supabase de façon
      idempotente.
- [x] Le webhook vérifie que l’activité est une sortie vélo non privée avant de
      demander une notification.
- [x] La notification ouvre directement le formulaire de sensations de la bonne
      sortie.
- [x] Le formulaire garde un brouillon et n’enregistre jamais une réponse vide.
- [x] Le détail affiche une lecture déterministe, le ressenti, une prochaine
      action et une adaptation proposée que le cycliste valide lui-même.
- [x] L’accueil donne cette boucle priorité après une sortie récente, avant les
      métriques secondaires et le partage.
- [ ] Mesurer le tunnel sans enregistrer de notes ni de données de santé :
      ouverture du formulaire, report, sauvegarde, ouverture du détail et
      adaptation acceptée.
- [ ] Recetter le scénario complet sur un compte Strava de test : création,
      doublon de webhook, notification à froid, formulaire, détail et adaptation.

**Message utilisateur :** « Ta sortie est là. Ajoute ton ressenti et GRADNT
prépare la suite. »

## 2. Bêta fermée — preuve d’utilité

- [ ] Recruter 20 cyclistes : 10 débutants motivés et 10 réguliers ou avancés.
- [ ] Préparer une fiche de consentement et un canal de retours distinct des
      notes privées dans l’application.
- [ ] Tester deux sorties par personne et relever compréhension de la prochaine
      action, temps de ressenti et réutilisation spontanée à J+7.
- [ ] Obtenir au moins 12 testeurs inscrits en continu pendant 14 jours si le
      compte Play personnel requiert l’accès production.
- [ ] Corriger les blocages avant d’élargir la bêta.

## 3. Fiche Play Store — vendre une décision, pas des écrans

- [ ] Rédiger la description courte : « Comprends ta progression et sais quoi
      rouler ensuite. »
- [ ] Produire des captures réelles FR et EN : objectif, prochaine séance,
      sensations, débrief, adaptation et parcours.
- [ ] Créer une vidéo verticale de 15 secondes centrée sur la boucle
      sortie → ressenti → prochaine action.
- [ ] Ajouter politique de confidentialité, suppression de compte, support et
      compte de démonstration pour la revue Play.
- [ ] Lancer une expérimentation de fiche Store sur les captures et la phrase
      d’accroche après les premiers installs.

## 4. Offre Premium — monétiser la valeur récurrente

- [ ] Garder gratuit : activités, objectif principal, ressenti et lecture
      déterministe.
- [ ] Réserver à Premium : plan adaptatif, objectifs multiples, Coach IA sur
      sources autorisées et parcours intelligents.
- [ ] Déclencher la présentation Premium seulement après que la première valeur
      ait été observée, jamais pendant l’onboarding.
- [ ] Tester prix, essai et conversion avec la bêta avant un lancement large.

## 5. Acquisition — rendre la promesse mémorable

- [ ] Tourner trois vidéos courtes : « Tu roules, GRADNT prépare la suite »,
      « Pas besoin de jargon », « Ton plan s’adapte à ta semaine ».
- [ ] Recruter dans les clubs, groupes Strava locaux et communautés vélo route.
- [ ] Demander un retour factuel après deux sorties, pas un avis générique.
- [ ] Réutiliser les formulations réelles des testeurs, avec leur accord, dans
      les contenus et la fiche Store.

## Indicateurs de décision

| Étape              | Événement                                | Seuil bêta à tester                 |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| Valeur post-sortie | Ressenti sauvegardé                      | au moins 35 % des cyclistes activés |
| Utilité du plan    | Adaptation acceptée                      | au moins 20 % des ressentis         |
| Compréhension      | Le cycliste explique sa prochaine action | 15 personnes sur 20                 |
| Retour             | Cycliste actif à J+7                     | à établir après le premier groupe   |

Les seuils sont des hypothèses de pilotage. Ils servent à décider quoi corriger
avant d’acheter du trafic, pas à prétendre démontrer une efficacité sportive.
