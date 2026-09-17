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
    see: 'See',
    seeMore: 'See more',
    loading: 'Loading…',
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
    strava: {
      connectedAccount: 'Account connected',
      noAccount: 'No account connected',
      linkPrompt: 'Link your account to import your rides.',
      confirmDisconnect: 'Confirm disconnection',
      disconnect: 'Disconnect Strava',
      connect: 'Connect Strava',
      connectNote:
        'GRADNT reads your history to place your starting point and shape what it suggests.',
    },

    ftp: {
      deduced: '{{value}} W deduced. You still need to save it.',
      noPowerZones: 'Strava has no power zones for you.',
      unexpected: 'Unexpected answer from Strava ({{summary}}).',
      readFailed: 'Reading your zones failed.',
      invalidWatts: 'Enter a value in watts.',
      history: 'FTP history',
      noValue: 'No value recorded: your FTP goal cannot be tracked.',
      fromZones: 'deduced from your Strava zones',
      enteredByYou: 'entered by you',
      fromStrava: 'Deduced from Strava',
      entered: 'Entered',
      readingZones: 'Reading zones…',
      deduce: 'Deduce from my Strava zones',
      editing: 'Correcting a recorded value',
      cancelEditing: 'Cancel the correction',
      deleted: 'Reading deleted.',
      edited: 'Reading updated.',
      unchanged: 'That value is already recorded.',
      saved: 'FTP saved.',
    },

    privacy: {
      retained: 'What is kept',
      retainedNote:
        'Your Strava access tokens are encrypted in this device’s keychain, along with the profile and goal you entered during onboarding. GRADNT keeps nothing on its servers: the function that exchanges the authorisation code is stateless and writes no data.',
      disconnectNote:
        'Disconnecting Strava erases the tokens and the imported rides from this device. The activities themselves stay with Strava, where you keep control of them.',
    },

    importedRides: {
      one: '{{count}} ride imported',
      other: '{{count}} rides imported',
    },
  },

  insights: {
    startTitle: 'Declared starting point',
    startMessage:
      'The first plan builds on your declared volume ({{band}}) and your availability. It will sharpen after your first rides.',
    observedTitle: 'Observed trend',
    observedMessage: {
      one: '{{count}} ride observed over the period analysed.',
      other: '{{count}} rides observed over the period analysed.',
    },
  },

  languages: {
    fr: 'Français',
    en: 'English',
  },

  plan: {
    title: 'Your plan',
    description: 'The sessions that move you towards your goal, with room for real life.',
    unavailable: 'The plan is temporarily unavailable.',
    thisWeek: 'This week',
    nonePlanned: 'No session planned',
    progress: 'Plan progress',
    tracked: '{{tracked}}/{{total}} tracked',
    remaining: '{{hours}} h still planned',
    weekTracked: 'Week tracked',
    emptyTitle: 'Your plan is empty',
    emptyNote: 'Finish onboarding with at least one available day to generate your first week.',
    skip: 'Skip',
    moveOneDay: 'Move by a day',
    status: {
      planned: 'Upcoming',
      completed: 'Done',
      skipped: 'Skipped',
      moved: 'Moved',
    },
    workout: {
      notFoundTitle: 'Session not found',
      notFound: 'This session is no longer in your local plan.',
      durationAndIntensity: 'Duration and intensity',
      whyThisSession: 'Why this session?',
      markCompleted: 'Mark as done',
      skip: 'Skip this session',
    },
    completed: {
      one: '{{count}} completed',
      other: '{{count}} completed',
    },
    upcoming: '{{count}} upcoming',
  },

  progress: {
    title: 'Your progress',
    description: 'The trends worth knowing about where you stand, without the noise.',
    unavailable: 'Some progress data is temporarily unavailable.',
    mainGoal: 'Main goal',
    targetToSet: 'Target to set',
    fromYourRides: 'Taken from your rides',
    toSetAfterFirstRides: 'To set after your first rides',
    lastSevenDays: 'Last 7 days',
    recentVolume: 'Recent volume',
    regularity: 'Consistency',
    ridesUnit: 'rides',
    observedData: '{{hours}} h of observed data',
    profileData: '{{hours}} h of data based on your profile ({{band}})',
    morePreciseLater: 'It will sharpen after your first rides',
    takeaway: 'Worth noting',
    ridesThisWeek: {
      one: '{{count}} ride this week',
      other: '{{count}} rides this week',
    },
  },

  header: {
    settings: 'Open settings',
  },

  notifications: {
    section: 'NOTIFICATIONS',

    session: {
      title: 'Your session is waiting',
      endurance: 'Endurance',
      tempo: 'Tempo',
      sweetSpot: 'Sweet Spot',
      threshold: 'Threshold',
      vo2Max: 'VO₂ max',
      recovery: 'Recovery',
      duration: '{{minutes}} min',
    },

    weekly: {
      title: 'Your week',
      bodyWithFigures: '{{rides}} rides · {{hours}} h · {{distance}} km',
      bodyWithoutFigures: 'Your week is ready. Open GRADNT to see it.',
    },

    inactivity: {
      title: 'Back on the bike?',
      body: 'Your last ride was a few days ago.',
    },

    milestone: {
      title: 'Goal advanced',
      body: 'You passed {{threshold}}% of your goal.',
    },

    settings: {
      sessionReminder: 'Session reminder',
      reminderHour: 'Reminder time',
      earlier: '15 minutes earlier',
      later: '15 minutes later',
      weeklySummary: 'Weekly summary',
      inactivityNudge: 'Inactivity nudge',
      permissionDenied: 'Notifications are turned off in your system settings.',
      openSystemSettings: 'Open settings',
      channelSessions: 'Session reminders',
      channelWeekly: 'Weekly summary',
      channelNudges: 'Nudges',
    },
  },

  home: {
    title: 'Your next step',
    subtitle: 'A clear view of your progress and of what comes next.',
    unavailable: 'Progress data is temporarily unavailable.',
    status: {
      startingPoint: 'STARTING POINT',
      onTrack: 'ON TRACK',
    },
    ftpSince: '{{delta}} W since the last reading',
    afterFirstRides: 'After your first rides',
    observedProgress: 'Progress observed',
    nextStep: 'Next step',
    yourState: 'Your form',
    tiles: {
      volume: '7-day volume',
      rides: '7-day rides',
      distance: '7-day distance',
    },
    intensities: 'Intensities',
    basedOnProfile: 'Based on the profile you declared',
    basedOnActivities: 'Based on observed activities',
  },

  garage: {
    description: 'Keep track of your kit and of what deserves your attention.',
    mainBike: 'Your main bike',
    noBike: 'No bike added yet',
    addBike: 'Add a bike',
    maintenance: 'Maintenance',
    maintenanceNote:
      'Link your kit to your rides and note the services that matter once the Garage is switched on.',
    why: 'Why a Garage?',
    whyNote:
      'To understand your equipment better without pulling GRADNT away from what matters: your progress.',
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
      elevationProfile: 'Elevation profile',
      elevationLegend: 'Orange = detected climb',
      exposureRationale: {
        scored:
          'Road exposure calculated from HeiGIT OSM data. The score is based on cycle suitability and the way types present.',
        partial:
          'Road exposure calculated from HeiGIT OSM data. A cautious score: the cycle suitability of these ways is only partly known.',
      },
      climbRange: 'km {{start}} to {{end}} · difficulty {{score}}/100',
      climbGradients: '{{average}}% avg · {{maximum}}% max',
    },

    /** The words for the codes the routing engine emits. */
    surfaceGroups: {
      paved: 'Asphalt / paved',
      compacted: 'Compacted',
      gravel: 'Gravel',
      trail: 'Dirt / trail',
      unknown: 'Unknown',
    },

    wayTypes: {
      unknown: 'Unknown way',
      primary: 'Main road',
      secondary: 'Secondary road',
      street: 'Street',
      path: 'Path',
      track: 'Track',
      cycleway: 'Cycleway',
      footway: 'Footway',
      steps: 'Steps',
      ferry: 'Ferry',
      construction: 'Roadworks',
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
