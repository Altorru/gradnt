import { z } from 'zod'

import { getSupabaseClient } from './client'

export type DocumentKind = 'onboarding' | 'training_plan'
export type CloudMetadata = { userId: string; revision: number }

const documentSchema = z.object({ payload: z.unknown(), revision: z.number().int().positive() })

export async function readCloudDocument(
  kind: DocumentKind,
): Promise<{ mode: 'local' } | { mode: 'cloud'; metadata: CloudMetadata; value: unknown }> {
  const client = getSupabaseClient()
  if (!client) return { mode: 'local' }
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!session) return { mode: 'local' }
  const { data, error } = await client
    .from('user_documents')
    .select('payload, revision')
    .eq('user_id', session.user.id)
    .eq('kind', kind)
    .maybeSingle()
  if (error) throw error
  const current = await client.auth.getSession()
  if (current.error) throw current.error
  if (current.data.session?.user.id !== session.user.id) throw new Error('cloud_account_changed')
  const parsed = data === null ? null : documentSchema.parse(data)
  return {
    mode: 'cloud',
    metadata: { userId: session.user.id, revision: parsed?.revision ?? 0 },
    value: parsed?.payload ?? null,
  }
}

export async function writeCloudDocument(
  kind: DocumentKind,
  payload: unknown,
  metadata: CloudMetadata,
): Promise<CloudMetadata> {
  const client = getSupabaseClient()
  if (!client) throw new Error('cloud_not_configured')
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!session || session.user.id !== metadata.userId) throw new Error('cloud_account_changed')
  const { data, error } = await client.rpc('save_user_document', {
    document_kind: kind,
    document_payload: payload,
    expected_revision: metadata.revision,
  })
  if (error) throw error
  const revision = z.number().int().positive().parse(data)
  return { userId: metadata.userId, revision }
}
