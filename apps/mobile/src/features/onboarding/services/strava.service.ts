import {
  defaultStravaConnection,
  type StravaConnection,
  type StravaErrorCode,
} from '../domain/strava.schema'
import { useOnboardingStore } from '../store/onboarding.store'

import type { StravaCallbackResult } from '@/services/strava/oauth/strava-callback'
import { readStravaConfig, stravaAppCallbackUri } from '@/services/strava/oauth/strava-config'
import {
  beginStravaConnect,
  completeStravaConnect,
  type StravaConnectOutcome,
} from '@/services/strava/oauth/strava-connect'
import {
  clearPendingStravaState,
  clearStravaTokens,
} from '@/services/strava/oauth/strava-token.persistence'
import { HttpStravaTokenBroker } from '@/services/strava/oauth/strava-token-broker.http'
import { deleteServerStravaConnection } from '@/services/strava/strava-connection.service'

export type StravaConnectionResult =
  | {
      ok: true
      connection: StravaConnection
    }
  | {
      ok: false
      error: StravaServiceError
    }

export type StravaServiceError = {
  code: StravaErrorCode
  /**
   * What the sentence interpolates, for the codes that carry a detail.
   *
   * A code alone would lose "which scopes were missing"; a sentence here would
   * be French in an English app. The values travel with the code and the
   * sentence is built where it is read.
   */
  params?: Record<string, string>
}

export interface StravaService {
  getConnection(): Promise<StravaConnection>
  connect(): Promise<StravaConnectionResult>
  completeConnect(callbackUrl: string): Promise<StravaConnectionResult>
  disconnect(): Promise<void>
}

const notConfiguredError: StravaServiceError = {
  code: 'not_configured',
}

const cancelledError: StravaServiceError = {
  code: 'cancelled',
}

const unknownError: StravaServiceError = {
  code: 'unknown',
}

/** No attempt was in flight — a duplicate callback delivery, not a failure. */
const ignoredError: StravaServiceError = {
  code: 'ignored',
}

/**
 * Drives the real Strava redirect flow.
 *
 * `connect` starts the flow; `completeConnect` finishes it from a callback URL.
 * They are separate because the callback reaches the app as a deep link, which
 * a backgrounded or closed app receives outside the `connect` call.
 *
 * Neither throws: every outcome is an expected part of the flow (the rider
 * cancelling included) and the caller renders the reason.
 */
export class LiveStravaService implements StravaService {
  /**
   * Reads the persisted store rather than an in-memory copy.
   *
   * The service used to hold its own field, so a connection survived on the
   * store but not through the service, and the two could disagree after a
   * restart. The store wins because it is the one that is persisted.
   */
  async getConnection() {
    return useOnboardingStore.getState().strava ?? defaultStravaConnection
  }

  async connect(): Promise<StravaConnectionResult> {
    const broker = this.createBroker()

    if (!broker) {
      return { ok: false, error: notConfiguredError }
    }

    const runtimeConfig = readStravaConfig()!

    return this.applyOutcome(
      await beginStravaConnect({
        config: runtimeConfig.auth,
        callbackUri: stravaAppCallbackUri,
        broker,
      }),
    )
  }

  async completeConnect(callbackUrl: string): Promise<StravaConnectionResult> {
    const broker = this.createBroker()

    if (!broker) {
      return { ok: false, error: notConfiguredError }
    }

    return this.applyOutcome(await completeStravaConnect(callbackUrl, broker))
  }

  /**
   * Clears every place a connection lives: the persisted store the UI reads,
   * the tokens, and any half-finished authorization.
   */
  async disconnect() {
    await deleteServerStravaConnection()
    await clearStravaTokens()
    await clearPendingStravaState()
    if (!(await useOnboardingStore.getState().setStrava(defaultStravaConnection))) {
      throw new Error('strava_disconnect_save_failed')
    }
  }

  private createBroker(): HttpStravaTokenBroker | null {
    const runtimeConfig = readStravaConfig()
    return runtimeConfig ? new HttpStravaTokenBroker(runtimeConfig.endpointUrl) : null
  }

  private applyOutcome(outcome: StravaConnectOutcome): StravaConnectionResult {
    switch (outcome.status) {
      case 'connected': {
        const connection: StravaConnection = {
          status: 'connected',
          athleteName: outcome.connection.displayName ?? null,
        }
        return { ok: true, connection }
      }

      case 'cancelled':
        return { ok: false, error: cancelledError }

      case 'ignored':
        return { ok: false, error: ignoredError }

      case 'rejected':
        return {
          ok: false,
          error:
            outcome.callback.status === 'userDenied'
              ? cancelledError
              : rejectionError(outcome.callback),
        }

      case 'error':
        return { ok: false, error: unknownError }
    }
  }
}

/** The reason a rejection was rejected, as a code and the values it names. */
function rejectionError(callback: StravaCallbackResult): StravaServiceError {
  switch (callback.status) {
    case 'invalidState':
      return { code: 'sessionExpired' }

    case 'missingCode':
      return { code: 'missingCode' }

    case 'insufficientScopes':
      return {
        code: 'insufficientScopes',
        params: { scopes: callback.missingRequiredScopes.join(', ') },
      }

    case 'oauthError':
      return { code: 'oauthError', params: { error: callback.error } }

    case 'userDenied':
    case 'success':
      return { code: 'interrupted' }
  }
}

export const stravaService: StravaService = new LiveStravaService()
