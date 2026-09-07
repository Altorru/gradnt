# GRADNT Agent Instructions

## Product

GRADNT is a mobile-first cycling intelligence and adaptive training application.

The core product question is:

> Where am I relative to my goals, and what should I do next?

Primary sport: road cycling.
Secondary disciplines: gravel and MTB.

Do not turn GRADNT into a Strava clone or activity feed.

## Product principles

Prioritize:

- progression over vanity metrics,
- actionable guidance over raw dashboards,
- beginner accessibility through progressive disclosure,
- advanced data when requested,
- user control over AI-driven changes,
- mobile ergonomics,
- strong visual identity,
- deterministic calculations before AI interpretation.

## Brand

Name: GRADNT

Tagline:

> Ride what's next.

Visual direction:

> Soft Topography

Visual identity:

- 70% low-poly topography,
- 30% clay-style objects,
- premium dark/light UI,
- restrained acid-lime accent,
- matte materials,
- strong typography,
- no generic SaaS aesthetic.

Primary colors:

- Graphite `#11130F`
- Bone `#F4F1E8`
- Acid Lime `#C8FF3D`

Semantic accents:

- Orange `#FF6846`
- Alpine Blue `#9DD7FF`

## Technology

Mobile:

- Expo
- React Native
- Expo Router
- TypeScript
- Tamagui

State:

- TanStack Query for server state
- Zustand only for lightweight local/UI state
- React Hook Form for forms
- Zod for runtime validation

Native:

- React Native Reanimated
- React Native Gesture Handler
- Gorhom Bottom Sheet
- Expo Haptics
- Expo Image

Package manager:

- pnpm

## Repository

Mobile app:

apps/mobile

Expo Router:

apps/mobile/src/app

Do not move Expo Router out of `src/app`.

## Architecture

Feature code:

src/features/<feature>

Design system:

src/design-system

Shared hooks:

src/hooks

Services and infrastructure:

src/services

Framework-independent helpers:

src/lib

Keep route files thin.

Prefer:

route
→ feature screen
→ hooks/services
→ domain/API

## Design system

Feature code must use GRADNT primitives whenever available.

Examples:

- GradntScreen
- GradntText
- GradntHeading
- GradntButton
- GradntCard
- GradntSurface
- GradntMetric
- GradntBadge
- GradntChip
- GradntProgressBar

Do not directly recreate common primitives in feature folders.

Tamagui is an implementation layer, not the public UI API.

## Tokens

Never hard-code brand colors in feature components.

Prefer semantic theme roles:

- background
- backgroundElevated
- backgroundSubtle
- textPrimary
- textSecondary
- border
- accent
- onAccent
- positive
- warning
- danger
- recovery

Use design-system spacing, radius and typography consistently.

## Accessibility

Keep advanced cycling concepts accessible to beginners.

Use progressive disclosure.

Example:

Show:

Training load
High

before exposing:

CTL
ATL
TSB
NP
IF

Do not remove advanced information. Explain it.

Important information must never rely on color alone.

## AI

AI is an intelligence layer, not merely a chatbot.

Responsibilities include:

- cyclist profile interpretation,
- ride analysis,
- goal assistance,
- training plan generation,
- adaptive plan updates,
- route intent generation,
- contextual coaching.

Separate:

1. facts,
2. deterministic insights,
3. AI interpretation.

Use structured output and Zod for state-changing AI responses.

Do not ask an LLM to calculate deterministic metrics that application code can calculate reliably.

Do not ask an LLM to invent route coordinates.

## Training

Plans are adaptive.

Users may:

- move workouts,
- skip workouts,
- add availability,
- remove availability,
- add extra rides.

Support guided and structured sessions.

Meaningful automatic changes should remain visible to the user.

## Strava

Strava is the primary activity source.

Never couple business logic directly to Strava response objects.

Normalize external data into GRADNT domain models.

## TypeScript

Keep TypeScript strict.

Avoid `any`.

Prefer `unknown` with validation/narrowing.

Use Zod schemas as a source of truth when appropriate.

## State management

TanStack Query owns server state.

Do not mirror server state into Zustand without a strong reason.

Use Zustand for temporary UI/local state only.

## Code quality

Before committing:

pnpm lint
pnpm typecheck

Do not suppress lint rules only to silence an error.

Fix the root cause unless an exception is justified and documented.

## Git

Commit format:

<gitmoji> <type>(<scope>): <description>

Use actual Unicode emoji.

Examples:

✨ feat(training): add weekly availability editor
🐛 fix(strava): refresh access token
💄 style(ui): refine metric cards
♻️ refactor(theme): centralize semantic colors
🖼️ chore(assets): add onboarding illustrations

Never use aliases such as `:sparkles:`.

## Assets

Assets live in:

apps/mobile/assets

Use descriptive kebab-case filenames.

Examples:

goal-ftp-climb-dark.webp
training-endurance-road.webp
route-low-traffic.webp
empty-no-activities.webp

Do not use:

image1.png
final-final.png
new-image.png

Visual assets must follow the Soft Topography art direction.

No text embedded inside illustrations unless explicitly required.

## Agent workflow

Before implementing a feature:

1. inspect existing abstractions,
2. define domain behavior,
3. define schemas/types,
4. implement deterministic logic,
5. implement data hooks/services,
6. compose design-system primitives,
7. add new UI primitives only if reusable,
8. run lint and typecheck.

Prefer small coherent changes over unrelated broad refactors.

## Current implementation priority

1. design system
2. brand assets
3. onboarding
4. authentication
5. Strava integration
6. cycling intelligence
7. goals
8. dashboard
9. AI analysis
10. training engine
11. adaptive planning
12. routing
13. Garmin
14. garage beta
