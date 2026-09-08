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
