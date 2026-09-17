# Tester les nouvelles sorties Strava

## Ce que Strava envoie

Strava envoie un `POST` JSON à l’URL publique déclarée pour l’application lorsqu’une activité est créée, supprimée ou lorsque certains champs sont modifiés. L’événement contient notamment :

```json
{
  "aspect_type": "create",
  "event_time": 1549560669,
  "object_id": 1360128428,
  "object_type": "activity",
  "owner_id": 134815,
  "subscription_id": 120475,
  "updates": {}
}
```

Ce message ne contient pas toute l’activité. Le backend doit répondre `200 OK` en moins de deux secondes, enregistrer l’événement de façon idempotente, puis faire le traitement et la récupération de l’activité dans un job asynchrone. Strava peut réessayer jusqu’à trois fois si le `200` n’arrive pas à temps. Une seule souscription existe par application, et elle couvre les athlètes qui ont autorisé cette application. Voir la [documentation officielle des webhooks Strava](https://developers.strava.com/docs/webhooks/).

## Avant le premier test réel

Le callback doit être public et accessible en HTTPS. `localhost` ne peut pas recevoir l’appel de Strava ; utiliser une Edge Function Supabase déployée ou un tunnel HTTPS temporaire pendant le développement.

Le callback doit être côté serveur : le `client_secret` Strava ne doit jamais être envoyé dans l’application mobile. Il faut aussi avoir une association serveur fiable entre `owner_id` Strava et le compte GRADNT. L’application actuelle conserve encore la connexion Strava sur l’appareil ; le listener et cette association serveur sont donc des travaux à implémenter avant le test bout en bout.

## Étape 1 — tester la validation du callback

Quand Strava crée une souscription, Strava appelle d’abord l’URL en `GET` :

```sh
curl --max-time 10 -i -G "$CALLBACK_URL" \
  --data-urlencode "hub.mode=subscribe" \
  --data-urlencode "hub.verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN" \
  --data-urlencode "hub.challenge=test-challenge-123"
```

Le serveur doit répondre immédiatement avec `200`, `Content-Type: application/json` et exactement :

```json
{ "hub.challenge": "test-challenge-123" }
```

Tester aussi un mauvais `hub.verify_token` : il doit être refusé et ne doit jamais activer la souscription.

## Étape 2 — créer ou vérifier l’unique souscription

Les paramètres de création sont envoyés en formulaire. Garder le secret uniquement dans l’environnement du backend :

```sh
curl --max-time 10 -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F "client_id=$STRAVA_CLIENT_ID" \
  -F "client_secret=$STRAVA_CLIENT_SECRET" \
  -F "callback_url=$CALLBACK_URL" \
  -F "verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN"
```

La réponse doit fournir un `id`. Si une souscription existe déjà, la lire avant d’en créer une autre :

```sh
curl --max-time 10 -G https://www.strava.com/api/v3/push_subscriptions \
  --data-urlencode "client_id=$STRAVA_CLIENT_ID" \
  --data-urlencode "client_secret=$STRAVA_CLIENT_SECRET"
```

Il ne faut pas créer une souscription par cycliste : la souscription de l’application couvre tous les athlètes ayant autorisé l’application.

## Étape 3 — tester le callback sans attendre Strava

Ce test vérifie l’API de réception, l’accusé de réception rapide, la validation du schéma et l’idempotence. Il ne vérifie pas encore que Strava a livré l’événement :

```sh
curl --max-time 10 -i -X POST "$CALLBACK_URL" \
  -H 'Content-Type: application/json' \
  --data '{
    "aspect_type":"create",
    "event_time":1549560669,
    "object_id":1360128428,
    "object_type":"activity",
    "owner_id":134815,
    "subscription_id":120475,
    "updates":{}
  }'
```

Envoyer exactement le même JSON trois fois. Le système doit produire une seule demande de traitement et une seule notification potentielle. Le `POST` doit rendre `200` sans attendre une requête Strava détaillée, une analyse ou l’envoi d’une notification.

Tester également : `object_type=athlete` avec `updates.authorized=false`, `aspect_type=update`, `aspect_type=delete`, un JSON invalide et un `owner_id` inconnu. Un événement inconnu doit être journalisé puis acquitté sans créer une notification destinée à un autre compte.

## Étape 4 — tester une vraie sortie

1. Utiliser un compte Strava de test qui a autorisé GRADNT avec le scope nécessaire (`activity:read` ou `activity:read_all` selon la visibilité de la sortie).
2. Vérifier que son `owner_id` est associé au bon compte GRADNT côté serveur.
3. Enregistrer une courte sortie vélo et la sauvegarder sur Strava.
4. Vérifier dans les logs que l’événement `activity/create` arrive avec le bon `owner_id` et `object_id`.
5. Vérifier que le job récupère uniquement l’activité de l’utilisateur autorisé, puis crée une demande « ajoute tes sensations » idempotente.
6. Vérifier que la notification ouvre le formulaire de la bonne sortie.
7. Répondre au formulaire, contrôler la sauvegarde privée et l’ouverture du détail.
8. Modifier le titre de l’activité : cela doit produire un événement de mise à jour, sans redemander les sensations.
9. Rendre l’activité privée ou la supprimer : le système doit retirer ou invalider sa demande et ne plus afficher ses données selon les règles applicables.

La création d’une sortie dans Strava est donc le déclencheur réel. Le mobile ne « détecte » pas directement l’activité en arrière-plan et ne doit pas faire du polling permanent ; le backend reçoit l’événement, puis le mobile reçoit une notification seulement après traitement réussi.

## Critères de recette GRADNT

- Trois livraisons du même événement produisent une seule demande.
- Un événement du backfill historique ne produit pas de notification.
- Deux cyclistes avec des `owner_id` différents restent isolés.
- Une sortie d’un utilisateur déconnecté ne produit aucun push.
- Un événement `delete` ou une révocation ne laisse pas une demande ouvrant une sortie supprimée.
- Un callback lent ne bloque jamais Strava : l’accusé est immédiat et le job est séparé.
- Les logs contiennent des identifiants techniques et des statuts, pas les tokens, notes personnelles, coordonnées ou contenu inutile de l’activité.

La fonctionnalité n’est pas encore activée dans le dépôt. Les étapes ci-dessus sont le protocole de test à appliquer une fois le callback, l’association serveur et le job idempotent implémentés.
