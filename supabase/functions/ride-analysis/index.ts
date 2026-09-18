import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const requestSchema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
  activity: z.object({
    id: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
    startAt: z.string().datetime(),
    sportType: z.enum(['road', 'gravel', 'mtb', 'indoor_cycling']),
    durationMinutes: z.number().nonnegative(),
    distanceKm: z.number().nonnegative(),
    elevationMeters: z.number().nonnegative(),
    averageHeartRate: z.number().nonnegative().nullable(),
    averagePower: z.number().nonnegative().nullable(),
  }),
  facts: z.object({
    durationMinutes: z.number().nonnegative(),
    distanceKm: z.number().nonnegative(),
    elevationMeters: z.number().nonnegative(),
    powerWatts: z.number().nonnegative().nullable(),
    intensityFactor: z.number().nonnegative().nullable(),
    loadScore: z.number().nonnegative(),
    comparedRides: z.number().int().nonnegative(),
    trend: z.enum(['above', 'near', 'below', 'first']),
    intensity: z.enum(['recovery', 'endurance', 'tempo', 'threshold', 'high']),
  }),
  feedback: z
    .object({
      perceivedEffort: z.number().int().min(1).max(10).nullable(),
      feeling: z.enum(['difficult', 'okay', 'good', 'excellent']).nullable(),
      fatigue: z.enum(['low', 'moderate', 'high']).nullable(),
      note: z.string().max(2000),
    })
    .nullable(),
  context: z.object({
    profile: z
      .object({
        discipline: z.enum(['road', 'gravel', 'mtb']),
        experience: z.enum(['beginner', 'regular', 'advanced']),
        weeklyVolume: z.enum(['lt3', '3to6', '6to10', 'gt10']),
      })
      .nullable(),
    goal: z
      .object({
        type: z.enum(['ftp', 'distance', 'event', 'climbing', 'fitness']),
        targetValue: z.number().positive().nullable(),
        targetUnit: z.enum(['w', 'km', 'm', 'h', 'none']),
        targetDate: z.string().datetime().nullable(),
      })
      .nullable(),
    plan: z.object({
      matchedWorkout: z
        .object({ type: z.string(), durationMinutes: z.number().positive(), status: z.string() })
        .nullable(),
      upcomingWorkouts: z
        .array(
          z.object({
            type: z.string(),
            durationMinutes: z.number().positive(),
            date: z.string().datetime(),
          }),
        )
        .max(3),
    }),
    recentRides: z
      .array(
        z.object({
          startAt: z.string().datetime(),
          durationMinutes: z.number().nonnegative(),
          distanceKm: z.number().nonnegative(),
          elevationMeters: z.number().nonnegative(),
          averagePower: z.number().nonnegative().nullable(),
        }),
      )
      .max(6),
  }),
})

const responseSchema = z.object({
  headline: z.string().min(1).max(140),
  explanation: z.string().min(1).max(1000),
  goalImpact: z.string().min(1).max(500),
  nextStep: z.string().min(1).max(300),
  // Gemini may omit a warning entirely. Its absence means “no caution”, not a
  // failed debrief, so normalise that case before persisting the response.
  caution: z.string().max(300).nullable().optional().default(null),
})

const looseResponseSchema = z
  .object({
    headline: z.string().optional(),
    explanation: z.string().optional(),
    summary: z.string().optional(),
    goalImpact: z.string().optional(),
    goal_impact: z.string().optional(),
    nextStep: z.string().optional(),
    next_step: z.string().optional(),
    recommendation: z.string().optional(),
    caution: z.string().nullable().optional(),
  })
  .passthrough()

function normaliseCoachResponse(value: unknown) {
  const loose = looseResponseSchema.safeParse(value)
  if (!loose.success) return null
  const explanation = loose.data.explanation ?? loose.data.summary
  const nextStep = loose.data.nextStep ?? loose.data.next_step ?? loose.data.recommendation
  if (!explanation || !nextStep) return null
  return responseSchema.safeParse({
    headline: loose.data.headline ?? 'Débrief de ta sortie',
    explanation,
    goalImpact:
      loose.data.goalImpact ??
      loose.data.goal_impact ??
      'Cette sortie est intégrée à la lecture de ton objectif et de ton plan.',
    nextStep,
    caution: loose.data.caution ?? null,
  })
}

function json(body: unknown, status = 200): Response {
  if (status >= 400) {
    const code =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'unknown_error'
    console.error('ride-analysis request failed', { code, status })
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authenticated(req: Request): Promise<{ id: string } | null> {
  const authorization = req.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !key) return null
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const client = createClient(url, key)
  const { data } = await client.auth.getUser(token)
  return data.user ? { id: data.user.id } : null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const user = await authenticated(req)
  if (!user) return json({ error: 'authentication_required' }, 401)

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid_analysis_input' }, 400)
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'ai_not_configured' }, 503)

  const language = parsed.data.locale === 'fr' ? 'French' : 'English'
  const prompt = [
    `You are the GRADNT cycling coach. Reply in ${language}.`,
    'Interpret the verified ride facts, rider feedback, objective, training plan and recent rides below.',
    'Use only the provided context. Do not calculate metrics, diagnose health, or invent missing data.',
    'Explain the ride relative to the rider’s goal and recent pattern. Give an actionable next step that respects the upcoming plan.',
    'Keep the tone concrete, encouraging and useful to a beginner and a trained rider.',
    'Return only JSON with headline, explanation, goalImpact, nextStep and caution.',
    JSON.stringify(parsed.data),
  ].join('\n')
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    )
  } catch {
    return json({ error: 'ai_provider_timeout' }, 504)
  }
  if (!response.ok) {
    // Keep the provider payload in server logs only: it can contain operational
    // details, while the client only needs a stable, actionable category.
    const providerBody = await response.text()
    console.error('Gemini ride analysis failed', response.status, providerBody)
    let providerPayload: unknown = null
    try {
      providerPayload = JSON.parse(providerBody)
    } catch {
      // A non-JSON upstream error still receives the stable provider category.
    }
    const providerMessage = z
      .object({ error: z.object({ message: z.string().min(1).max(500) }) })
      .safeParse(providerPayload)
    return json(
      {
        error: 'ai_provider_failed',
        providerStatus: response.status,
        providerMessage: providerMessage.success
          ? providerMessage.data.error.message
          : `Gemini HTTP ${response.status}`,
      },
      502,
    )
  }
  const provider = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>
  }
  const texts = (provider.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text?.trim())
    .filter((text): text is string => Boolean(text))

  // Gemini 2.5 can emit several parts. Reading only parts[0] mistakes a
  // thinking part for the answer; inspect the final textual parts instead.
  const result = texts
    .reverse()
    .map((text) => {
      try {
        return normaliseCoachResponse(JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')))
      } catch {
        return null
      }
    })
    .find((candidate) => candidate?.success)
  if (!result?.success) {
    const preview = JSON.stringify(texts.length ? texts : provider).slice(0, 900)
    console.error('Gemini coaching response could not be normalised', preview)
    return json(
      {
        error: texts.length ? 'ai_invalid_response' : 'ai_empty_response',
        providerMessage: preview,
      },
      502,
    )
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) return json({ error: 'storage_not_configured' }, 503)
  const database = createClient(url, serviceRoleKey)
  const { error: storageError } = await database.from('ride_ai_analyses').upsert(
    {
      user_id: user.id,
      activity_id: parsed.data.activity.id,
      locale: parsed.data.locale,
      analysis: result.data,
      context: parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,activity_id' },
  )
  if (storageError) return json({ error: 'analysis_storage_failed' }, 503)
  return json({ analysis: result.data })
})
