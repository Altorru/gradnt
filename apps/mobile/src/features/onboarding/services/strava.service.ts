import { defaultStravaConnection, type StravaConnection } from '../domain/strava.schema'

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
  code: 'not_configured' | 'cancelled' | 'unknown' | 'ignored'
  message: string
}

export interface StravaService {
  getConnection(): Promise<StravaConnection>
  connect(): Promise<StravaConnectionResult>
  completeConnect(callbackUrl: string): Promise<StravaConnectionResult>
  disconnect(): Promise<void>
}

const notConfiguredError: StravaServiceError = {
  code: 'not_configured',
  message: 'La connexion Strava sera activée dès que le compte GRADNT sera configuré.',
}

const cancelledError: StravaServiceError = {
  code: 'cancelled',
  message: 'Connexion annulée.',
}

const unknownError: StravaServiceError = {
  code: 'unknown',
  message: 'La connexion à Strava a échoué. Réessaie dans un instant.',
}

/** No attempt was in flight — a duplicate callback delivery, not a failure. */
const ignoredError: StravaServiceError = {
  code: 'ignored',
  message: 'Aucune connexion en cours.',
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
  private connection: StravaConnection = defaultStravaConnection

  async getConnection() {
    return this.connection
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

  async disconnect() {
    this.connection = defaultStravaConnection
    await clearStravaTokens()
    await clearPendingStravaState()
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
        this.connection = connection
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
              : { code: 'unknown', message: describeRejection(outcome.callback) },
        }

      case 'error':
        return { ok: false, error: unknownError }
    }
  }
}

function describeRejection(callback: StravaCallbackResult): string {
  switch (callback.status) {
    case 'invalidState':
      return "La session d'autorisation a expiré. Relance la connexion."
    case 'missingCode':
      return "Strava n'a pas renvoyé de code d'autorisation. Relance la connexion."
    case 'insufficientScopes':
      return `Autorisations insuffisantes : ${callback.missingRequiredScopes.join(', ')}.`
    case 'oauthError':
      return `Strava a refusé la demande (${callback.error}).`
    case 'userDenied':
    case 'success':
      return 'La connexion à Strava a été interrompue.'
  }
}

export const stravaService: StravaService = new LiveStravaService()
