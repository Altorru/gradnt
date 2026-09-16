# GRADNT mobile

Application mobile GRADNT construite avec Expo Router, React Native, TypeScript et Tamagui.

## Installation

Depuis la racine du monorepo :

```bash
pnpm install
```

Pour lancer l’expérience web avec le fallback de carte schématique :

```bash
pnpm web
```

## Configuration Explore

Copie `.env.example` vers `.env.local`, puis renseigne la clé HeiGIT :

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

La clé `EXPO_PUBLIC_HEIGIT_API_KEY` est utilisée côté client uniquement pour le prototype. Ne la commite jamais et ne l’utilise pas comme secret serveur.

Le routage réel est fourni par HeiGIT/openrouteservice sur `api.heigit.org`. Le fond cartographique utilise les styles publics OpenFreeMap, et suit l'apparence de l'app :

```text
https://tiles.openfreemap.org/styles/liberty   # clair
https://tiles.openfreemap.org/styles/dark      # sombre
```

`EXPO_PUBLIC_MAP_STYLE_URL` remplace les deux d'un coup : il sert à viser un autre hébergeur de tuiles, et un hébergeur sert une seule apparence.

Les libellés suivent la langue du système. Les tuiles portent tout le jeu de langues (`name:fr`, `name:ja`, `name:zh-Hant`…), mais le style ne lit que `name:latin` ou `name:en` — donc le style est récupéré, ses libellés réécrits, et l'objet passé à la carte. MapLibre ne permet pas de le faire autrement : l'API native n'expose rien qui atteigne une couche du fond. En cas d'échec, la carte retombe sur le style par URL avec ses libellés d'origine.

## Configuration Strava

La connexion Strava passe par une Edge Function Supabase, parce que l'échange du
code d'autorisation exige un `client_secret` qui ne peut pas vivre dans une app
mobile. Le déploiement, le domaine de redirection et le contrat de l'endpoint
sont décrits dans [`supabase/README.md`](../../supabase/README.md).

Côté mobile, deux variables dans `.env.local` :

```bash
EXPO_PUBLIC_STRAVA_CLIENT_ID=     # identifiant public de l'app Strava
EXPO_PUBLIC_STRAVA_ENDPOINT_URL=  # URL déployée de la Edge Function
```

Tant qu'elles sont absentes, l'écran d'onboarding affiche `not_configured` au
lieu d'échouer.

**N'ajoute jamais `STRAVA_CLIENT_SECRET` ici.** Il n'a rien à faire dans l'app :
son seul domicile est les secrets Supabase. Tout ce qui est préfixé
`EXPO_PUBLIC_` finit dans le bundle livré aux appareils.

Le retour d'autorisation arrive par deep link (`gradnt://strava/callback`).
`src/app/+native-intent.tsx` le réécrit vers la route `/strava-callback`, qui
termine l'échange.

Un module natif a été ajouté pour ce flux (`expo-crypto`, pour générer le
`state` CSRF). Comme tout module natif, il exige un rebuild du dev client — voir
la section suivante.

## Development build native

MapLibre React Native n’est pas disponible dans Expo Go. Après l’installation ou une modification native :

```bash
pnpm --filter @gradnt/mobile exec expo prebuild --no-install
pnpm ios
# ou
pnpm android
```

L’écran Explore utilise HeiGIT sur iOS/Android lorsque la clé est configurée. Le web conserve un aperçu SVG afin de rester compatible avec l’export statique.

## Vérifications

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm --filter @gradnt/mobile exec expo export --platform web
```
