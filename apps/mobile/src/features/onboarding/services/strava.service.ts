import type { StravaConnection } from '../domain/strava.schema'

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
  code: 'not_configured' | 'cancelled' | 'unknown'
  message: string
}

export interface StravaService {
  getConnection(): Promise<StravaConnection>
  connect(): Promise<StravaConnectionResult>
  disconnect(): Promise<void>
}

const notConfiguredError: StravaServiceError = {
  code: 'not_configured',
  message: 'La connexion Strava sera activée dès que le compte GRADNT sera configuré.',
}

export class MockStravaService implements StravaService {
  private connection: StravaConnection = {
    status: 'not_connected',
    athleteName: null,
  }

  async getConnection() {
    return this.connection
  }

  async connect(): Promise<StravaConnectionResult> {
    return {
      ok: false,
      error: notConfiguredError,
    }
  }

  async disconnect() {
    this.connection = {
      status: 'not_connected',
      athleteName: null,
    }
  }
}

export const stravaService: StravaService = new MockStravaService()
