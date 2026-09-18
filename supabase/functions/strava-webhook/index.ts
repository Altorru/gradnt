import { serviceClient } from '../_shared/supabase.ts'
import { sendRideFeedbackPush } from '../_shared/push.ts'
import { stravaFetch, type StravaTokens } from '../_shared/strava.ts'

const corsHeaders = { 'Content-Type': 'application/json' }
type WebhookEvent = {
  object_type?: unknown
  object_id?: unknown
  aspect_type?: unknown
  owner_id?: unknown
  subscription_id?: unknown
  event_time?: unknown
  updates?: unknown
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function parseEvent(value: unknown): {
  eventKey: string
  subscriptionId: number
  objectType: 'activity' | 'athlete'
  objectId: number
  ownerId: number
  aspectType: 'create' | 'update' | 'delete'
  eventTime: Date
  payload: Record<string, unknown>
} | null {
  const event = value as WebhookEvent | null
  if (!event || typeof event !== 'object') return null
  const objectType = event.object_type
  const aspectType = event.aspect_type
  const objectId = event.object_id
  const ownerId = event.owner_id
  const subscriptionId = event.subscription_id
  const eventTime = event.event_time
  if (
    (objectType !== 'activity' && objectType !== 'athlete') ||
    (aspectType !== 'create' && aspectType !== 'update' && aspectType !== 'delete') ||
    typeof objectId !== 'number' ||
    typeof ownerId !== 'number' ||
    typeof subscriptionId !== 'number' ||
    typeof eventTime !== 'number'
  )
    return null
  const payload = (event && typeof event === 'object' ? event : {}) as Record<string, unknown>
  const eventKey = [subscriptionId, objectType, objectId, aspectType, eventTime].join(':')
  return {
    eventKey,
    subscriptionId,
    objectType,
    objectId,
    ownerId,
    aspectType,
    eventTime: new Date(eventTime * 1000),
    payload,
  }
}

async function processEvent(event: ReturnType<typeof parseEvent>): Promise<void> {
  if (!event) return
  const client = serviceClient()
  const { data: connection, error } = await client
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, expires_at, revoked_at')
    .eq('athlete_id', String(event.ownerId))
    .maybeSingle()
  if (error) throw error
  if (!connection || connection.revoked_at) {
    await client
      .from('strava_webhook_events')
      .update({ status: 'ignored', processed_at: new Date().toISOString() })
      .eq('event_key', event.eventKey)
    return
  }
  if (event.objectType === 'athlete' && event.aspectType === 'update') {
    const updates = event.payload.updates
    if (
      updates &&
      typeof updates === 'object' &&
      (updates as { authorized?: unknown }).authorized === false
    ) {
      await client
        .from('strava_connections')
        .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', connection.user_id)
    }
    await client
      .from('strava_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_key', event.eventKey)
    return
  }
  if (event.objectType !== 'activity' || event.aspectType !== 'create') {
    await client
      .from('strava_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_key', event.eventKey)
    return
  }

  let tokens: StravaTokens | undefined
  const fetched = await stravaFetch(
    `/activities/${event.objectId}`,
    connection.access_token,
    connection.refresh_token,
    connection.expires_at,
  )
  tokens = fetched.tokens
  if (tokens) {
    await client
      .from('strava_connections')
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', connection.user_id)
  }
  if (!fetched.response.ok) throw new Error(`strava_activity_${fetched.response.status}`)
  const activity = (await fetched.response.json()) as {
    sport_type?: unknown
    type?: unknown
    private?: unknown
  }
  const sport = String(activity.sport_type ?? activity.type ?? '').toLowerCase()
  const cycling = [
    'ride',
    'virtualride',
    'ebikeride',
    'velomobile',
    'gravelride',
    'mountainbikeride',
  ].includes(sport)
  if (!cycling || activity.private === true) {
    await client
      .from('strava_webhook_events')
      .update({ status: 'ignored', processed_at: new Date().toISOString() })
      .eq('event_key', event.eventKey)
    return
  }
  const { data: existingFeedback } = await client
    .from('ride_feedback')
    .select('activity_id')
    .eq('user_id', connection.user_id)
    .eq('activity_id', `strava-${event.objectId}`)
    .maybeSingle()
  if (existingFeedback) {
    await client
      .from('strava_webhook_events')
      .update({ status: 'ignored', processed_at: new Date().toISOString() })
      .eq('event_key', event.eventKey)
    return
  }
  await sendRideFeedbackPush(client, connection.user_id, String(event.objectId))
  await client
    .from('strava_webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('event_key', event.eventKey)
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const challenge = url.searchParams.get('hub.challenge')
    const token = url.searchParams.get('hub.verify_token')
    if (
      url.searchParams.get('hub.mode') !== 'subscribe' ||
      !challenge ||
      token !== Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN')
    )
      return json({ error: 'invalid_verification' }, 403)
    return json({ 'hub.challenge': challenge })
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  let parsed: ReturnType<typeof parseEvent>
  try {
    parsed = parseEvent(await req.json())
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  if (!parsed) return json({ error: 'invalid_event' }, 400)
  const expectedSubscription = Deno.env.get('STRAVA_WEBHOOK_SUBSCRIPTION_ID')
  if (expectedSubscription && expectedSubscription !== String(parsed.subscriptionId))
    return json({ error: 'unknown_subscription' }, 403)
  const client = serviceClient()
  const { error } = await client.from('strava_webhook_events').insert({
    event_key: parsed.eventKey,
    subscription_id: parsed.subscriptionId,
    object_type: parsed.objectType,
    object_id: parsed.objectId,
    owner_id: parsed.ownerId,
    aspect_type: parsed.aspectType,
    event_time: parsed.eventTime.toISOString(),
    payload: parsed.payload,
  })
  if (error && error.code !== '23505') return json({ error: 'event_persistence_failed' }, 500)
  if (!error) {
    const runtime = (
      globalThis as unknown as { EdgeRuntime?: { waitUntil: (task: Promise<unknown>) => void } }
    ).EdgeRuntime
    runtime?.waitUntil(
      processEvent(parsed).catch(async (failure) => {
        console.error('Strava webhook processing failed', failure)
        await client
          .from('strava_webhook_events')
          .update({ status: 'failed', error: String(failure).slice(0, 500) })
          .eq('event_key', parsed.eventKey)
      }),
    )
  }
  return json({ received: true })
})
