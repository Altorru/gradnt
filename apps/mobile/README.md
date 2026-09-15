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

Le routage réel est fourni par HeiGIT/openrouteservice sur `api.heigit.org`. Le fond cartographique utilise le style public OpenFreeMap par défaut :

```text
https://tiles.openfreemap.org/styles/liberty
```

Le style peut être remplacé avec `EXPO_PUBLIC_MAP_STYLE_URL`.

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

Le retour d'autorisation arrive par deep link (`mobile://strava/callback`).
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
