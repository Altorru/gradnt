# GRADNT — développement vers la commercialisation

## Décisions confirmées

- Application native Expo actuelle, sans reconstruire l’ancien concept web.
- Strava + saisie manuelle + import des fichiers originaux avant Garmin/Wahoo.
- Supabase comme stockage des comptes et des données produit, sur le projet déjà utilisé pour Strava. La connexion Strava reste propre à chaque appareil dans cette première étape.
- Données privées par cycliste ; les activités de l’API Strava ne sont pas copiées dans les documents de sauvegarde des réglages et calendriers. Hugo maintient explicitement l’analyse IA des sorties Strava dans le périmètre malgré le risque contractuel identifié ; ce choix doit être réexaminé avant commercialisation, sans interrompre la conception de la boucle après-sortie.
- Développement par lots cohérents, commits réguliers, lint et typecheck avant chaque commit.

## Lot réalisé — compte privé et calendrier durable

- [x] Connexion email/mot de passe et confirmation email.
- [x] Migration explicite des réglages de l’appareil vers un compte vide.
- [x] Profil, objectif et disponibilités privés dans Supabase.
- [x] Plan sauvegardé avec dates stables, identités distinctes et historique des plans remplacés.
- [x] Protection contre un écrasement entre deux appareils.
- [x] Sauvegardes attendues avant de naviguer ; erreurs visibles.
- [x] Prochaine séance chronologique, comprenant les séances déplacées.
- [x] Nouveau plan proposé et confirmé quand les réglages changent ou que le calendrier est terminé.
- [x] Vérification des règles SQL avec deux utilisateurs, puis application au projet distant.
- [ ] Vérification sur téléphone et sur deux appareils avant validation commerciale.

## Validation du lot

- `pnpm lint` et `pnpm typecheck` passent.
- Vitest : 32 fichiers, 299 tests réussis.
- `supabase test db` : 15 assertions SQL, utilisateurs isolés et révisions protégées.
- `node infra/scripts/test-private-workspace.mjs` : connexion réelle via l’API locale, isolation, restauration dans un second client et conflit HTTP 409 vérifiés ; comptes temporaires supprimés.
- Exports des bundles iOS, Android et web réussis. Il ne remplace pas une recette sur téléphone.
- Les migrations `20260917000100` à `20260917000500` sont appliquées au projet Supabase existant ; elles ajoutent les documents privés, les ressentis, l'association Strava serveur, les appareils push et l'idempotence webhook.
- Vérification distante anonyme : lectures et écritures refusées ; aucun compte de test distant créé, aucune donnée utilisateur lue.
- Le correctif HTTP 409 évite les relances de PostgREST déclenchées par un conflit métier signalé à tort comme erreur de sérialisation. [Documentation du problème](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

### Limites et suites de ce lot

- Les anciens statuts locaux sans dates d’origine sont migrés une fois avec un avertissement visible ; ils ne constituent pas un historique daté fiable.
- Reconstruire l’app native pour intégrer SQLite, puis faire la recette iOS/Android et deux vrais appareils.
- Vérifier SMTP, confirmation email et récupération de mot de passe ; ajouter Google avant lancement public si conservé dans le périmètre.
- L’import explicite copie les réglages ; il ne transfère pas encore le calendrier local. Celui-ci reste conservé sur l’appareil. Le calendrier cloud est nouveau. Ajouter une migration transactionnelle de l’ensemble avant d’élargir la bêta.
- Avec un compte connecté, une panne réseau affiche une erreur sans remplacer le plan par un calendrier local divergent. Ajouter un cache privé par compte et une synchronisation hors connexion contrôlée.
- FTP, préférences et jetons Strava restent locaux dans ce lot ; leur migration et la liaison OAuth serveur sont à traiter séparément.
- Le calendrier initial reste un générateur déterministe de démarrage, pas encore le moteur adaptatif validé avec un entraîneur.
- Vérifier export/suppression du compte, rétention des archives, quotas et CI avant commercialisation.

## Lot réalisé — sensations après sortie et détail exploitable

- [x] Carte contextuelle dans le cockpit après la dernière sortie terminée des 48 dernières heures ; demande de sensations ou conseil déjà enregistré.
- [x] Association Strava privée côté serveur, webhook Edge Function idempotent et traitement différé.
- [x] Enregistrement des tokens Expo après permission et notification ouvrant directement le formulaire de sensations.
- [x] Actualisation des activités et des ressentis au retour de l’app au premier plan.
- [x] Accès depuis les trois dernières sorties dans Progression ; actualisation disponible.
- [x] Effort perçu, sensations, fatigue et note facultatifs ; validation vide refusée.
- [x] Brouillon par compte et sortie, sauvegarde sur l’appareil, reprise et modification.
- [x] Table Supabase privée `ride_feedback`, contenant uniquement les réponses renseignées par le cycliste et la référence de sortie.
- [x] Écriture exclusivement via RPC avec révision attendue ; identité issue de la session, aucun utilisateur fourni par le client.
- [x] Conflits entre appareils, erreurs visibles et retour au détail uniquement après succès.
- [x] Brouillon ancien détecté ; abandon explicite avant rechargement.
- [x] Vérification de la disponibilité de la sortie avant validation.
- [x] Détail des chiffres, réponses personnelles et prochaine action fondée sur les sensations ; données des capteurs à la demande.
- [x] Choix tactiles accessibles, labels lecteurs d’écran et traductions français/anglais.
- [ ] Recette native et pilote cyclistes selon le [protocole de recette et pilote](2026-09-17-recette-et-pilote-apres-sortie.md), avec abonnement Strava réel.

### Validation et limites

- Vitest : 34 fichiers, 338 tests réussis ; lint et typecheck passent.
- SQL : 38 assertions sur les documents et ressentis privés ; tests API avec deux comptes temporaires locaux et un second client du propriétaire.
- Migration `20260917000300` appliquée au Supabase existant, sans modification des fonctions Strava ; aucune activité de performance copiée dans la table des ressentis.
- Les exports iOS/Android/web passent ; ils ne prouvent pas l’ergonomie native du formulaire.
- Les brouillons sont locaux, distincts par compte, mais pas synchronisés entre appareils. Ils ne constituent pas une réponse validée et ne sont pas effacés par une simple déconnexion ; prévoir rétention et purge avec l’export/suppression du compte.
- Le mode sans compte reste local ; aucune migration des anciens ressentis vers un compte n’est faite silencieusement.
- Les conflits exigent un rechargement ; aucune fusion automatique des notes concurrentes.
- Le conseil est déterministe, fondé uniquement sur les sensations déclarées, sans IA et sans modification automatique du plan. La comparaison prévu/réel reste à développer.
- Le push réel exige encore la configuration de `STRAVA_WEBHOOK_VERIFY_TOKEN`, `STRAVA_WEBHOOK_SUBSCRIPTION_ID` et `EXPO_PUBLIC_EAS_PROJECT_ID`. Le mobile conserve son cache local Strava pour la continuité ; l'association serveur est créée lorsque l'échange OAuth porte une session Supabase.

## Correctif réalisé — requêtes Strava isolées par session

- Les requêtes concurrentes sont maintenant partagées uniquement dans la même génération de jetons et pour la même fenêtre historique.
- Une réponse reçue après un changement de jetons est ignorée ; les données d’une ancienne connexion ne rejoignent pas la nouvelle session.
- Les écritures et suppressions de jetons natifs sont sérialisées. Le rafraîchissement et l’échange OAuth remplacent les jetons uniquement si leur génération initiale est encore active.
- Une réponse de rafraîchissement rejetée ne supprime pas les identifiants d’une connexion plus récente ; une réussite ancienne ne rétablit pas une session déconnectée.
- Validation : 36 fichiers, 355 tests, incluant les courses entre lecture, écriture, déconnexion et changement de session. Aucun changement des fonctions serveur Strava.

## Validation actuelle et prochaine étape

- 37 fichiers Vitest, 360 tests réussis ; lint et typecheck passent.
- 38 assertions SQL et test API local à deux cyclistes réussis. Trois migrations présentes sur le Supabase existant.
- Bundles iOS, Android et web exportés avec les deux nouvelles routes de sortie.
- Le cockpit affiche une seule carte après sortie récente, sans devenir un fil d’activités ; les réponses sauvegardées deviennent un conseil expliqué.
- Le formulaire dispose d’actions accessibles avec clavier ouvert ; les choix sélectionnés portent une coche en plus de la couleur. Recette sur téléphone encore nécessaire.
- Le [pilote de deux semaines](2026-09-17-recette-et-pilote-apres-sortie.md) fixe des hypothèses de temps de saisie, compréhension, réutilisation et valeur distincte ; aucun de ces résultats n’est encore revendiqué.
- Prochain lot fonctionnel : saisie manuelle puis fichiers originaux ; liaison Strava authentifiée côté serveur, listener et push ensuite. IA, comparaison prévu/réel et adaptations restent distinctes des conseils actuels.

## Priorité suivante — boucle après-sortie demandée par Hugo

**Parcours cible :** sortie terminée → Strava synchronisé → notification → sensations en quelques secondes → validation → détail de la sortie → analyse compréhensible → prochaine action proposée.

### 1. Listener fiable

- Souscrire aux webhooks officiels Strava depuis le backend : validation de la souscription, événements de création, modification et suppression, révocation d’accès.
- Associer l’athlète Strava au compte GRADNT après un OAuth authentifié côté serveur. Un identifiant d’athlète fourni librement par le client ne suffit pas à prouver cette association.
- Répondre rapidement au webhook puis traiter dans un job durable. Vérifier les données avec les autorisations de l’utilisateur.
- Prévenir les doublons d’événements et de notifications avec une clé d’unicité incluant l’utilisateur et la sortie. Gérer événements en retard, relances et import historique.
- Ne notifier que les nouvelles sorties vélo, jamais chaque activité du backfill. Une modification ne renvoie pas la même demande.
- Conserver uniquement les données et durées autorisées par le contrat Strava ; traiter les suppressions et révocations. Vérifier les usages précis avant ouverture commerciale.

### 2. Notification utile

- Exemple : « Belle sortie ! Comment t’es-tu senti ? » et « Ajoute tes sensations en quelques secondes. »
- Ne pas féliciter une performance inconnue ni inventer un record ou un diagnostic.
- Notification activable séparément ; badge dans l’app si permission refusée ; plage de silence ; lien vers le bon formulaire après ouverture à froid.
- Enregistrer les jetons push par compte et appareil. Les retirer à la déconnexion et gérer les jetons expirés et les reçus d’envoi.
- La notification ne contient pas de localisation, d’informations de santé ou de contenu sensible.

### 3. Beau formulaire mobile, rapide et facultatif

- Effort perçu de 1 à 10, avec libellés accessibles ; sensations de « difficile » à « excellent » ; fatigue ressentie ; note libre facultative.
- Les réponses sont facultatives ; « Plus tard » disponible. Pas de note préremplie présentée comme donnée réelle.
- Détails progressifs pour les cyclistes expérimentés. Grandes cibles tactiles, labels explicites, aucune information portée seulement par la couleur.
- Modification ultérieure possible ; une seule réponse active par sortie, avec date et provenance utilisateur.
- La validation n’est annoncée qu’après sauvegarde réussie dans le compte. Une erreur conserve le brouillon et permet de réessayer.
- Après validation, ouvrir le détail de la bonne sortie. Si la sortie a été supprimée ou l’accès révoqué, afficher un état explicite.

### 4. Analyse et valeur ajoutée

- Séparer les faits, les conclusions déterministes et l’interprétation IA.
- Décision explicite de Hugo : conserver l’analyse IA des sorties Strava dans le périmètre. Le contrat actuel interdit l’usage des données API et de leurs dérivés dans l’opération d’une IA, y compris dans une fenêtre de contexte. Consigner le risque de révocation et la dépendance commerciale ; ne pas présenter un consentement utilisateur comme une autorisation contractuelle de Strava.
- Implémenter une couche d’analyse avec provenance des données, consentement utilisateur et périmètre explicite. Garder aussi l’import original et la saisie manuelle pour réduire la dépendance au fournisseur. Les seuls ressentis ne suffisent pas à inventer une analyse de puissance.
- L’analyse doit répondre à « Comment s’est passée ma sortie ? », « Qu’est-ce que mes sensations apportent ? » et « Que faire ensuite ? », avec les limites des données affichées.
- Une adaptation du calendrier est une proposition visible, justifiée et acceptée par l’utilisateur. Ne pas transformer un mauvais ressenti isolé en diagnostic médical ou surentraînement certain.

### 5. Tickets ordonnés et critères de recette

1. Liaison OAuth compte GRADNT ↔ athlète Strava, stockage serveur des secrets et révocation. Le [protocole de test webhook](2026-09-17-test-webhooks-strava.md) couvre la validation, le test manuel et la recette réelle.
2. Webhook validé + table d’événements + jobs idempotents + tests de créations/modifications/suppressions.
3. Appareils push + préférences + reçus + notification et ouverture de la bonne sortie à froid.
4. Modèle des ressentis + table privée + formulaire + brouillon + modification : livré, recette native à faire.
5. Détail après validation + affichage de la provenance et de l’état de l’analyse.
6. Saisie manuelle et import original, puis analyse IA structurée avec limites et erreurs.
7. Proposition d’adaptation + comparaison avant/après + confirmation + historique.

**Recette obligatoire :** deux cyclistes restent isolés ; trois livraisons du même webhook produisent une demande ; aucun push après déconnexion ; aucun push pour le backfill ; formulaire rouvert sans perdre le brouillon ; sauvegarde en échec sans fausse validation ; sortie supprimée traitée ; débutant sans capteur et cycliste équipé comprennent la prochaine action ; provenance et périmètre des données IA traçables, aucune donnée d’un autre utilisateur dans l’analyse.

**Mesures de valeur :** taux de réponses, temps médian pour répondre, compréhension de la prochaine étape, retour après la sortie suivante, acceptation puis utilité perçue des adaptations. Fixer les seuils après les premiers essais ; ne pas confondre clics sur les notifications et bénéfice d’entraînement.

## Suites

1. Saisie manuelle exploitable sans connexion Strava.
2. Import original et provenance vérifiable.
3. Moteur d’entraînement ajusté aux objectifs, à l’expérience et aux contraintes réelles.
4. Adaptations expliquées et contrôlées.
5. Parcours adaptés à la séance.
6. Tests cyclistes, onboarding mesuré, sécurité et confidentialité, coûts, facturation et préparation des stores.

Référence : [audit et plan de commercialisation](2026-09-17-audit-et-plan-commercialisation.md). Contrat : [Strava API Agreement](https://www.strava.com/legal/api_policy). Documentation : [webhooks Strava](https://developers.strava.com/docs/webhooks/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Expo SQLite 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).
