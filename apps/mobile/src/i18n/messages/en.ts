import type { fr } from './fr'

/**
 * Typed against the French catalogue, so the compiler is the checklist: a key
 * added there and forgotten here does not build.
 *
 * Imported from `./fr` rather than from the i18n barrel, so the two catalogues
 * never import each other.
 */
export const en = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    retry: 'Try again',
    back: 'Go back',
    closePanel: 'Close the panel',
    openMenu: 'Open {{label}}',
    continue: 'Continue',
    sync: 'Syncing…',
  },

  tabs: {
    home: 'Home',
    plan: 'Plan',
    progress: 'Progress',
    explore: 'Explore',
    garage: 'Garage',
  },

  settings: {
    title: 'Settings',
    appearanceAndLanguage: 'APPEARANCE AND LANGUAGE',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    languageSystem: 'System',
    notSet: 'Not set',
    save: 'Save',
    profileTitle: 'Your profile',
    goalTitle: 'Your goal',
    eventPlaceholder: 'Monts d’Or sportive',
    datePlaceholder: '2027-06-13',
  },

  languages: {
    fr: 'Français',
    en: 'English',
  },

  plan: {
    completed: {
      one: '{{count}} completed',
      other: '{{count}} completed',
    },
    upcoming: '{{count}} upcoming',
  },

  progress: {
    ridesThisWeek: {
      one: '{{count}} ride this week',
      other: '{{count}} rides this week',
    },
  },

  onboarding: {
    welcome: {
      subtitle: 'Turn your rides into clear, personal progress you can actually act on.',
      benefits: {
        goal: {
          title: 'A goal you can see',
          description: 'GRADNT tracks your progress and shows you where you really stand.',
        },
        plan: {
          title: 'A plan that adapts',
          description: 'Your sessions move with your rides, your availability and your form.',
        },
        next: {
          title: 'Always the next step',
          description: 'One concrete recommendation instead of a table full of numbers.',
        },
      },
      start: 'Get started',
      resume: 'Pick up where you left off',
      footnote: 'About 3 minutes · you can change everything later',
    },

    profile: {
      title: 'Your cycling profile',
      subtitle: 'Just enough context for us to shape recommendations around how you actually ride.',
      discipline: 'Your main discipline',
      experience: 'Your experience',
      volume: 'Current weekly volume',
    },

    disciplines: {
      road: { title: 'Road', description: 'Performance, endurance and road rides.' },
      gravel: { title: 'Gravel', description: 'Road and tracks, with more freedom.' },
      mtb: { title: 'MTB', description: 'Trails, technique and climbing.' },
    },

    experiences: { beginner: 'Beginner', regular: 'Regular', advanced: 'Advanced' },

    volumes: { lt3: '< 3 h', threeToSix: '3–6 h', sixToTen: '6–10 h', gt10: '10 h+' },

    goal: {
      title: 'What are you training for?',
      subtitle: 'Pick your main goal. GRADNT will build your plan around that priority.',
      eventLabel: 'Your event',
      eventPlaceholder: 'e.g. Etape du Tour',
      fitnessNote:
        'No figure required. GRADNT will favour consistency, form and balanced progress.',
      errors: {
        eventName: 'Enter the name of your event.',
        targetValue: 'Enter a valid target.',
      },
    },

    goals: {
      ftp: {
        title: 'Raise my FTP',
        description: 'Build sustainable power and track your progress in watts.',
      },
      distance: {
        title: 'Ride further',
        description: 'Prepare for a target distance and build your endurance.',
      },
      event: {
        title: 'Prepare for an event',
        description: 'Build your progress around a sportive, a race or a long ride.',
      },
      climbing: {
        title: 'Climb better',
        description: 'Progress on climbs and accumulate more elevation.',
      },
      fitness: {
        title: 'Improve overall',
        description: 'Ride regularly and build your form with no figure to hit.',
      },
    },

    goalLabels: {
      ftp: 'FTP goal',
      distance: 'Distance goal',
      event: 'Event goal',
      climbing: 'Elevation goal',
      fitness: 'Fitness goal',
    },

    measures: {
      cumulative: {
        label: 'Cumulative',
        description: 'The total of your rides over the period analysed.',
      },
      best: {
        label: 'In one ride',
        description: 'Your best single effort, done in one go.',
      },
    },

    target: {
      ftp: { label: 'Target FTP', unit: 'W' },
      distance: { label: 'Target distance', unit: 'km' },
      climbing: { label: 'Target elevation', unit: 'm of climbing' },
    },

    availability: {
      title: 'When can you ride?',
      subtitle: 'Tell us your usual slots. We will keep room for the unexpected and for recovery.',
      available: 'Available for a session',
      rest: 'Rest day',
      errors: {
        noDay: 'Pick at least one available day.',
        noDuration: 'Pick an approximate duration.',
      },
    },

    weekdays: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },

    durations: {
      min45: '45 min',
      hour: '1 h',
      hour30: '1 h 30',
      hours2: '2 h',
      hours2plus: '2 h+',
    },

    strava: {
      title: 'Link your rides',
      subtitle:
        'With your Strava history, GRADNT can better understand your starting point and make what follows more relevant.',
      connected: 'Strava is connected',
      notConnected: 'Strava is not connected',
      noAccount: 'No account linked yet',
      badgeConnected: 'Connected',
      reassurance:
        'You stay in control. GRADNT will only use the activities it needs to personalise your experience.',
      recommendation:
        'Connecting Strava is strongly recommended: your history helps estimate your starting point and avoids a generic plan. You can still start without it and connect later.',
      errorTitle: 'Connection unavailable',
      connect: 'Connect Strava',
      connecting: 'Checking…',
      accountConnected: 'Account connected',
      defer: 'Continue without connecting',
      errors: {
        notConfigured: 'The Strava connection turns on as soon as the GRADNT account is set up.',
        cancelled: 'Connection cancelled.',
        unknown: 'The Strava connection failed. Try again in a moment.',
        ignored: 'No connection in progress.',
        readFailed: 'The Strava response could not be read.',
        interruptedTitle: 'Connection interrupted',
        backToStrava: 'Back',
        connecting: 'Connecting to Strava…',
        sessionExpired: 'The authorisation session expired. Start the connection again.',
        missingCode: 'Strava did not send an authorisation code. Start the connection again.',
        insufficientScopes: 'Not enough permissions: {{scopes}}.',
        oauthError: 'Strava refused the request ({{error}}).',
        interrupted: 'The Strava connection was interrupted.',
      },
    },

    review: {
      title: 'Your starting point',
      subtitle: 'This is the context GRADNT will use to build a coherent first block.',
      ready: 'Ready',
      profileCard: 'Cycling profile',
      profileEmpty: 'Profile not filled in.',
      practice: 'Discipline',
      experience: 'Experience',
      volume: 'Current volume',
      goalCard: 'Main goal',
      goal: 'Goal',
      goalEmpty: 'To fill in',
      availabilityCard: 'Availability',
      noDay: 'No day selected',
      stravaCard: 'Strava history',
      stravaDeferred: 'To connect later',
      stravaMissing: 'Not connected yet',
      footnote:
        'GRADNT is ready to build your starting point. No automatic analysis has been run yet.',
      start: 'Enter GRADNT',
      restart: 'Start onboarding again',
    },
  },
  explore: {
    filters: {
      distance: 'Distance',
      elevation: 'Elevation',
      distanceRange: 'Distance range in kilometres',
      elevationRange: 'Elevation range in metres',
      surface: 'Surface',
      intent: 'Intent',
      noPreference: 'No preference',
      loop: 'Loop',
      oneWay: 'One way',
      anyRoad: 'Any road',
      quieter: 'Quieter',
      quietRoads: 'Quiet roads',
      allRoads: 'All roads',
    },

    surfaces: { paved: 'Paved', mixed: 'Mixed', gravel: 'Gravel', trail: 'Trail' },
    intents: {
      endurance: 'Endurance',
      recovery: 'Recovery',
      climbing: 'Climbing',
      tempo: 'Tempo',
    },

    notConfigured:
      'Route planning is not configured: GRADNT shows nothing rather than invented routes.',
    findingPosition: 'Finding your position…',
    routesFailed: 'Could not load the routes.',
    findingRoutes: 'Finding routes…',
    noMatchTitle: 'No route matches',
    noMatchBody:
      'Nothing the engine returned fits inside your ranges. Widen the distance or the elevation to see more routes.',
    widenDistance: 'Widen the distance',

    location: {
      openSettings: 'Open settings',
      refresh: 'Update my position',
      errors: {
        unsupported: 'Location is available in the native development build.',
        disabled: 'Location is switched off on your phone.',
        denied: 'Location is refused. Allow it in settings.',
        notGranted: 'Allow location so GRADNT can suggest a start near you.',
        unavailable: 'Your position could not be obtained. Try again in a moment.',
      },
    },

    detail: {
      title: 'Route detail',
      geometry: 'Geometry and data normalised by GRADNT.',
      climbs: {
        one: '{{count}} climb',
        other: '{{count}} climbs',
      },
      exposure: '{{level}} exposure',
      detectedClimbs: 'Climbs detected',
      noClimbs: 'No climb met the GRADNT thresholds.',
      surfaces: 'Surfaces',
      wayTypes: 'Road types',
      roadEnvironment: 'Road environment',
      exposureCaveat:
        'This score describes how exposed the roads are from the data available; it is neither live traffic nor a safety score.',
      sessionFit: 'Fit with the session',
      climbRange: 'km {{start}} to {{end}} · difficulty {{score}}/100',
      climbGradients: '{{average}}% avg · {{maximum}}% max',
    },

    exposureLevels: { low: 'low', moderate: 'moderate', high: 'high' },
    strip: {
      seeDetail: 'See the route detail',
    },

    map: {
      tapRoute: 'Tap a route to see its line.',
      nativeOnly: 'The map needs the native version of the app.',
      schematic: 'Schematic web preview. The real map shows on iOS and Android.',
    },

    recommendation: {
      recommended: 'Recommended',
      quieter: 'Quieter',
      training: 'More demanding',
      alternative: 'Alternative',
    },

    fit: {
      great: 'Great fit',
      good: 'Good fit',
      adjust: 'Needs adjusting',
    },
  },
} satisfies typeof fr
