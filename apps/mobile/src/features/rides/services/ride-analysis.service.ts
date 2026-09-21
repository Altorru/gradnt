import { z } from 'zod'

import type { Language } from '@/i18n'
import {
  canUseAiForActivity,
  type Activity,
  type AthleteProfile,
  type Goal,
  type PlannedWorkout,
  type RideAnalysis,
} from '@/lib/domain'
import { getSupabaseClient } from '@/services/supabase/client'

const aiAnalysisSchema = z.object({
  headline: z.string().min(1).max(140),
  explanation: z.string().min(1).max(1000),
  goalImpact: z.string().min(1).max(500),
  nextStep: z.string().min(1).max(300),
  caution: z.string().max(300).nullable(),
})

const storedRowSchema = z.object({
  activity_id: z.string().min(1),
  analysis: aiAnalysisSchema,
  updated_at: z.string().datetime({ offset: true }),
})

export type AiRideAnalysis = z.infer<typeof aiAnalysisSchema>

export class RideAnalysisRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly providerMessage: string | null = null,
  ) {
    super(code)
    this.name = 'RideAnalysisRequestError'
  }
}

export type RideAnalysisRequest = {
  locale: Language
  activity: Activity
  facts: RideAnalysis
  feedback: {
    perceivedEffort: number | null
    feeling: 'difficult' | 'okay' | 'good' | 'excellent' | null
    fatigue: 'low' | 'moderate' | 'high' | null
    note: string
  } | null
  profile: AthleteProfile | null
  goal: Goal | null
  matchedWorkout: PlannedWorkout | null
  upcomingWorkouts: PlannedWorkout[]
  recentRides: Activity[]
}

function clientOrThrow() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase client is unavailable')
  return client
}

/**
 * Edge Functions must receive the same current access token as the user who
 * requested the analysis. Although supabase-js normally injects it, a mobile
 * app can resume with an access token close to expiry before its refresh loop
 * has run. Resolve it here so that the coaching request is never anonymous.
 */
async function activeSession(client: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const current = await client.auth.getSession()
  let session = current.data.session

  if (current.error || !session) {
    throw new RideAnalysisRequestError('authentication_required')
  }

  const expiresSoon =
    session.expires_at !== undefined && session.expires_at * 1000 <= Date.now() + 60_000

  if (expiresSoon) {
    const refreshed = await client.auth.refreshSession()
    session = refreshed.data.session
    if (refreshed.error || !session) {
      throw new RideAnalysisRequestError('authentication_required')
    }
  }

  return session
}

function diagnosticFromPayload(payload: unknown): { code: string; providerMessage: string | null } {
  const parsed = z
    .object({
      error: z.string().min(1),
      providerStatus: z.number().int().optional(),
      providerMessage: z.string().min(1).max(500).nullable().optional(),
    })
    .safeParse(payload)
  if (!parsed.success) return { code: 'request_failed', providerMessage: null }
  return {
    code: parsed.data.providerStatus
      ? `${parsed.data.error}_${parsed.data.providerStatus}`
      : parsed.data.error,
    providerMessage: parsed.data.providerMessage ?? null,
  }
}

async function responseError(
  error: unknown,
): Promise<{ code: string; providerMessage: string | null }> {
  if (typeof error !== 'object' || error === null || !('context' in error))
    return { code: 'request_failed', providerMessage: null }
  const context = (error as { context?: unknown }).context
  if (typeof context !== 'object' || context === null || !('json' in context))
    return { code: 'request_failed', providerMessage: null }
  const json = (context as { json?: unknown }).json
  if (typeof json !== 'function') return { code: 'request_failed', providerMessage: null }
  const payload = await (json as () => Promise<unknown>)().catch(() => null)
  return diagnosticFromPayload(payload)
}

function requestBody(input: RideAnalysisRequest) {
  return {
    locale: input.locale,
    activity: {
      id: input.activity.id,
      source: input.activity.source,
      startAt: input.activity.startAt,
      sportType: input.activity.sportType,
      durationMinutes: Math.round(input.activity.durationSeconds / 60),
      distanceKm: Math.round((input.activity.distanceMeters / 1000) * 10) / 10,
      elevationMeters: Math.round(input.activity.elevationGainMeters),
      averageHeartRate: input.activity.averageHeartRate,
      averagePower: input.activity.averagePower,
      provenanceDetails: input.activity.provenanceDetails ?? null,
    },
    facts: {
      durationMinutes: input.facts.facts.durationMinutes,
      distanceKm: input.facts.facts.distanceKm,
      elevationMeters: input.facts.facts.elevationMeters,
      powerWatts: input.facts.facts.powerWatts,
      intensityFactor: input.facts.facts.intensityFactor,
      loadScore: input.facts.loadScore,
      comparedRides: input.facts.comparedRides,
      trend: input.facts.trend,
      intensity: input.facts.intensity,
    },
    feedback: input.feedback,
    context: {
      profile: input.profile
        ? {
            discipline: input.profile.primaryDiscipline,
            experience: input.profile.experienceLevel,
            weeklyVolume: input.profile.weeklyVolumeBand,
          }
        : null,
      goal: input.goal
        ? {
            type: input.goal.type,
            targetValue: input.goal.targetValue,
            targetUnit: input.goal.targetUnit,
            targetDate: input.goal.targetDate,
          }
        : null,
      plan: {
        matchedWorkout: input.matchedWorkout
          ? {
              type: input.matchedWorkout.type,
              durationMinutes: input.matchedWorkout.durationMinutes,
              status: input.matchedWorkout.status,
            }
          : null,
        upcomingWorkouts: input.upcomingWorkouts.slice(0, 3).map((workout) => ({
          type: workout.type,
          durationMinutes: workout.durationMinutes,
          date: workout.date,
        })),
      },
      recentRides: input.recentRides.slice(0, 6).map((ride) => ({
        startAt: ride.startAt,
        durationMinutes: Math.round(ride.durationSeconds / 60),
        distanceKm: Math.round((ride.distanceMeters / 1000) * 10) / 10,
        elevationMeters: Math.round(ride.elevationGainMeters),
        averagePower: ride.averagePower,
      })),
    },
  }
}

export async function loadSavedRideAnalysis(activityId: string): Promise<AiRideAnalysis | null> {
  const client = clientOrThrow()
  const { data, error } = await client
    .from('ride_ai_analyses')
    .select('activity_id, analysis, updated_at')
    .eq('activity_id', activityId)
    .maybeSingle()
  if (error) throw error
  return data === null ? null : storedRowSchema.parse(data).analysis
}

export async function generateRideAnalysis(input: RideAnalysisRequest): Promise<AiRideAnalysis> {
  if (!canUseAiForActivity(input.activity)) {
    throw new RideAnalysisRequestError('strava_ai_not_permitted')
  }
  const client = clientOrThrow()
  const session = await activeSession(client)
  const { data, error } = await client.functions.invoke('ride-analysis', {
    body: requestBody(input),
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  if (error) {
    const diagnostic = await responseError(error)
    throw new RideAnalysisRequestError(diagnostic.code, diagnostic.providerMessage)
  }
  const returnedError = diagnosticFromPayload(data)
  if (returnedError.code !== 'request_failed')
    throw new RideAnalysisRequestError(returnedError.code, returnedError.providerMessage)
  const parsed = z.object({ analysis: aiAnalysisSchema }).safeParse(data)
  if (!parsed.success) throw new Error('Invalid ride-analysis response')
  return parsed.data.analysis
}
