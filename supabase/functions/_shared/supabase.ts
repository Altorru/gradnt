import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('supabase_service_role_not_configured')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function authenticatedUser(req: Request): Promise<{ id: string } | null> {
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const client = serviceClient()
  const { data, error } = await client.auth.getUser(authorization.slice('Bearer '.length))
  return error || !data.user ? null : { id: data.user.id }
}
