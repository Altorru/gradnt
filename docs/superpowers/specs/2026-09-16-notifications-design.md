# Système de notifications GRADNT — design

Date : 2026-09-16
Statut : validé en brainstorming, en attente de relecture du spec

## Le problème

Le header porte un bouton cloche depuis l'origine et il n'a **aucun handler**.
`expo-notifications` est installé, son plugin est configuré avec l'icône et la
couleur de marque, et rien ne l'utilise. L'app annonce une fonctionnalité qu'elle
n'a pas.

Ce document décrit le système complet : ce qu'on notifie, quand, comment le texte
est produit, et comment on garantit qu'une notification programmée reste vraie.

## Décisions prises, et pourquoi

Quatre choix ont été tranchés en brainstorming. Ils contraignent tout le reste.

### 1. Tout est local, aucun serveur

Rappels et relances sont programmés **sur l'appareil**. Aucune infrastructure.

Les Réglages affichent déjà « _GRADNT keeps nothing on its servers_ ». Le push
serveur exige un backend qui stocke les tokens d'appareil : il faudrait réécrire
cette promesse. On ne le fait pas.

### 2. L'heure du rappel est choisie par le rider

Le planificateur écrit `setHours(7, 0, 0, 0)` en dur (`first-plan.ts:59`) : la
date-heure d'une séance est une **convention du générateur**, pas une heure de
séance. Un rappel dérivé de `workout.date` sonnerait donc à 7 h pour tout le
monde, arbitrairement.

Le rider règle une heure, qui ne sonne que les jours portant une séance planifiée.

### 3. Pas de chiffre qui ne soit vérifiable

Une notification locale ne peut porter que **ce que l'app savait quand elle l'a
programmée**. STRAVA n'est synchronisé qu'à l'ouverture de l'app.

Si le rider ouvre l'app lundi, on programme le bilan de dimanche avec les chiffres
de lundi ; s'il roule ensuite sans rouvrir l'app, dimanche il reçoit
« 4 sorties · 142 km » alors qu'il en a fait 6.

Règle : **les chiffres ne paraissent que si les données sont fraîches**. Sinon la
notification tombe sur une formulation sans chiffres. Le reste du code refuse déjà
d'afficher un chiffre inventé ou périmé ; les notifications ne font pas exception.

**Conséquence pour le bilan hebdomadaire.** Il est programmé comme une alarme
_répétante_ — dimanche 18 h, pour toujours — et non comme une date absolue. Une
date absolue n'était réarmée qu'à la réconciliation suivante, laquelle ne tourne
qu'à l'ouverture de l'app : un rider qui n'ouvrait pas l'app était prévenu une
seule fois.

Un texte répétant est écrit une fois et lu des semaines plus tard, donc il ne peut
rien citer. Le bilan utilise la formulation sans chiffres, et les chiffres
s'affichent dans l'app. C'est le prix, assumé, de la fiabilité.

### 4. La cloche est retirée

Il n'y a pas d'historique en local : la cloche n'a rien à lister. Elle ouvrirait un
écran vide ou dupliquerait les Réglages.

Les notifications se règlent dans **Réglages › Notifications**. Le header garde le
wordmark et Settings.

## Périmètre

**Dedans** — quatre notifications, leur programmation, leur texte bilingue, leur
présentation native, la section de Réglages, la demande de permission, les tests.

**Dehors** — pas de push serveur, pas de boutons d'action dans les notifications,
pas de badge applicatif, pas de boîte de réception. Le français stocké dans les
données de plan est traité en « Suites » plus bas, pas ici.

## Architecture

Le découpage suit celui qui existe : le pur dans `lib/domain`, l'impur dans
`services`.

### `src/lib/domain/notification-plan.ts` — pur

```ts
export type DesiredNotification =
  | { kind: 'session'; key: string; fireAt: Date; workout: PlannedWorkout }
  | { kind: 'weekly'; key: string; fireAt: Date; summary: WeeklySummary | null }
  | { kind: 'inactivity'; key: string; fireAt: Date }

export function planNotifications(input: {
  workouts: PlannedWorkout[]
  preferences: NotificationPreferences
  lastActivityAt: string | null
  lastSyncedAt: string | null
  weeklySummary: WeeklySummary | null
  goal: { key: string; progress: number } | null
  celebrated: CelebrationRecord
  now: Date
}): DesiredNotification[]
```

**Raffinement décidé en écrivant le plan :** `planNotifications` ne prend **pas** de
traduction. Décider _ce qui_ et _quand_ est une préoccupation ; décider _comment ça
se dit_ en est une autre. La mise en mots vit dans `describeNotification` (même
module, pure aussi), et le déclencheur « changement de langue » fonctionne
toujours : la réconciliation re-décrit à chaque passage.

Les types que la signature emploie :

```ts
export type WeeklySummary = {
  rides: number
  hours: number
  distanceKm: number
  elevationGainM: number
}

export type CelebrationRecord = { [goalKey: string]: number } // 25 | 50 | 75 | 100
```

`fireAt` est toujours renseigné. Un `fireAt` **antérieur ou égal à `now`** se
programme immédiatement (`trigger: null`) — c'est le cas du palier d'objectif, qui
n'a pas de date future.

N'importe **rien** d'`expo-notifications`. C'est ce qui permet de tester « le rider
déplace sa séance, l'ancien rappel disparaît » en trois lignes, comme
`selectors.ts` aujourd'hui.

Les clés sont **déterministes** : `session:<workoutId>`, `weekly:<dimanche>`,
`inactivity:<date>`. C'est ce qui rend la réconciliation exacte.

Celle du bilan porte la **date** du prochain dimanche, et non un identifiant fixe,
pour une raison de plateforme : `expo-notifications` programme sur Android une
alarme exacte unique qu'il ne reprogramme jamais, et rien ne retire la requête de
son store quand elle sonne. Une clé fixe serait donc relue comme « encore en
attente » à chaque ouverture et ne serait jamais réarmée — le bilan sonnerait une
fois, à vie. Datée, elle laisse l'ouverture suivante reconnaître l'entrée qu'elle
remplace et annuler la précédente.

### `src/services/notifications/notification.scheduler.ts` — impur

```ts
export async function reconcile(desired: DesiredNotification[]): Promise<void>
```

Lit `getAllScheduledNotificationsAsync()`, annule celles dont la clé est absente de
`desired`, programme celles qui manquent. **Idempotent** : appeler `reconcile` dix
fois ne duplique rien.

Seules les notifications portant une clé de notre espace de nommage sont
considérées ; on n'annule jamais autre chose.

### Les préférences, dans le fichier existant

Pas de `notification.preferences.ts` : les cinq champs rejoignent
`src/services/preferences/preferences.persistence.ts`. Un second fichier de
persistance voudrait dire une seconde hydratation, et deux chemins qui peuvent
diverger sur ce que « les préférences » contiennent.

### Le point d'entrée unique

Un hook monté au niveau du layout des onglets appelle `reconcile`. Cinq
déclencheurs, un seul chemin :

1. ouverture de l'app (retour au premier plan)
2. changement de `workoutsQuery.data`
3. fraîcheur des données (dernière synchro)
4. changement de préférence de notification
5. **changement de langue**

Le cinquième n'est pas évident : le texte est composé **au moment de la
programmation**, donc un rider qui passe en anglais garderait ses notifications en
français jusqu'à ce qu'elles sonnent.

Un seul point d'entrée est ce qui évite la dérive : programmer au fil des
événements demanderait à chaque appelant de se souvenir d'annuler, et un seul
chemin oublié — une séance déplacée depuis l'écran de détail — laisserait un
rappel orphelin.

## Modèle de données

Les préférences s'ajoutent à `preferencesSchema`, **à plat, chaque champ avec son
`.default()`** :

```ts
sessionReminder: z.boolean().default(true),
reminderHour:    z.number().int().min(0).max(23).default(7),
reminderMinute:  z.number().int().min(0).max(59).default(0),
weeklySummary:   z.boolean().default(true),
inactivityNudge: z.boolean().default(false),
```

**Pourquoi `.default()` et pas des champs obligatoires.** `loadPreferences` fait un
`safeParse` et retombe sur `defaultPreferences` en cas d'échec. Des champs requis
feraient échouer la lecture des préférences **déjà enregistrées** : tout rider
existant perdrait sa langue et son apparence à la mise à jour, en silence.

**Pourquoi à plat et pas dans un sous-objet `notifications`.** En zod, un
`.default({})` sur un objet ne fait **pas** appliquer les defaults de ses champs :
`ZodDefault` renvoie la valeur par défaut sans la reparser. `notifications` vaudrait
`{}` et chaque champ serait `undefined` au lieu de `true`/`7`.

L'heure se stocke en deux entiers plutôt qu'en chaîne `"07:00"` : pas de parsing,
pas de fuseau à interpréter, et le sélecteur travaille déjà en heures/minutes.

Le palier fêté demande un petit état persisté en plus, sinon il se répète à chaque
réconciliation :

```ts
celebratedThresholds: { [goalKey: string]: number }   // 25 | 50 | 75 | 100
```

### Fraîcheur des données

La règle « pas de chiffre périmé » a besoin d'une définition, sinon elle n'est pas
implémentable.

- `lastActivityAt` — `max(activity.startAt)` sur les activités connues, `null` s'il
  n'y en a aucune.
- `lastSyncedAt` — l'instant de la dernière lecture **réussie** des activités.
  TanStack Query 5.103 l'expose déjà : `activitiesQuery.dataUpdatedAt` **est** cet
  instant. Rien à persister, contrairement à ce que ce spec supposait d'abord.
- **Seuil : 24 heures.** Au-delà, les chiffres ne paraissent plus.

Pourquoi 24 h : c'est le plus long intervalle pendant lequel un rider actif peut
n'avoir ouvert l'app sur aucun de ses jours de vélo. Plus court, on prive de
chiffres un rider parfaitement normal ; plus long, on accepte de lui annoncer une
semaine qu'il a dépassée depuis.

Le seuil est une constante nommée, pour qu'il se teste.

## Les quatre notifications

| Type                 | Déclencheur                                                                         | Contenu                           | Ouvre        |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------- | ------------ |
| Rappel de séance     | chaque séance `planned` à venir, à l'heure choisie, le jour de la séance            | type localisé + durée + intensité | `/plan/<id>` |
| Bilan de semaine     | hebdomadaire à `WEEKLY_HOUR`                                                        | chiffres si frais, sinon sans     | `/progress`  |
| Relance d'inactivité | dernière sortie ≥ `INACTIVITY_DAYS` **et** données fraîches ; désactivée par défaut | sans chiffres                     | `/home`      |
| Palier d'objectif    | détecté au recalcul quand la progression franchit 25/50/75/100 %                    | le palier + le chiffre            | `/progress`  |

Le palier est le seul non programmable dans le futur : il se détecte au moment du
recalcul et part immédiatement.

### Les constantes, nommées

Quatre valeurs décident du comportement. Nommées, elles se testent ; écrites en
littéral dans le code, elles ne se testent pas.

| Constante             | Valeur         | Rôle                                |
| --------------------- | -------------- | ----------------------------------- |
| `FRESHNESS_WINDOW_MS` | 24 h           | au-delà, plus de chiffres           |
| `SCHEDULE_CAP`        | 20             | plafond de notifications en attente |
| `INACTIVITY_DAYS`     | 4              | jours sans sortie avant relance     |
| `WEEKLY_HOUR`         | dimanche 18:00 | heure du bilan                      |

`WEEKLY_HOUR` est **fixe** : la section Réglages n'offre qu'un réglage d'heure,
celui du rappel de séance. Exposer deux heures pour une app qui n'en règle qu'une
serait une incohérence, et le bilan de fin de semaine n'a pas la même contrainte
qu'un rappel : personne ne règle sa journée autour de lui.

## i18n

`planNotifications` reçoit `{ t, plural }`, comme `getDeterministicTrainingInsight`.
Tout le texte vient du catalogue, sous `notifications.*`.

**Le libellé de séance est dérivé de `workout.type`**, jamais de `workout.title` —
voir « Suites ».

## Présentation native

Le handler se règle au niveau module avec **`shouldShowBanner` / `shouldShowList`**.
Les anciens `shouldShowAlert` n'existent plus en SDK 57. Sans handler, une
notification reçue app ouverte est jetée silencieusement.

|                | Android                                                | iOS                 |
| -------------- | ------------------------------------------------------ | ------------------- |
| Canal par type | `sessions` / `weekly` / `nudges`, importance distincte | —                   |
| Accent         | `color: '#76B900'`                                     | —                   |
| Niveau         | `priority`                                             | `interruptionLevel` |
| Regroupement   | canal                                                  | `threadIdentifier`  |

`subtitle` a été **écarté** en écrivant le plan. Le seul contenu honnête à y mettre
serait le jour (« Demain », « mardi »), et le dire proprement demande une couche de
formatage de date sensible à la langue que la notification ne justifie pas — le
corps porte déjà l'essentiel. Un champ rempli pour remplir n'est pas de
l'enrichissement.

`interruptionLevel` différencié : **`active`** pour le rappel de séance,
**`passive`** pour le bilan de semaine — il atterrit dans le centre de
notifications sans allumer l'écran ni sonner. Un bilan hebdomadaire qui réveille
quelqu'un est un bilan qu'on désactive.

Les canaux Android **dupliquent nos interrupteurs au niveau de l'OS** : un rider
peut taire les relances sans couper les rappels de séance, depuis les réglages
Android — qui est là où il cherchera.

### Ce qu'on ne met pas

- **Pas de boutons d'action.** `categoryIdentifier` est marqué _iOS uniquement_
  dans `NotificationContentInput` : sur Android ça ne suivrait pas. Une action qui
  écrit de la donnée doit s'exécuter app fermée, ce qui demande
  `expo-task-manager`. Le tap ouvre déjà le bon écran.
- **Pas de badge.** `setBadgeCountAsync` exige la permission `allowBadge`, et un
  badge annonce des éléments non lus — il n'y a pas d'historique, donc ce serait un
  compteur menteur.

### Contraintes de plateforme

**iOS plafonne à 64 notifications locales en attente par app**, et jette
silencieusement les suivantes. Un plan de plusieurs semaines avec une entrée par
séance dépasse la limite : les dernières séances ne seraient jamais rappelées, sans
aucun signe. L'ensemble désiré est donc **tronqué aux plus proches**, plafond nommé
à **20** — de quoi couvrir plusieurs semaines à trois séances, en gardant de la
marge sous la limite système. Le plafond compte toutes les catégories.

**Ce que le plan et le plafond garantissent — et ce qu'ils ne garantissent pas.**
Le plan est écrit **quatre semaines** d'avance, précisément pour qu'un rappel
survive à une absence : la réconciliation ne tourne qu'à l'ouverture, donc rien
au-delà du plan n'existe tant que le rider n'ouvre pas. Le plafond de 20, lui,
compte les séances, et le plan en produit jusqu'à vingt-huit pour un rider
disponible tous les jours — les plus lointaines sont alors perdues.

La garantie est donc « **au moins trois semaines** sans ouvrir l'app », et non
« pour toujours ». C'est la borne à connaître avant de promettre l'inverse.

**Le web n'a pas de notifications.** `expo-notifications` ne supporte qu'Android et
iOS, et l'app se lance aussi sur web (`pnpm web`). La réconciliation et la section
Réglages se désactivent sur web plutôt que de planter ou de montrer des
interrupteurs sans effet.

**Changement d'heure.** Un rappel de séance vise un jour précis : c'est une heure
murale calculée au moment de la programmation, donc un passage à l'heure d'été dans
l'intervalle le décale d'une heure — un rappel de 07:00 qui sonne à 06:00. Le
déclencheur hebdomadaire n'a pas ce défaut, il est exprimé en composants et l'OS le
suit. On accepte le décalage pour les séances : la réconciliation à chaque ouverture
borne la fenêtre à quelques jours, et le corriger demanderait de tout reprogrammer à
chaque transition.

## Configuration native

```json
"android": { "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"] }
```

Sans elle, Android 12+ ne peut pas déclencher à une heure exacte.

Elle doit vivre dans `app.json` : `android/` est gitignoré et régénéré par
`prebuild`, donc une permission posée à la main dans le manifest disparaîtrait —
c'est exactement le piège rencontré avec les chaînes de localisation.

## Permissions

**On ne demande pas au lancement.** Un prompt à la première ouverture se fait
refuser, et un refus est souvent définitif. On demande **quand le rider active un
interrupteur dans Réglages** : à ce moment il a exprimé une intention.

- **Android 13** : le prompt système n'apparaît pas tant qu'aucun canal n'existe.
  Les canaux sont donc créés **avant** la demande.
- **iOS** : lire **`ios.status`**, pas le `status` racine. `PROVISIONAL` compte
  comme autorisé.

Si la permission est refusée, la section le dit et renvoie vers les réglages
système, plutôt que d'afficher des interrupteurs inertes.

## UI

**`AppBrandHeader` perd la cloche** ; il garde le wordmark et Settings, et reste
sur les quatre onglets primaires. La clé `header.notifications` du catalogue devient
morte et est retirée des deux langues.

**Nouvelle section dans Réglages**, sur le pattern existant (libellé + `GradntChip`) :

```
NOTIFICATIONS
  Rappel de séance        [ ●——]
  Heure du rappel         −  07:00  +
  Bilan de semaine        [ ●——]
  Relance d'inactivité    [ ——○]
```

L'heure est un **stepper**, pas un sélecteur natif : aucune dépendance à vérifier,
comportement identique sur les deux plateformes, accessible. Pas de 15 minutes.
L'heure ne s'affiche que si le rappel est actif.

## L'étape dans l'onboarding

Ajoutée après le plan d'origine, qui n'en parlait pas : l'étape se place **juste
avant la validation**, entre Strava et « Ton point de départ ». Le flux passe de
six à sept étapes, ce qui touche `currentStep` (borné à 7 désormais), la carte de
reprise `getOnboardingResumeRoute`, et le compteur des six écrans existants.

```
6 / 7  Ce que GRADNT peut te dire
       Rappel de séance       [ ●——]
       Heure du rappel        − 07:00 +
       Bilan de semaine       [ ●——]
       Relance d'inactivité   [ ——○]
       [ Continuer ]
       [ Configurer plus tard ]
```

Trois raisons :

- **C'est le seul moment où une installation neuve est invitée.** La section
  Réglages ne demande la permission qu'au passage d'un interrupteur de OFF à ON, et
  les valeurs par défaut sont à ON. Sans cette étape, l'app s'ouvrait avec trois
  interrupteurs actifs, aucune permission, et aucune notification — sans rien pour
  l'expliquer.
- Le prompt système s'ouvre sur **Continuer**, jamais à l'arrivée : les
  interrupteurs sont l'explication, et un dialogue qui les recouvre avant lecture
  demande de répondre à une question qu'on n'a pas vue.
- « Configurer plus tard » avance sans rien demander, et laisse tous les défauts en
  place pour Réglages.

Les contrôles sont partagés avec Réglages (`NotificationPreferenceCard`) et la
lecture de la permission aussi (`useNotificationPermission`). Les deux écrans
demandent la permission à des moments différents, pas des choses différentes.

## Tests

**Le pur, sans téléphone** — c'est là que sont les cas qui comptent :

- une séance `completed`, `skipped` ou `moved` **ne produit pas** de rappel
- une séance passée non plus
- l'heure choisie est appliquée ; un interrupteur éteint donne un ensemble vide
- fraîcheur : données fraîches → formulation chiffrée, périmées → sans chiffres
- un palier ne se fête **qu'une fois**, même après dix réconciliations
- changer la langue change les chaînes produites

**La réconciliation, avec un faux ordonnanceur** — bonnes annulations, bons ajouts,
et **idempotence**. C'est ce test qui empêche la dérive de revenir.

**Un contrôle device** — `getNextTriggerDateAsync` sur le déclencheur hebdomadaire,
pour vérifier qu'il tombe sur le bon jour et la bonne heure. Le pur ne peut pas
l'attraper, et la doc réserve un piège : **`weekday` va de 1 à 7 avec 1 =
dimanche**, pas l'inverse.

Les 194 tests existants restent verts.

## Suites

Hors périmètre, mais mis au jour pendant l'exploration :

Le planificateur écrit ses libellés **en français dans la donnée**
(`title: 'Endurance fondamentale'`, `intensityTarget: 'Facile'`,
`structure: 'Continu, conversation confortable'`) — du texte, pas des clés de
catalogue. `PlanScreen` affiche `{workout.title}`, donc un rider anglophone voit
déjà du français dans l'app.

Les notifications contournent le problème en dérivant du `type`, mais le corriger
proprement veut dire arrêter de stocker du texte dans le plan et ne garder que des
codes — un changement de modèle de données, donc une décision à part.
