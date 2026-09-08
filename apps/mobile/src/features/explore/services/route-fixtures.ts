import { routeSchema, type Route } from '../domain'

const baseGeometry = [
  { latitude: 45.764, longitude: 4.835, elevationMeters: 171 },
  { latitude: 45.778, longitude: 4.858, elevationMeters: 190 },
  { latitude: 45.796, longitude: 4.879, elevationMeters: 224 },
  { latitude: 45.813, longitude: 4.864, elevationMeters: 252 },
  { latitude: 45.825, longitude: 4.832, elevationMeters: 214 },
  { latitude: 45.809, longitude: 4.805, elevationMeters: 198 },
  { latitude: 45.784, longitude: 4.812, elevationMeters: 184 },
  { latitude: 45.764, longitude: 4.835, elevationMeters: 171 },
]

const baseElevationProfile = [
  { distanceMeters: 0, elevationMeters: 171 },
  { distanceMeters: 4200, elevationMeters: 190 },
  { distanceMeters: 7600, elevationMeters: 224 },
  { distanceMeters: 9800, elevationMeters: 252 },
  { distanceMeters: 13400, elevationMeters: 214 },
  { distanceMeters: 17200, elevationMeters: 198 },
  { distanceMeters: 21400, elevationMeters: 184 },
  { distanceMeters: 25800, elevationMeters: 171 },
]

const sharedRouteFields = {
  geometry: baseGeometry,
  elevationProfile: baseElevationProfile,
  climbs: [
    {
      id: 'climb-demo-1',
      startDistanceMeters: 4200,
      endDistanceMeters: 9800,
      lengthMeters: 5600,
      elevationGainMeters: 62,
      averageGradientPercent: 1.1,
      maximumGradientPercent: 4.2,
      difficultyScore: 39,
    },
  ],
  surfaceBreakdown: [
    { label: 'Asphalte', percentage: 92, distanceMeters: 23736 },
    { label: 'Gravier', percentage: 8, distanceMeters: 2064 },
  ],
  wayTypeBreakdown: [
    { label: 'Route secondaire', percentage: 58, distanceMeters: 14964 },
    { label: 'Piste cyclable', percentage: 24, distanceMeters: 6192 },
    { label: 'Route principale', percentage: 18, distanceMeters: 4644 },
  ],
  suitability: 86,
  trafficExposure: {
    score: 28,
    label: 'low' as const,
    rationale: 'Fixture locale : voies secondaires et pistes cyclables majoritaires.',
  },
  liveTraffic: [],
  trainingIntentFit: 88,
  provider: { name: 'mock' as const, profile: 'local-fixture' },
}

export const demoRoutes: Route[] = [
  routeSchema.parse({
    ...sharedRouteFields,
    id: 'route-demo-recommended',
    name: 'Boucle des Monts d’Or',
    mode: 'road',
    distanceMeters: 25800,
    durationSeconds: 3600,
    elevationGainMeters: 214,
    elevationLossMeters: 214,
  }),
  routeSchema.parse({
    ...sharedRouteFields,
    id: 'route-demo-quieter',
    name: 'Boucle des quais tranquilles',
    mode: 'road',
    distanceMeters: 28600,
    durationSeconds: 4020,
    elevationGainMeters: 142,
    elevationLossMeters: 142,
    surfaceBreakdown: [
      { label: 'Asphalte', percentage: 96, distanceMeters: 27456 },
      { label: 'Gravier', percentage: 4, distanceMeters: 1144 },
    ],
    wayTypeBreakdown: [
      { label: 'Route secondaire', percentage: 44, distanceMeters: 12584 },
      { label: 'Piste cyclable', percentage: 45, distanceMeters: 12870 },
      { label: 'Route principale', percentage: 11, distanceMeters: 3146 },
    ],
    suitability: 91,
    trafficExposure: {
      score: 17,
      label: 'low' as const,
      rationale: 'Fixture locale : forte présence de voies cyclables.',
    },
    trainingIntentFit: 76,
  }),
  routeSchema.parse({
    ...sharedRouteFields,
    id: 'route-demo-training',
    name: 'Boucle vallonnée du Pilat',
    mode: 'road',
    distanceMeters: 30200,
    durationSeconds: 4680,
    elevationGainMeters: 486,
    elevationLossMeters: 486,
    surfaceBreakdown: [
      { label: 'Asphalte', percentage: 88, distanceMeters: 26576 },
      { label: 'Gravier', percentage: 12, distanceMeters: 3624 },
    ],
    wayTypeBreakdown: [
      { label: 'Route secondaire', percentage: 71, distanceMeters: 21442 },
      { label: 'Piste cyclable', percentage: 8, distanceMeters: 2416 },
      { label: 'Route principale', percentage: 21, distanceMeters: 6342 },
    ],
    suitability: 79,
    trafficExposure: {
      score: 39,
      label: 'moderate' as const,
      rationale: 'Fixture locale : davantage de voies partagées sur la variante vallonnée.',
    },
    trainingIntentFit: 94,
  }),
]
