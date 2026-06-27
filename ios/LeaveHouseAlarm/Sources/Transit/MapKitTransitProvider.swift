import Foundation
import MapKit

// Apple Maps transit via MKDirections. Free, no API key, native.
//
// MKDirections.calculateETA supports `.transit` and returns the expected
// departure/arrival/travel-time for a route that meets the request's
// `arrivalDate`. Apple doesn't expose per-leg line names through ETA, so the
// option carries a single summarized transit leg — enough to drive the alarm.
// (Where Apple Maps has no transit coverage, this throws .noRoute and the app
// surfaces a note; switch to the Google provider for line-level detail.)

struct MapKitTransitProvider: TransitProvider {
    let name = "apple-maps"

    func journey(for query: JourneyQuery) async throws -> JourneyResult {
        let originCoord = try await Geocode.resolve(query.origin, coordinate: query.originCoordinate)
        let destCoord = try await Geocode.resolve(query.destination, coordinate: query.destinationCoordinate)

        let request = MKDirections.Request()
        request.source = MKMapItem(placemark: MKPlacemark(coordinate: originCoord))
        request.destination = MKMapItem(placemark: MKPlacemark(coordinate: destCoord))
        request.transportType = .transit
        request.arrivalDate = query.arriveBy

        let directions = MKDirections(request: request)
        let eta: MKDirections.ETAResponse
        do {
            eta = try await directions.calculateETA()
        } catch {
            throw TransitError.noRoute
        }

        let arrival = eta.expectedArrivalDate
        let departure = eta.expectedDepartureDate
        let duration = eta.expectedTravelTime

        let option = JourneyOption(
            departureTime: departure,
            arrivalTime: arrival,
            duration: duration,
            summary: "Transit (Apple Maps)",
            legs: [
                JourneyLeg(mode: .transit, line: "Transit", headsign: nil,
                           departureStop: nil, departureTime: departure,
                           duration: duration)
            ]
        )
        return JourneyResult(provider: name, options: [option])
    }
}
