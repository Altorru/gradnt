import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const requestSchema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
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
})

const responseSchema = z.object({
  headline: z.string().min(1).max(140),
  explanation: z.string().min(1).max(600),
  nextStep: z.string().min(1).max(300),
  caution: z.string().max(300).nullable(),
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authenticated(req: Request): Promise<boolean> {
  const authorization = req.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !key) return false
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } })
  const { data } = await client.auth.getUser()
  return data.user !== null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (!(await authenticated(req))) return json({ error: 'authentication_required' }, 401)

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid_analysis_input' }, 400)
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'ai_not_configured' }, 503)

  const language = parsed.data.locale === 'fr' ? 'French' : 'English'
  const prompt = [
    `You are the GRADNT cycling coach. Reply in ${language}.`,
    'Interpret the verified facts and the rider feelings below.',
    'Do not calculate new metrics, diagnose health, or invent missing data.',
    'Keep the tone concrete, encouraging and useful to a beginner and a trained rider.',
    'Return only JSON with headline, explanation, nextStep and caution.',
    JSON.stringify(parsed.data),
  ].join('\n')
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              headline: { type: 'STRING' },
              explanation: { type: 'STRING' },
              nextStep: { type: 'STRING' },
              caution: { type: 'STRING', nullable: true },
            },
            required: ['headline', 'explanation', 'nextStep', 'caution'],
          },
        },
      }),
    },
  )
  if (!response.ok) return json({ error: 'ai_provider_failed' }, 502)
  const provider = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = provider.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return json({ error: 'ai_empty_response' }, 502)
  let decoded: unknown
  try {
    decoded = JSON.parse(text)
  } catch {
    return json({ error: 'ai_invalid_response' }, 502)
  }
  const result = responseSchema.safeParse(decoded)
  return result.success
    ? json({ analysis: result.data })
    : json({ error: 'ai_invalid_response' }, 502)
})
