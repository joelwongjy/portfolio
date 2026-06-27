import CoreLocation
import Foundation

// The app only talks to this protocol, so swapping transit backends (Apple
// Maps, Google, a city GTFS feed) is a one-type change.
//
// Why not Citymapper? Citymapper shut down its public/self-serve developer API
// in June 2023. MapKit and Google Routes provide the same next-departure +
// journey-duration data we need.

struct JourneyQuery {
    let origin: String
    let originCoordinate: Coordinate?
    let destination: String
    let destinationCoordinate: Coordinate?
    /// We want to arrive by this time.
    let arriveBy: Date
}

protocol TransitProvider {
    var name: String { get }
    func journey(for query: JourneyQuery) async throws -> JourneyResult
}

enum TransitError: LocalizedError {
    case geocodeFailed(String)
    case noRoute
    case http(Int, String)
    case missingKey

    var errorDescription: String? {
        switch self {
        case .geocodeFailed(let s): return "Couldn't find location: \(s)"
        case .noRoute: return "No transit route found."
        case .http(let code, let body): return "Transit API error \(code): \(body)"
        case .missingKey: return "No Google Routes API key set."
        }
    }
}

/// Shared geocoding helper: prefer a known coordinate, else geocode the string.
enum Geocode {
    static func resolve(_ text: String, coordinate: Coordinate?) async throws -> CLLocationCoordinate2D {
        if let c = coordinate {
            return CLLocationCoordinate2D(latitude: c.latitude, longitude: c.longitude)
        }
        let placemarks = try await CLGeocoder().geocodeAddressString(text)
        guard let loc = placemarks.first?.location else {
            throw TransitError.geocodeFailed(text)
        }
        return loc.coordinate
    }
}

/// Zero-config fallback so the app is usable before any setup: invents a
/// believable bus service arriving around `arriveBy`.
struct MockTransitProvider: TransitProvider {
    let name = "mock"

    func journey(for query: JourneyQuery) async throws -> JourneyResult {
        let journey: TimeInterval = 34 * 60
        let walkToStop: TimeInterval = 6 * 60
        let ride = journey - walkToStop - 4 * 60
        let headway: TimeInterval = 12 * 60

        let options: [JourneyOption] = (0..<3).map { i in
            let arrival = query.arriveBy.addingTimeInterval(-Double(i) * headway)
            let departure = arrival.addingTimeInterval(-journey)
            let busDeparture = departure.addingTimeInterval(walkToStop)
            return JourneyOption(
                departureTime: departure,
                arrivalTime: arrival,
                duration: journey,
                summary: "Bus 12 → walk",
                legs: [
                    JourneyLeg(mode: .walk, line: nil, headsign: nil,
                               departureStop: nil, departureTime: departure,
                               duration: walkToStop),
                    JourneyLeg(mode: .transit, line: "Bus 12",
                               headsign: "towards Town Centre",
                               departureStop: "Home Road",
                               departureTime: busDeparture, duration: ride),
                    JourneyLeg(mode: .walk, line: nil, headsign: nil,
                               departureStop: nil, departureTime: nil,
                               duration: 4 * 60),
                ]
            )
        }.reversed()

        return JourneyResult(provider: name, options: Array(options))
    }
}
