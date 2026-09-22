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
    saving: 'Saving…',
    reloadSaved: 'Reload saved data',
    saveFailed:
      'Saving failed. Check your connection and try again. If another device changed the data, reload this screen.',
  },

  rides: {
    add: {
      action: 'Add a ride',
      title: 'Add a ride',
      subtitle: 'Import your original FIT file or enter the numbers you have.',
      fitEntryTitle: 'Enable the AI Coach with a FIT file',
      fitEntryDescription:
        'After Strava, import an original ride to get AI analysis without using your Strava history.',
      fitTitle: 'Computer file',
      fitDescription:
        'The FIT file is read on your device. Its measurements are saved to your GRADNT account; the file itself is not uploaded.',
      chooseFit: 'Choose a FIT file',
      manualTitle: 'Manual entry',
      dateTime: 'Start · YYYY-MM-DD HH:mm',
      sport: 'Ride type',
      duration: 'Duration in minutes',
      distance: 'Distance in kilometres',
      elevation: 'Elevation gain in metres',
      save: 'Save ride',
      invalid: 'Check the date, duration, distance and elevation.',
      duplicate: 'This FIT file has already been imported into your account.',
      fitError: 'Could not read this FIT file. Check that it is a complete cycling ride.',
      sports: { road: 'Road', gravel: 'Gravel', mtb: 'MTB', indoor_cycling: 'Indoor' },
    },
    prompt: {
      title: 'Your ride is here. How did it feel?',
      answered: 'Your feelings help prepare what’s next',
      rideDate: 'Ride on {{date}}',
      basedOnFeelings: 'Guidance from your answers. Your plan stays under your control.',
    },

    recentTitle: 'After your latest rides',
    recentDescription:
      'Numbers tell part of the story. Add how you felt to prepare what comes next.',
    open: 'View my ride',
    refresh: 'Refresh rides',
    detailTitle: 'Your ride, and what’s next',
    unavailable: 'This ride could not be loaded. Check your connection and try again.',
    notFound:
      'This ride is not available in your recent history. It may have been deleted or your Strava connection removed.',
    distance: 'Distance',
    duration: 'Moving time',
    elevation: 'Elevation gain',
    minutes: 'min',
    sourceStrava: 'Ride data: Strava. Feelings: your answers in GRADNT.',
    sourceManual: 'Ride data: manual entry. These numbers were declared by you.',
    sourceFile: 'Ride data: an original FIT file you imported.',
    sourceGarmin: 'Ride data: Garmin Connect. Garmin attribution is retained.',
    nextStep: 'What should I do next?',
    adaptation: {
      title: 'A proposal for what comes next',
      move: 'After this demanding ride, move {{workout}} to {{date}}?',
      explanation:
        'GRADNT suggests this from your reported feelings. Your plan changes only when you accept.',
      accept: 'Move the session',
      saving: 'Saving…',
      saved: 'Session moved. You remain in control of the rest of the plan.',
    },
    viewPlan: 'View my plan',
    showAdvanced: 'Understand sensor data',
    hideAdvanced: 'Hide sensor data',
    sensors: 'Available measurements',
    power: 'Average power: {{value}} W',
    heartRate: 'Average heart rate: {{value}} bpm',
    missingSensors:
      'A dash means the measurement is missing. Without the necessary data, GRADNT does not estimate your FTP or normalized power.',
    analysis: {
      title: 'What this ride tells you',
      subtitle: 'A clear reading of the numbers, with your feelings when you share them.',
      deterministicEngine: 'GRADNT reading · verified facts and deterministic rules',
      source: 'Source: {{value}}',
      sources: {
        strava: 'Strava',
        manual: 'manual entry',
        file: 'original FIT file',
        garmin: 'Garmin Connect',
      },
      confidencePower: 'High confidence · power-based analysis',
      confidenceDuration: 'Standard confidence · duration-based analysis',
      intensity: 'Intensity',
      load: 'Ride load',
      compared: 'Compared with recent rides',
      firstRide: 'First reference ride',
      trendAbove: 'More demanding than your recent rides',
      trendNear: 'Close to your recent average',
      trendBelow: 'Easier than your recent rides',
      nextAction: 'Next step',
      nextRecover: 'Prioritise recovery before another hard session.',
      nextEndurance: 'Choose an easy endurance ride next if your energy allows it.',
      nextProgress: 'Your sensations and intensity support continuing the plan.',
      intensityLabels: {
        recovery: 'Recovery',
        endurance: 'Endurance',
        tempo: 'Tempo',
        threshold: 'Threshold',
        high: 'High intensity',
      },
      minutes: '{{value}} min',
      distance: '{{value}} km',
      elevation: '{{value}} m D+',
      power: '{{value}} W',
      factor: 'IF {{value}}',
      loadPoints: '{{value}} points',
      explanation:
        'The load is a consistent GRADNT indicator, not a medical measure. AI explanations will be added on top of these verified facts.',
      open: 'View analysis',
      aiTitle: 'GRADNT Coach',
      generate: 'Analyse my ride',
      viewAi: 'View AI analysis',
      understand: 'Understand this reading',
      hideMethod: 'Hide the method',
      stravaAiUnavailable:
        'The AI Coach does not use data from Strava. You can still review the verified facts and deterministic analysis of this ride here.',
      aiNeedsProvenance:
        'The AI Coach needs to verify this ride’s provenance before it can analyse it.',
      aiLoading: 'Analysis in progress…',
      aiUnavailable:
        'The analysis did not complete. Check your connection and try again: your data is safe.',
      refreshAi: 'Refresh analysis',
      goalImpact: 'Impact on your goal',
      errors: {
        authentication: 'Your GRADNT session has expired. Open Account, sign in again, then retry.',
        configuration: 'The Coach is not configured on the server yet.',
        timeout: 'The Coach took too long to respond. Try again shortly.',
        apiKey: 'The Coach API key was rejected. Gemini configuration needs attention.',
        model: 'The Coach model was not found. Check GEMINI_MODEL.',
        quota: 'The Coach quota has been reached. Try again later.',
        storage: 'The Coach responded, but its analysis could not be saved.',
        data: 'This ride’s data is not ready for analysis yet. Refresh rides and try again.',
        provenance: 'This ride’s provenance does not allow the AI Coach to run.',
        provider: 'The Coach rejected this request. Check its configuration and try again.',
        request: 'The analysis could not be requested. Check your connection and try again.',
      },
      aiNextStep: 'Coach’s next step',
    },
    comparison: {
      title: 'Planned and completed',
      matched: 'This ride matches: {{workout}}.',
      planned: 'Planned {{value}} min',
      actual: 'Completed {{value}} min',
      shorter: '{{value}} min shorter than planned.',
      onTarget: 'Close to the planned duration.',
      longer: '{{value}} min longer than planned.',
      control: 'GRADNT has not changed your plan. Review the session before confirming it.',
      review: 'Review this session',
      unplannedTitle: 'An extra ride',
      unplanned:
        'This ride is not matched to a planned session. It still contributes to your load and future recommendations.',
    },
    guidance: {
      recover:
        'You reported a very demanding effort or high fatigue. Allow recovery before your next intense session and reassess how you feel.',
      easy: 'Your feelings suggest staying flexible: choose an easy next ride if fatigue is still present.',
      continue:
        'Your feelings are encouraging. Check your next session and make sure your energy and availability still fit.',
      insufficient:
        'Your answers are saved. Add your perceived effort or fatigue for more specific guidance on what comes next.',
      explanation:
        'Guidance uses only the feelings you entered. It is not AI analysis or a diagnosis. Your plan has not changed.',
    },
    feedback: {
      title: 'How did you feel?',
      description: 'A few answers are enough. You can change everything later.',
      privateCloud: 'Your answers are saved in your private GRADNT account.',
      privateLocal:
        'Your answers stay on this device. Account backup requires signing in to GRADNT.',
      effort: 'Perceived effort · from 1 to 10',
      effortExplanation: 'Rate the whole ride, not just its hardest section.',
      effortOption: '{{value}} · {{label}}',
      effortBands: {
        easy: 'Very easy',
        moderate: 'Moderate',
        hard: 'Hard',
        veryHard: 'Very hard',
        maximum: 'Maximal',
      },
      feeling: 'Your overall feelings',
      feelings: { difficult: 'Difficult', okay: 'Okay', good: 'Good', excellent: 'Excellent' },
      fatigue: 'Your fatigue after the ride',
      fatigueLevels: { low: 'Low', moderate: 'Moderate', high: 'High' },
      note: 'Anything to remember? · optional',
      notePlaceholder: 'Legs, sleep, motivation, weather…',
      optional:
        'Everything is optional. Tap a selected choice to clear it. Add at least one answer to save.',
      save: 'Save and view my ride',
      later: 'Later',
      add: 'Add how I felt',
      edit: 'Edit how I felt',
      summaryTitle: 'How you felt',
      invitation:
        'How did you experience this ride? Your feelings complement the numbers, even without sensors.',
      savedAt: 'Answers saved · {{date}}',
      effortSummary: 'Perceived effort: {{value}}/10',
      feelingSummary: 'Feelings: {{value}}',
      fatigueSummary: 'Fatigue: {{value}}',
      saveError:
        'Saving failed. Your answers remain in the form. Try again; if another device answered, reload the saved answers.',
      readError: 'Your feelings could not be loaded. Nothing has been replaced.',
      staleDraft:
        'This draft is older than the saved answers. It will not automatically replace them.',
      reload: 'Discard draft and reload saved answers',
    },
  },

  tabs: {
    home: 'Home',
    plan: 'Plan',
    progress: 'Progress',
    explore: 'Explore',
    garage: 'Garage',
  },

  account: {
    title: 'Your GRADNT account',
    description: 'Keep your profile, goal and plan in your private account.',
    open: 'Account and backup',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters to create an account.',
    signIn: 'Sign in',
    signUp: 'Create my account',
    signOut: 'Sign out on this device',
    signedIn: 'Signed in: {{email}}',
    checkEmail: 'Check your email to confirm your account, then sign in here.',
    unavailable: 'Account sign-in is not configured in this version yet.',
    failed: 'The operation failed. Check your credentials and connection, then try again.',
    googleDisabled:
      'Google is not enabled in Supabase yet. Use email or enable Google under Authentication > Providers.',
    googleSaveFailed:
      'Google sign-in succeeded, but your settings could not be saved. Retry without creating another account.',
    invalid:
      'Enter a valid email and a password. Creating an account requires at least 8 characters.',
    importTitle: 'Keep your current settings?',
    importNote:
      'This account is empty. You can copy the profile, goal and availability from this device. The Strava connection belongs to each device and must be reconnected.',
    import: 'Import my settings into this account',
    startFresh: 'Set up this account from scratch',
    continue: 'Return to my app',
    privateNote:
      'Settings and sessions are private in your account. Strava tokens remain on this device; Strava API activities are not copied into this backup.',
    premium: {
      title: 'GRADNT Premium',
      description: 'Unlock the adaptive plan, multiple goals and the AI Coach on allowed sources.',
      active: 'Premium is active on this account.',
      price: 'Google Play offer: {{value}}',
      subscribe: 'Enable Premium',
      processing: 'Opening Google Play…',
      restore: 'Restore my purchases',
      unavailable: 'Google Play purchases will be available in the next production build.',
      error: 'The subscription could not be checked. Try again later.',
    },
  },

  settings: {
    title: 'Settings',
    appearanceAndLanguage: 'APPEARANCE AND LANGUAGE',
    profileSection: 'YOUR PROFILE',
    powerSection: 'POWER',
    dataSection: 'YOUR DATA',
    profileRow: 'Cycling profile',
    goalRow: 'Goal',
    discipline: 'DISCIPLINE',
    experience: 'EXPERIENCE',
    weeklyVolume: 'WEEKLY VOLUME',
    eventLabel: 'EVENT',
    dateLabel: 'DATE',
    dateHint: 'In YYYY-MM-DD format. The app counts down from it.',
    measureLabel: 'HOW TO MEASURE IT',
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
      resync: 'Resync my rides',
      eraseNote:
        'Your imported rides will be erased from this device. Nothing is deleted at Strava.',
      connect: 'Connect Strava',
      connecting: 'Connecting…',
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
      correct: 'Correct',
      correctionHint: 'Tap a reading to correct it.',
      correctLabel: 'Correct the {{value}} watt reading',
      deleteLabel: 'Delete the {{value}} watt reading',
      deleted: 'Reading deleted.',
      edited: 'Reading updated.',
      unchanged: 'That value is already recorded.',
      saved: 'FTP saved.',
    },

    privacy: {
      retained: 'What is kept',
      retainedNote:
        'On mobile, your Strava tokens and GRADNT session are kept in this device’s keychain. Without a GRADNT account, settings and calendar stay local. With an account, your profile, goal, availability and calendar are kept in your private account. Strava API activities are not copied into this backup.',
      disconnectNote:
        'Disconnecting Strava erases the tokens and the imported rides from this device. The activities themselves stay with Strava, where you keep control of them.',
    },

    importedRides: {
      one: '{{count}} ride imported',
      other: '{{count}} rides imported',
    },
  },

  /** Why fetching rides from Strava failed, said to the rider. See `fr`. */
  strava: {
    failures: {
      disconnected: 'No Strava account is connected.',
      expired:
        'Your Strava connection has expired or its permissions are incomplete. Reconnect your account in settings.',
      rateLimited: 'Strava is temporarily limiting requests. Try again in a few minutes.',
      error: 'Your Strava rides could not be fetched.',
      withDetail: '{{sentence}} ({{detail}})',
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
    exception: {
      title: 'Unavailable this week?',
      description:
        'Tell GRADNT and it will move your next session by one day. You confirm before anything changes.',
      action: 'I cannot ride that day',
      saved: '{{count}} availability exception saved',
      show: 'Change my week',
      hide: 'Close changes',
    },
    title: 'Your plan',
    description: 'The sessions that move you towards your goal, with room for real life.',
    unavailable: 'The plan is temporarily unavailable.',
    legacyCalendarNote:
      'Your old calendar did not store its original dates. Saved statuses are preserved, but their historical dates cannot be verified. New dates will now stay fixed.',
    showHistory: 'View previous calendars',
    hideHistory: 'Hide previous calendars',
    archivedCalendar: 'Calendar started {{date}}',
    retryHistory: 'Reload previous calendars',
    settingsChanged: 'Your settings have changed',
    finished: 'Your calendar has finished',
    newPlanNote:
      'A new 4-week calendar will use your current profile, goal and availability. It will replace the upcoming sessions in the current plan. Your previous calendar and tracked sessions will remain in history.',
    prepareNewPlan: 'Renew my calendar',
    confirmNewPlan: 'Confirm the new calendar',
    reload: 'Refresh calendar',
    nextSession: 'NEXT SESSION',
    thisWeek: 'This week',
    weekOf: 'Week of {{date}}',
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
      see: 'See the session',
      markCompleted: 'Mark as done',
      skip: 'Skip this session',
    },
    completed: {
      one: '{{count}} completed',
      other: '{{count}} completed',
    },
    upcoming: '{{count}} upcoming',
  },

  /** The vocabulary of a session, keyed by `workout.type`. See `fr`. */
  workouts: {
    titles: {
      endurance: 'Base endurance',
      tempo: 'Tempo',
      sweet_spot: 'Sweet Spot',
      threshold: 'Threshold',
      vo2_max: 'VO₂ max',
      recovery: 'Active recovery',
    },

    intensity: {
      endurance: 'Easy',
      tempo: 'Moderate, steady without forcing',
      sweet_spot: '88–94 % FTP if you have one',
      threshold: 'Around threshold, 95–105 % FTP',
      vo2_max: 'Short, hard efforts',
      recovery: 'Very easy',
    },

    structure: {
      endurance: 'Continuous, conversation pace',
      tempo: '2 × 15 min, 5 min recovery',
      sweet_spot: '3 × 8 min, 5 min recovery',
      threshold: '4 × 6 min, 4 min recovery',
      vo2_max: '5 × 3 min, 3 min recovery',
      recovery: 'Continuous, easy cadence',
    },

    reasons: {
      fitness:
        'To support steady progress from the profile you gave. The day follows your recurring availability.',
      goal: 'To prioritise your {{goal}} goal without exceeding the volume you declared. The day follows your recurring availability.',
    },
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
    spanWeeks: '{{weeks}} weeks ago',
    today: 'today',
    tapAgainToClose: 'Tap again to close.',
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
      exactAlarmsNote:
        'Android can delay a reminder by up to an hour. Allow exact alarms so it lands on time.',
      exactAlarmsAction: 'Open “Alarms & reminders”',
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
    firstStep: {
      title: 'Start by importing a ride',
      description:
        'Once GRADNT knows one ride, it can place your starting point and prepare what comes next.',
      connectTitle: 'Connect Strava',
      connectDescription: 'Your rides stay private. GRADNT turns them into one clear next step.',
      syncing: 'Your rides are coming in. This page will be ready when sync finishes.',
      addRide: 'Add a ride manually',
    },
    share: {
      eyebrow: 'SHAREABLE',
      title: 'My next decision',
      body: 'I know where I stand and what I will do next with GRADNT.',
      action: 'Share my next action',
      message: 'GRADNT · my next decision: {{value}}',
    },
    week: {
      title: 'This week',
      summary: '{{completed}}/{{total}} sessions completed',
    },
    coach: {
      title: 'GRADNT Coach',
      deterministic: 'GRADNT reading based on your verified facts. This is not AI analysis.',
      start: 'Start with a ride and I can tell you what to do next.',
      recover: 'Your recent load is rising sharply. Plan an easy ride before adding intensity.',
      next_workout: 'Your next action is ready. Review the session and match it to your energy.',
      build_consistency: 'Keep a steady rhythm. Add availability or prepare your next ride.',
      openPlan: 'View next session',
    },
    yourState: 'Your current state',
    tiles: {
      volume: '7-day volume',
      rides: '7-day rides',
      distance: '7-day distance',
    },
    intensities: 'Intensities',
    intensityPoweredHours: '{{hours}} h with a power meter',
    basedOnProfile: 'Based on the profile you declared',
    basedOnActivities: 'Based on observed activities',

    goalEyebrow: 'MAIN GOAL',
    goalTypes: {
      ftp: 'FTP',
      distance: 'DISTANCE',
      event: 'EVENT',
      climbing: 'CLIMBING',
      fitness: 'FITNESS',
    },
    goalNone: 'GOAL',
    goalTarget: '→ {{value}}',
    goalToPrecise: 'Goal to set',
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
      headline: 'Ride what’s next.',
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
        description:
          'Ride regularly and build your form, with no figure to enter: GRADNT tracks your volume.',
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

    notifications: {
      title: 'What GRADNT may tell you',
      subtitle:
        'Choose what you want to hear, and when. You can change any of this again in settings.',
      later: 'Set up later',
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
      account: 'Secure my account',
      restart: 'Start onboarding again',
    },

    account: {
      title: 'Create your GRADNT space',
      subtitle:
        'Your account keeps your profile, goals, feelings and private analyses across your devices.',
      google: 'Continue with Google',
      or: 'or with your email',
      privacy: 'Your data stays private. You remain in control of your connections and analyses.',
    },
  },
  explore: {
    filters: {
      distance: 'Distance',
      elevation: 'Elevation',
      distanceRange: 'Distance range in kilometres',
      rangeBetween: '{{label}} · between {{min}} and {{max}} {{unit}}',
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

    notConfiguredTitle: 'Routes are coming next',
    notConfiguredBody:
      'For now, build your next ride in Plan. GRADNT only shows routes that the engine has actually calculated.',
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
      startTitle: 'Choose your start point',
      openSettings: 'Open settings',
      refresh: 'Update my position',
      useCurrent: 'Use my location',
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
      elevationGain: '+{{value}} m',
      intention: 'Intent: {{intent}}',
      fitNote: 'Deterministic fit from the duration, the relief and the declared intent.',
      score: 'score {{score}}/100',
      collapse: 'Collapse the detail',
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
      selectedRoute: 'Selected route',
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
