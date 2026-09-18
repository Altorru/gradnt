/**
 * The reference catalogue.
 *
 * French is the source of truth for the *shape* because it is the language the
 * app was written in: every key here has a sentence a person already wrote, so
 * `en` is a translation of something real rather than of a placeholder. `en` is
 * typed against this file, which makes a missing or extra key a compile error
 * instead of a French sentence surfacing in an English screen.
 *
 * Keys are nested by where they appear, not by what they are.
 */
export const fr = {
  common: {
    ok: 'OK',
    cancel: 'Annuler',
    retry: 'Réessayer',
    back: 'Revenir en arrière',
    closePanel: 'Fermer le panneau',
    openMenu: 'Ouvrir {{label}}',
    continue: 'Continuer',
    see: 'Voir',
    seeMore: 'Voir plus',
    loading: 'Chargement…',
    sync: 'Synchronisation…',
    saving: 'Enregistrement…',
    reloadSaved: 'Recharger les données sauvegardées',
    saveFailed:
      'La sauvegarde a échoué. Vérifie ta connexion puis réessaie. Si les données ont changé sur un autre appareil, recharge cet écran.',
  },

  rides: {
    prompt: {
      title: 'Et tes sensations ?',
      answered: 'Tes sensations préparent la suite',
      rideDate: 'Sortie du {{date}}',
      basedOnFeelings: 'Conseil issu de tes réponses. Ton plan reste sous ton contrôle.',
    },

    recentTitle: 'Après tes dernières sorties',
    recentDescription:
      'Tes chiffres racontent une partie de la sortie. Ajoute tes sensations pour préparer la suite.',
    open: 'Voir ma sortie',
    refresh: 'Actualiser les sorties',
    detailTitle: 'Ta sortie, et la suite',
    unavailable: 'Impossible de charger cette sortie. Vérifie ta connexion et réessaie.',
    notFound:
      'Cette sortie n’est pas disponible dans l’historique récent. Elle peut avoir été supprimée ou la connexion Strava retirée.',
    distance: 'Distance',
    duration: 'Temps en mouvement',
    elevation: 'Dénivelé',
    minutes: 'min',
    sourceStrava: 'Données de sortie : Strava. Sensations : tes réponses dans GRADNT.',
    nextStep: 'Que faire ensuite ?',
    viewPlan: 'Voir mon plan',
    showAdvanced: 'Comprendre les données des capteurs',
    hideAdvanced: 'Masquer les données des capteurs',
    sensors: 'Les mesures disponibles',
    power: 'Puissance moyenne : {{value}} W',
    heartRate: 'Fréquence cardiaque moyenne : {{value}} bpm',
    missingSensors:
      'Un tiret signifie que la mesure manque. Sans les données nécessaires, GRADNT n’estime pas ta FTP ni ta puissance normalisée.',
    analysis: {
      title: 'Ce que cette sortie t’apprend',
      subtitle:
        'Une lecture claire des chiffres, enrichie par tes sensations si tu les renseignes.',
      confidencePower: 'Analyse basée sur la puissance',
      confidenceDuration: 'Analyse basée sur la durée',
      intensity: 'Intensité',
      load: 'Charge de la sortie',
      compared: 'Comparaison avec tes sorties récentes',
      firstRide: 'Première sortie de référence',
      trendAbove: 'Plus exigeante que tes sorties récentes',
      trendNear: 'Proche de ta moyenne récente',
      trendBelow: 'Plus facile que tes sorties récentes',
      nextAction: 'Prochaine étape',
      nextRecover: 'Privilégie la récupération avant une nouvelle séance difficile.',
      nextEndurance: 'Choisis une sortie d’endurance facile si ton énergie le permet.',
      nextProgress: 'Tes sensations et ton intensité permettent de poursuivre le plan.',
      intensityLabels: {
        recovery: 'Récupération',
        endurance: 'Endurance',
        tempo: 'Tempo',
        threshold: 'Seuil',
        high: 'Intensité élevée',
      },
      minutes: '{{value}} min',
      distance: '{{value}} km',
      elevation: '{{value}} m D+',
      power: '{{value}} W',
      factor: 'IF {{value}}',
      loadPoints: '{{value}} points',
      explanation:
        'La charge est un indicateur GRADNT cohérent, pas une mesure médicale. L’explication IA viendra au-dessus de ces faits vérifiés.',
      open: 'Voir l’analyse',
      aiTitle: 'Coach GRADNT',
      generate: 'Analyser ma sortie',
      viewAi: 'Voir l’analyse IA',
      aiLoading: 'Analyse en cours…',
      aiUnavailable:
        'L’analyse n’a pas abouti. Vérifie ta connexion puis réessaie : tes données ne sont pas perdues.',
      refreshAi: 'Actualiser l’analyse',
      goalImpact: 'Impact sur ton objectif',
      errors: {
        configuration: 'Le Coach n’est pas encore configuré sur le serveur.',
        timeout: 'Le Coach a mis trop de temps à répondre. Réessaie dans un instant.',
        apiKey: 'La clé du Coach est refusée. La configuration Gemini doit être vérifiée.',
        model: 'Le modèle du Coach est introuvable. La valeur GEMINI_MODEL doit être vérifiée.',
        quota: 'Le quota du Coach est atteint. Réessaie plus tard.',
        storage: 'Le Coach a répondu, mais son analyse n’a pas pu être sauvegardée.',
        data: 'Les données de cette sortie ne sont pas encore prêtes pour l’analyse. Actualise les sorties puis réessaie.',
        provider: 'Le Coach a refusé la demande. Vérifie sa configuration puis réessaie.',
        request: 'L’analyse n’a pas pu être demandée. Vérifie ta connexion puis réessaie.',
      },
      aiNextStep: 'Prochaine étape du coach',
    },
    comparison: {
      title: 'Prévu et réalisé',
      matched: 'Cette sortie correspond à : {{workout}}.',
      planned: 'Prévu {{value}} min',
      actual: 'Réalisé {{value}} min',
      shorter: '{{value}} min de moins que prévu.',
      onTarget: 'Durée proche de ce qui était prévu.',
      longer: '{{value}} min de plus que prévu.',
      control: 'GRADNT n’a pas modifié ton plan. Vérifie la séance avant de la confirmer.',
      review: 'Vérifier cette séance',
      unplannedTitle: 'Une sortie ajoutée',
      unplanned:
        'Cette sortie ne correspond pas à une séance planifiée. Elle compte tout de même dans ta charge et les recommandations à venir.',
    },
    guidance: {
      recover:
        'Tu décris un effort très exigeant ou beaucoup de fatigue. Prévois de récupérer avant ta prochaine séance intense et réévalue tes sensations.',
      easy: 'Tes sensations invitent à rester souple : privilégie une prochaine sortie facile si la fatigue est encore présente.',
      continue:
        'Tes sensations sont encourageantes. Consulte la prochaine séance et vérifie que ton énergie et tes disponibilités sont toujours adaptées.',
      insufficient:
        'Tes réponses sont enregistrées. Ajoute ton effort perçu ou ta fatigue pour obtenir un conseil plus précis sur la suite.',
      explanation:
        'Conseil basé uniquement sur les sensations que tu as renseignées. Ce n’est pas une analyse IA ni un diagnostic. Ton plan n’a pas été modifié.',
    },
    feedback: {
      title: 'Comment t’es-tu senti ?',
      description: 'Quelques réponses suffisent. Tu peux tout modifier plus tard.',
      privateCloud: 'Tes réponses sont sauvegardées dans ton compte privé GRADNT.',
      privateLocal:
        'Tes réponses restent sur cet appareil. La sauvegarde dans un compte nécessite une connexion GRADNT.',
      effort: 'Effort perçu · de 1 à 10',
      effortExplanation:
        'Évalue la sortie dans son ensemble, pas seulement le passage le plus dur.',
      effortOption: '{{value}} · {{label}}',
      effortBands: {
        easy: 'Très facile',
        moderate: 'Modéré',
        hard: 'Soutenu',
        veryHard: 'Très difficile',
        maximum: 'Maximal',
      },
      feeling: 'Tes sensations générales',
      feelings: {
        difficult: 'Difficiles',
        okay: 'Moyennes',
        good: 'Bonnes',
        excellent: 'Excellentes',
      },
      fatigue: 'Ta fatigue après la sortie',
      fatigueLevels: { low: 'Faible', moderate: 'Modérée', high: 'Élevée' },
      note: 'Un détail à retenir ? · facultatif',
      notePlaceholder: 'Jambes, sommeil, motivation, météo…',
      optional:
        'Tout est facultatif. Touche un choix sélectionné pour l’effacer. Renseigne au moins une réponse pour sauvegarder.',
      save: 'Enregistrer et voir ma sortie',
      later: 'Plus tard',
      add: 'Ajouter mes sensations',
      edit: 'Modifier mes sensations',
      summaryTitle: 'Tes sensations',
      invitation:
        'Comment as-tu vécu cette sortie ? Tes sensations complètent les chiffres, même sans capteur.',
      savedAt: 'Réponses sauvegardées · {{date}}',
      effortSummary: 'Effort perçu : {{value}}/10',
      feelingSummary: 'Sensations : {{value}}',
      fatigueSummary: 'Fatigue : {{value}}',
      saveError:
        'La sauvegarde a échoué. Tes réponses restent dans le formulaire. Réessaie ; si un autre appareil a répondu, recharge les réponses enregistrées.',
      readError: 'Impossible de charger tes sensations. Rien n’a été remplacé.',
      staleDraft:
        'Ce brouillon est plus ancien que les réponses sauvegardées. Il ne les remplacera pas automatiquement.',
      reload: 'Abandonner le brouillon et recharger les réponses',
    },
  },

  tabs: {
    home: 'Accueil',
    plan: 'Plan',
    progress: 'Progrès',
    explore: 'Explorer',
    garage: 'Garage',
  },

  account: {
    title: 'Ton compte GRADNT',
    description: 'Conserve ton profil, ton objectif et ton plan dans ton compte privé.',
    open: 'Compte et sauvegarde',
    email: 'Email',
    password: 'Mot de passe',
    passwordHint: 'Au moins 8 caractères pour créer un compte.',
    signIn: 'Se connecter',
    signUp: 'Créer mon compte',
    signOut: 'Déconnecter cet appareil',
    signedIn: 'Connecté : {{email}}',
    checkEmail: 'Vérifie ton email pour confirmer le compte, puis connecte-toi ici.',
    unavailable: 'La connexion aux comptes n’est pas encore configurée dans cette version.',
    failed: 'L’opération a échoué. Vérifie tes identifiants et ta connexion, puis réessaie.',
    invalid:
      'Indique un email valide et un mot de passe. Pour créer un compte : au moins 8 caractères.',
    importTitle: 'Reprendre tes réglages actuels ?',
    importNote:
      'Ce compte est vide. Tu peux y copier le profil, l’objectif et les disponibilités de cet appareil. La connexion Strava reste propre à chaque appareil et doit être rétablie.',
    import: 'Importer mes réglages dans ce compte',
    startFresh: 'Configurer ce compte depuis le début',
    continue: 'Retrouver mon app',
    privateNote:
      'Les réglages et les séances sont privés dans ton compte. Les jetons Strava restent sur cet appareil ; les activités de l’API Strava ne sont pas copiées dans cette sauvegarde.',
  },

  settings: {
    title: 'Réglages',
    appearanceAndLanguage: 'APPARENCE ET LANGUE',
    /** The other three section headings, in the order the screen shows them. */
    profileSection: 'TON PROFIL',
    powerSection: 'PUISSANCE',
    dataSection: 'TES DONNÉES',
    profileRow: 'Profil cycliste',
    goalRow: 'Objectif',
    /** The editors' own field headings, terser than the onboarding labels. */
    discipline: 'DISCIPLINE',
    experience: 'EXPÉRIENCE',
    weeklyVolume: 'VOLUME HEBDOMADAIRE',
    eventLabel: 'ÉVÉNEMENT',
    dateLabel: 'DATE',
    dateHint: 'Au format AAAA-MM-JJ. L’app en tire le compte à rebours.',
    measureLabel: 'COMMENT LE MESURER',
    theme: 'Thème',
    /** `system` is a choice, so it is named like one in both catalogues. */
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    language: 'Langue',
    languageSystem: 'Système',
    /** Shown where an onboarding answer has not been given yet. */
    notSet: 'À définir',
    save: 'Enregistrer',
    profileTitle: 'Ton profil',
    goalTitle: 'Ton objectif',
    eventPlaceholder: 'Cyclosportive des Monts d’Or',
    datePlaceholder: '2027-06-13',
    strava: {
      connectedAccount: 'Compte connecté',
      noAccount: 'Aucun compte connecté',
      linkPrompt: 'Relie ton compte pour importer tes sorties.',
      confirmDisconnect: 'Confirmer la déconnexion',
      disconnect: 'Déconnecter Strava',
      resync: 'Resynchroniser mes sorties',
      eraseNote:
        'Tes sorties importées seront effacées de cet appareil. Rien n’est supprimé chez Strava.',
      connect: 'Connecter Strava',
      connecting: 'Connexion…',
      connectNote:
        'GRADNT lit ton historique pour situer ton point de départ et adapter ce qu’il te propose.',
    },

    ftp: {
      deduced: '{{value}} W déduits. Il reste à enregistrer.',
      noPowerZones: 'Strava n’a pas de zones de puissance pour toi.',
      unexpected: 'Réponse inattendue de Strava ({{summary}}).',
      readFailed: 'La lecture de tes zones a échoué.',
      invalidWatts: 'Indique une valeur en watts.',
      history: 'Historique de la FTP',
      noValue: 'Aucune valeur enregistrée : ton objectif FTP ne peut pas être suivi.',
      fromZones: 'déduite de tes zones Strava',
      enteredByYou: 'saisie par toi',
      fromStrava: 'Déduite de Strava',
      entered: 'Saisie',
      readingZones: 'Lecture des zones…',
      deduce: 'Déduire de mes zones Strava',
      editing: 'Correction d’un relevé existant',
      cancelEditing: 'Annuler la correction',
      correct: 'Corriger',
      correctionHint: 'Touche un relevé pour le corriger.',
      correctLabel: 'Corriger le relevé de {{value}} watts',
      deleteLabel: 'Supprimer le relevé de {{value}} watts',
      deleted: 'Relevé supprimé.',
      edited: 'Relevé corrigé.',
      unchanged: 'Cette valeur est déjà enregistrée.',
      saved: 'FTP enregistrée.',
    },

    privacy: {
      retained: 'Ce qui est conservé',
      retainedNote:
        'Sur mobile, tes jetons d’accès Strava et ta session GRADNT sont conservés dans le trousseau de cet appareil. Sans compte GRADNT, tes réglages et ton calendrier sont conservés localement. Si tu connectes un compte GRADNT, ton profil, ton objectif, tes disponibilités et ton calendrier sont conservés dans ce compte privé. Les activités de l’API Strava ne sont pas copiées dans cette sauvegarde.',
      disconnectNote:
        'Déconnecter Strava efface les jetons et les sorties importées de cet appareil. Les activités elles-mêmes restent chez Strava, où tu gardes la main dessus.',
    },

    importedRides: {
      one: '{{count}} sortie importée',
      other: '{{count}} sorties importées',
    },
  },

  /**
   * The two language names are not translated, and that is deliberate.
   *
   * A language is listed in its own language, so the one a rider needs is
   * readable even when the screen is in the other one — "French" is no help to
   * someone who cannot read English.
   */
  /**
   * Why fetching rides from Strava failed, said to the rider.
   *
   * Three screens show these — the two dashboards and the settings — so they
   * are named by what went wrong rather than by where they appear.
   */
  strava: {
    failures: {
      disconnected: 'Aucun compte Strava n’est relié.',
      expired:
        'Ta connexion Strava a expiré ou ses autorisations sont incomplètes. Reconnecte ton compte dans les réglages.',
      rateLimited: 'Strava limite temporairement les demandes. Réessaie dans quelques minutes.',
      error: 'Tes sorties Strava n’ont pas pu être récupérées.',
      /** Wraps the catch-all with the underlying message, for diagnosis. */
      withDetail: '{{sentence}} ({{detail}})',
    },
  },

  insights: {
    startTitle: 'Point de départ déclaré',
    startMessage:
      'Le premier plan s’appuie sur ton volume déclaré ({{band}}) et tes disponibilités. Il deviendra plus précis après tes premières sorties.',
    observedTitle: 'Tendance observée',
    observedMessage: {
      one: '{{count}} sortie observée dans la période analysée.',
      other: '{{count}} sorties observées dans la période analysée.',
    },
  },

  languages: {
    fr: 'Français',
    en: 'English',
  },

  plan: {
    title: 'Ton plan',
    description:
      'Les séances qui te rapprochent de ton objectif, avec de la marge pour la vraie vie.',
    unavailable: 'Le plan est momentanément indisponible.',
    legacyCalendarNote:
      'Ton ancien calendrier ne conservait pas ses dates d’origine. Les statuts enregistrés sont préservés, mais leurs dates historiques ne peuvent pas être certifiées. Les nouvelles dates resteront désormais fixes.',
    showHistory: 'Voir mes anciens calendriers',
    hideHistory: 'Masquer les anciens calendriers',
    archivedCalendar: 'Calendrier commencé le {{date}}',
    retryHistory: 'Recharger les anciens calendriers',
    settingsChanged: 'Tes réglages ont changé',
    finished: 'Ton calendrier est terminé',
    newPlanNote:
      'Un nouveau calendrier de 4 semaines utilisera ton profil, ton objectif et tes disponibilités actuels. Il remplacera les séances à venir du plan actuel. Ton ancien calendrier et les séances suivies resteront dans l’historique.',
    prepareNewPlan: 'Renouveler mon calendrier',
    confirmNewPlan: 'Confirmer le nouveau calendrier',
    reload: 'Actualiser le calendrier',
    thisWeek: 'Cette semaine',
    /** The later weeks, named by the day they begin. */
    weekOf: 'Semaine du {{date}}',
    nonePlanned: 'Aucune séance planifiée',
    progress: 'Avancement du plan',
    tracked: '{{tracked}}/{{total}} suivies',
    remaining: '{{hours}} h encore prévues',
    weekTracked: 'Semaine suivie',
    emptyTitle: 'Ton plan est vide',
    emptyNote:
      'Termine l’onboarding avec au moins un jour disponible pour générer ta première semaine.',
    skip: 'Sauter',
    moveOneDay: 'Décaler d’un jour',
    status: {
      planned: 'À venir',
      completed: 'Terminée',
      skipped: 'Sautée',
      moved: 'Déplacée',
    },
    workout: {
      notFoundTitle: 'Séance introuvable',
      notFound: 'Cette séance n’est plus disponible dans ton plan local.',
      durationAndIntensity: 'Durée et intensité',
      whyThisSession: 'Pourquoi cette séance ?',
      see: 'Voir la séance',
      markCompleted: 'Marquer comme terminée',
      skip: 'Sauter cette séance',
    },
    /**
     * A plural pair, not a sentence with an `s` glued on.
     *
     * `{{count}}` is interpolated by the plural lookup, so the number and the
     * word agree in whatever language is active — French counts zero as
     * singular, English does not.
     */
    completed: {
      one: '{{count}} terminée',
      other: '{{count}} terminées',
    },
    upcoming: '{{count}} à venir',
  },

  /**
   * The vocabulary of a session, keyed by `workout.type`.
   *
   * Shared rather than nested under `plan` because four places say the same
   * things about a session — the plan list, the session screen, the home card
   * and the design-system preview — and they used to say them by each storing
   * their own copy. These are the only copies.
   */
  workouts: {
    titles: {
      endurance: 'Endurance fondamentale',
      tempo: 'Tempo',
      sweet_spot: 'Sweet Spot',
      threshold: 'Seuil',
      vo2_max: 'VO₂ max',
      recovery: 'Récupération active',
    },

    intensity: {
      endurance: 'Facile',
      tempo: 'Modéré, soutenu sans forcer',
      sweet_spot: '88–94 % FTP si disponible',
      threshold: 'Autour du seuil, 95–105 % FTP',
      vo2_max: 'Efforts courts et intenses',
      recovery: 'Très facile',
    },

    structure: {
      endurance: 'Continu, conversation confortable',
      tempo: '2 × 15 min, récupération 5 min',
      sweet_spot: '3 × 8 min, récupération 5 min',
      threshold: '4 × 6 min, récupération 4 min',
      vo2_max: '5 × 3 min, récupération 3 min',
      recovery: 'Continu, cadence souple',
    },

    reasons: {
      fitness:
        'Soutenir une progression régulière à partir de ton profil déclaré. Jour choisi selon ta disponibilité récurrente.',
      goal: 'Prioriser ton objectif {{goal}} sans dépasser ton volume déclaré. Jour choisi selon ta disponibilité récurrente.',
    },
  },

  progress: {
    title: 'Ta progression',
    description: 'Les tendances utiles pour comprendre où tu en es, sans bruit inutile.',
    unavailable: 'Certaines données de progression sont momentanément indisponibles.',
    mainGoal: 'Objectif principal',
    targetToSet: 'Cible à préciser',
    fromYourRides: 'Valeur issue de tes sorties',
    toSetAfterFirstRides: 'À préciser après tes premières sorties',
    lastSevenDays: '7 derniers jours',
    spanWeeks: 'il y a {{weeks}} sem.',
    today: 'aujourd’hui',
    tapAgainToClose: 'Touche à nouveau pour fermer.',
    recentVolume: 'Volume récent',
    regularity: 'Régularité',
    ridesUnit: 'sorties',
    observedData: '{{hours}} h de données observées',
    profileData: '{{hours}} h de données basées sur ton profil ({{band}})',
    morePreciseLater: 'Elle sera plus précise après tes premières sorties',
    takeaway: 'À retenir',
    ridesThisWeek: {
      one: '{{count}} sortie cette semaine',
      other: '{{count}} sorties cette semaine',
    },
  },

  header: {
    settings: 'Ouvrir les réglages',
  },

  notifications: {
    section: 'NOTIFICATIONS',

    session: {
      title: 'Ta séance t’attend',
      endurance: 'Endurance',
      tempo: 'Tempo',
      sweetSpot: 'Sweet Spot',
      threshold: 'Seuil',
      vo2Max: 'VO₂ max',
      recovery: 'Récupération',
      duration: '{{minutes}} min',
    },

    weekly: {
      title: 'Ta semaine',
      bodyWithoutFigures: 'Ta semaine est prête. Ouvre GRADNT pour la voir.',
    },

    inactivity: {
      title: 'On reprend ?',
      body: 'Ta dernière sortie remonte à quelques jours.',
    },

    milestone: {
      title: 'Objectif avancé',
      body: 'Tu as passé les {{threshold}} % de ton objectif.',
    },

    settings: {
      sessionReminder: 'Rappel de séance',
      reminderHour: 'Heure du rappel',
      earlier: '15 minutes plus tôt',
      later: '15 minutes plus tard',
      weeklySummary: 'Bilan de semaine',
      inactivityNudge: 'Relance d’inactivité',
      permissionDenied: 'Les notifications sont coupées dans les réglages du système.',
      openSystemSettings: 'Ouvrir les réglages',
      exactAlarmsNote:
        'Android peut retarder un rappel jusqu’à une heure. Autorise les alarmes exactes pour qu’il sonne à l’heure.',
      exactAlarmsAction: 'Ouvrir « Alarmes et rappels »',
      channelSessions: 'Rappels de séance',
      channelWeekly: 'Bilan de semaine',
      channelNudges: 'Relances',
    },
  },

  home: {
    title: 'Ton prochain pas',
    subtitle: 'Une vue claire de ta progression et de ce qui vient ensuite.',
    unavailable: 'Les données de progression sont momentanément indisponibles.',
    status: {
      startingPoint: 'POINT DE DÉPART',
      onTrack: 'EN BONNE VOIE',
    },
    ftpSince: '{{delta}} W depuis le dernier relevé',
    afterFirstRides: 'Après tes premières sorties',
    observedProgress: 'Progression observée',
    nextStep: 'Prochaine étape',
    yourState: 'Ton état',
    tiles: {
      volume: 'Volume 7 j',
      rides: 'Sorties 7 j',
      distance: 'Distance 7 j',
    },
    intensities: 'Intensités',
    intensityPoweredHours: '{{hours}} h avec capteur de puissance',
    basedOnProfile: 'Basé sur ton profil déclaré',
    basedOnActivities: 'Basé sur des activités observées',

    goalEyebrow: 'OBJECTIF PRINCIPAL',
    /**
     * The short name of each goal, for the card heading.
     *
     * Not `onboarding.goalLabels`, which reads "Objectif forme": that one names
     * the goal in a list of goals, this one titles a card about it.
     */
    goalTypes: {
      ftp: 'FTP',
      distance: 'DISTANCE',
      event: 'ÉVÉNEMENT',
      climbing: 'DÉNIVELÉ',
      fitness: 'FORME',
    },
    goalNone: 'OBJECTIF',
    goalTarget: '→ {{value}}',
    goalToPrecise: 'Objectif à préciser',
  },

  garage: {
    description: 'Garde une trace de ton matériel et de ce qui mérite ton attention.',
    mainBike: 'Ton vélo principal',
    noBike: 'Aucun vélo ajouté pour le moment',
    addBike: 'Ajouter un vélo',
    maintenance: 'Maintenance',
    maintenanceNote:
      'Associe ton matériel à tes sorties et note les entretiens importants quand le Garage sera activé.',
    why: 'Pourquoi un Garage ?',
    whyNote:
      'Pour mieux comprendre ton équipement sans détourner GRADNT de l’essentiel : ta progression.',
  },

  onboarding: {
    welcome: {
      headline: 'Roule ce qui vient ensuite.',
      subtitle:
        'Transforme tes sorties vélo en une progression claire, personnelle et réellement actionnable.',
      benefits: {
        goal: {
          title: 'Un objectif clair',
          description: 'GRADNT suit ta progression et te montre où tu en es réellement.',
        },
        plan: {
          title: 'Un plan qui s’adapte',
          description: 'Tes séances évoluent avec tes sorties, ta disponibilité et ta forme.',
        },
        next: {
          title: 'Toujours la prochaine étape',
          description: 'Une recommandation concrète plutôt qu’un tableau rempli de chiffres.',
        },
      },
      start: 'Commencer',
      resume: 'Reprendre',
      footnote: 'Environ 3 minutes · tu pourras tout modifier ensuite',
    },

    profile: {
      title: 'Ton profil cycliste',
      subtitle:
        'Donne-nous juste assez de contexte pour adapter les recommandations à ta pratique.',
      discipline: 'Ta pratique principale',
      experience: 'Ton expérience',
      volume: 'Volume hebdomadaire actuel',
    },

    disciplines: {
      road: { title: 'Route', description: 'Performance, endurance et sorties sur route.' },
      gravel: { title: 'Gravel', description: 'Route et chemins, avec plus de liberté.' },
      mtb: { title: 'VTT', description: 'Sentiers, technique et dénivelé.' },
    },

    experiences: { beginner: 'Débutant', regular: 'Régulier', advanced: 'Avancé' },

    volumes: { lt3: '< 3 h', threeToSix: '3–6 h', sixToTen: '6–10 h', gt10: '10 h+' },

    goal: {
      title: 'Qu’est-ce qui te motive ?',
      subtitle:
        'Choisis ton objectif principal. GRADNT adaptera ensuite ton plan autour de cette priorité.',
      eventLabel: 'Ton événement',
      eventPlaceholder: 'Ex. Étape du Tour',
      fitnessNote:
        'Aucun chiffre obligatoire. GRADNT privilégiera la régularité, la forme et une progression équilibrée.',
      errors: {
        eventName: 'Indique le nom de ton événement.',
        targetValue: 'Indique un objectif valide.',
      },
    },

    goals: {
      ftp: {
        title: 'Améliorer ma FTP',
        description: 'Développer ta puissance durable et suivre ta progression en watts.',
      },
      distance: {
        title: 'Rouler plus loin',
        description: 'Préparer une distance cible et améliorer ton endurance.',
      },
      event: {
        title: 'Préparer un événement',
        description: 'Construire ta progression autour d’une cyclosportive, course ou sortie.',
      },
      climbing: {
        title: 'Mieux grimper',
        description: 'Progresser dans les ascensions et accumuler davantage de dénivelé.',
      },
      fitness: {
        title: 'Progresser globalement',
        description:
          'Rouler régulièrement et améliorer ta forme, sans chiffre à saisir : GRADNT suit ton volume.',
      },
    },

    goalLabels: {
      ftp: 'Objectif FTP',
      distance: 'Objectif distance',
      event: 'Objectif événement',
      climbing: 'Objectif dénivelé',
      fitness: 'Objectif forme',
    },

    measures: {
      cumulative: {
        label: 'Cumulé',
        description: 'Le total de tes sorties sur la période analysée.',
      },
      best: {
        label: 'En une sortie',
        description: 'Ta meilleure sortie, réussie d’un seul tenant.',
      },
    },

    target: {
      ftp: { label: 'FTP cible', unit: 'W' },
      distance: { label: 'Distance cible', unit: 'km' },
      climbing: { label: 'Dénivelé cible', unit: 'm D+' },
    },

    availability: {
      title: 'Quand peux-tu rouler ?',
      subtitle:
        'Indique tes créneaux habituels. On gardera de la flexibilité pour les imprévus et la récupération.',
      available: 'Disponible pour une séance',
      rest: 'Jour de repos',
      errors: {
        noDay: 'Sélectionne au moins un jour disponible.',
        noDuration: 'Choisis une durée approximative.',
      },
    },

    weekdays: {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    },

    durations: {
      min45: '45 min',
      hour: '1 h',
      hour30: '1 h 30',
      hours2: '2 h',
      hours2plus: '2 h+',
    },

    strava: {
      title: 'Relie tes sorties',
      subtitle:
        'Avec ton historique Strava, GRADNT pourra mieux comprendre ton point de départ et rendre la suite plus pertinente.',
      connected: 'Strava est connecté',
      notConnected: 'Strava n’est pas connecté',
      noAccount: 'Aucun compte lié pour le moment',
      badgeConnected: 'Connecté',
      reassurance:
        'Tu contrôles la connexion. GRADNT utilisera uniquement les activités nécessaires pour personnaliser ton expérience.',
      recommendation:
        'Connecter Strava est vivement recommandé : ton historique permet de mieux estimer ton point de départ et d’éviter un plan générique. Tu peux toutefois commencer sans connexion et la faire plus tard.',
      errorTitle: 'Connexion indisponible',
      connect: 'Connecter Strava',
      connecting: 'Vérification…',
      accountConnected: 'Compte connecté',
      defer: 'Continuer sans connecter',
      errors: {
        notConfigured: 'La connexion Strava sera activée dès que le compte GRADNT sera configuré.',
        cancelled: 'Connexion annulée.',
        unknown: 'La connexion à Strava a échoué. Réessaie dans un instant.',
        ignored: 'Aucune connexion en cours.',
        readFailed: 'La réponse de Strava n’a pas pu être lue.',
        interruptedTitle: 'Connexion interrompue',
        backToStrava: 'Retour',
        connecting: 'Connexion à Strava…',
        sessionExpired: 'La session d’autorisation a expiré. Relance la connexion.',
        missingCode: 'Strava n’a pas renvoyé de code d’autorisation. Relance la connexion.',
        insufficientScopes: 'Autorisations insuffisantes : {{scopes}}.',
        oauthError: 'Strava a refusé la demande ({{error}}).',
        interrupted: 'La connexion à Strava a été interrompue.',
      },
    },

    notifications: {
      title: 'Ce que GRADNT peut te dire',
      subtitle:
        'Choisis ce que tu veux recevoir, et quand. Tout se règle à nouveau dans les réglages, quand tu veux.',
      later: 'Configurer plus tard',
    },

    review: {
      title: 'Ton point de départ',
      subtitle:
        'Voici le contexte que GRADNT utilisera pour construire une première base cohérente.',
      ready: 'Prêt',
      profileCard: 'Profil cycliste',
      profileEmpty: 'Profil non renseigné.',
      practice: 'Pratique',
      experience: 'Expérience',
      volume: 'Volume actuel',
      goalCard: 'Objectif principal',
      goal: 'Objectif',
      goalEmpty: 'À compléter',
      availabilityCard: 'Disponibilités',
      noDay: 'Aucun jour sélectionné',
      stravaCard: 'Historique Strava',
      stravaDeferred: 'À connecter plus tard',
      stravaMissing: 'Pas encore connecté',
      footnote:
        'GRADNT est prêt à construire ton point de départ. Aucune analyse automatique n’a été lancée pour le moment.',
      start: 'Entrer dans GRADNT',
      restart: 'Recommencer l’onboarding',
    },
  },

  explore: {
    filters: {
      distance: 'Distance',
      elevation: 'Dénivelé',
      distanceRange: 'Fourchette de distance en kilomètres',
      rangeBetween: '{{label}} · entre {{min}} et {{max}} {{unit}}',
      elevationRange: 'Fourchette de dénivelé en mètres',
      surface: 'Surface',
      intent: 'Intention',
      noPreference: 'Sans préférence',
      loop: 'Boucle',
      oneWay: 'Aller simple',
      anyRoad: 'Peu importe',
      quieter: 'Plus calmes',
      quietRoads: 'Voies calmes',
      allRoads: 'Toutes voies',
    },

    surfaces: { paved: 'Asphalte', mixed: 'Mixte', gravel: 'Gravier', trail: 'Sentier' },
    intents: {
      endurance: 'Endurance',
      recovery: 'Récupération',
      climbing: 'Dénivelé',
      tempo: 'Tempo',
    },

    notConfigured:
      'Le calcul d’itinéraire n’est pas configuré : GRADNT n’affiche rien plutôt que des parcours inventés.',
    findingPosition: 'Recherche de ta position…',
    routesFailed: 'Impossible de charger les parcours.',
    findingRoutes: 'Recherche de parcours…',
    noMatchTitle: 'Aucun parcours ne correspond',
    noMatchBody:
      'Rien dans ce que le moteur a proposé ne tient dans tes fourchettes. Élargis la distance ou le dénivelé pour voir plus de parcours.',
    widenDistance: 'Élargir la distance',

    location: {
      openSettings: 'Ouvrir les réglages',
      refresh: 'Actualiser ma position',
      errors: {
        unsupported: 'La position est disponible dans la development build native.',
        disabled: 'La localisation est désactivée sur ton téléphone.',
        denied: 'La localisation est refusée. Autorise-la dans les réglages.',
        notGranted: 'Autorise la localisation pour que GRADNT propose un départ près de chez toi.',
        unavailable: 'Ta position n’a pas pu être obtenue. Réessaie dans un instant.',
      },
    },

    detail: {
      title: 'Détail du parcours',
      geometry: 'Géométrie et données normalisées par GRADNT.',
      climbs: {
        one: '{{count}} montée',
        other: '{{count}} montées',
      },
      exposure: 'Exposition {{level}}',
      detectedClimbs: 'Montées détectées',
      noClimbs: 'Aucune montée répondant aux seuils GRADNT n’a été détectée.',
      surfaces: 'Surfaces',
      wayTypes: 'Types de voies',
      roadEnvironment: 'Environnement routier',
      exposureCaveat:
        'Ce score décrit l’exposition des voies à partir des caractéristiques disponibles ; ce n’est ni du trafic live, ni un score de sécurité.',
      sessionFit: 'Compatibilité avec la séance',
      elevationProfile: 'Profil d’altitude',
      elevationLegend: 'Orange = montée détectée',
      elevationGain: '+{{value}} m D+',
      intention: 'Intention : {{intent}}',
      fitNote: 'Adéquation déterministe selon la durée, le relief et l’intention déclarée.',
      score: 'score {{score}}/100',
      collapse: 'Réduire le détail',
      exposureRationale: {
        scored:
          'Exposition routière calculée à partir des données OSM HeiGIT. Score basé sur la compatibilité cyclable et les types de voies disponibles.',
        partial:
          'Exposition routière calculée à partir des données OSM HeiGIT. Score prudent : la compatibilité cyclable des voies est partielle.',
      },
      climbRange: 'km {{start}} à {{end}} · difficulté {{score}}/100',
      climbGradients: '{{average}} % moy. · {{maximum}} % max.',
    },

    /**
     * The words for the codes the routing engine emits.
     *
     * The engine and the exposure score both work in codes — the words live
     * here, because a label in the domain is a label something will end up
     * comparing as identity.
     */
    surfaceGroups: {
      paved: 'Asphalte / revêtu',
      compacted: 'Compacté',
      gravel: 'Gravel',
      trail: 'Terre / sentier',
      unknown: 'Inconnu',
    },

    wayTypes: {
      unknown: 'Voie inconnue',
      primary: 'Route principale',
      secondary: 'Route secondaire',
      street: 'Rue',
      path: 'Chemin',
      track: 'Piste',
      cycleway: 'Piste cyclable',
      footway: 'Voie piétonne',
      steps: 'Escaliers',
      ferry: 'Ferry',
      construction: 'Travaux',
    },

    exposureLevels: { low: 'faible', moderate: 'modérée', high: 'élevée' },
    strip: {
      seeDetail: 'Voir le détail du parcours',
    },

    map: {
      selectedRoute: 'Parcours sélectionné',
      tapRoute: 'Touche un parcours pour en voir le tracé.',
      nativeOnly: 'La carte nécessite la version native de l’application.',
      schematic: 'Aperçu web schématique. La carte réelle s’affiche sur iOS et Android.',
    },

    recommendation: {
      recommended: 'Recommandée',
      quieter: 'Plus calme',
      training: 'Plus entraînante',
      alternative: 'Alternative',
    },

    fit: {
      great: 'Très adaptée',
      good: 'Adaptée',
      adjust: 'À ajuster',
    },
  },
}
