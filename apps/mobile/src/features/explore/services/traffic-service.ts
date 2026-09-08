import { getTrafficExposure, type Route, type TrafficExposure } from '../domain'

export type RoadExposureRequest = {
  suitability: number
  wayTypeBreakdown: Route['wayTypeBreakdown']
  lowTraffic: boolean
}

export interface TrafficService {
  getRoadExposure(request: RoadExposureRequest): TrafficExposure
}

export class DeterministicRoadExposureService implements TrafficService {
  getRoadExposure(request: RoadExposureRequest) {
    return getTrafficExposure(request)
  }
}

export const deterministicRoadExposureService = new DeterministicRoadExposureService()
