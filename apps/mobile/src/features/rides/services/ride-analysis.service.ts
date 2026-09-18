import { z } from 'zod'

import type { Language } from '@/i18n'
import type { RideAnalysis } from '@/lib/domain'
import { getSupabaseClient } from '@/services/supabase/client'

const aiAnalysisSchema = z.object({
  headline: z.string().min(1).max(140),
  explanation: z.string().min(1).max(600),
  nextStep: z.string().min(1).max(300),
  caution: z.string().max(300).nullable(),
})

export type AiRideAnalysis = z.infer<typeof aiAnalysisSchema>

export async function fetchAiRideAnalysis(input: {
  locale: Language
  facts: RideAnalysis
  feedback: {
    perceivedEffort: number | null
    feeling: 'difficult' | 'okay' | 'good' | 'excellent' | null
    fatigue: 'low' | 'moderate' | 'high' | null
    note: string
  } | null
}): Promise<AiRideAnalysis | null> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase client is unavailable')
  const { data, error } = await client.functions.invoke('ride-analysis', {
    body: { locale: input.locale, facts: input.facts, feedback: input.feedback },
  })
  if (error) throw error
  const parsed = z.object({ analysis: aiAnalysisSchema }).safeParse(data)
  if (!parsed.success) throw new Error('Invalid ride-analysis response')
  return parsed.data.analysis
}
