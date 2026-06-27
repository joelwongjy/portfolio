import Foundation

// Google Routes API (routes.googleapis.com computeRoutes, TRANSIT). Gives
// line-level detail (e.g. "Bus 12 towards X") that Apple's ETA API doesn't.
// Requires a Routes-API-enabled key in Prefs.googleApiKey.
//
// Note: shipping an API key in a client app is inherently exposed; restrict the
// key to the Routes API and your bundle ID in the Google Cloud console.

struct GoogleTransitProvider: TransitProvider {
    let name = "google"
    let apiKey: String

    private static let url = URL(string: "https://routes.googleapis.com/directions/v2:computeRoutes")!
    private static let fieldMask = [
        "routes.duration",
        "routes.legs.steps.travelMode",
        "routes.legs.steps.staticDuration",
        "routes.legs.steps.transitDetails",
    ].joined(separator: ",")

    func journey(for query: JourneyQuery) async throws -> JourneyResult {
        guard !apiKey.isEmpty else { throw TransitError.missingKey }

        let body: [String: Any] = [
            "origin": waypoint(query.origin, query.originCoordinate),
            "destination": waypoint(query.destination, query.destinationCoordinate),
            "travelMode": "TRANSIT",
            "arrivalTime": ISO8601DateFormatter().string(from: query.arriveBy),
            "computeAlternativeRoutes": true,
        ]

        var request = URLRequest(url: Self.url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-Goog-Api-Key")
        request.setValue(Self.fieldMask, forHTTPHeaderField: "X-Goog-FieldMask")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw TransitError.http(http.statusCode, String(text.prefix(300)))
        }

        let decoded = try JSONDecoder().decode(RoutesResponse.self, from: data)
        let arriveBy = query.arriveBy
        let options: [JourneyOption] = (decoded.routes ?? []).map { route in
            let steps = (route.legs ?? []).flatMap { $0.steps ?? [] }
            let legs = steps.map(Self.mapStep)
            let duration = parseDuration(route.duration)
            let firstTransit = legs.first { $0.mode == .transit }
            let summary = firstTransit?.line.map { "\($0) → …" } ?? "Walk + transit"
            return JourneyOption(
                departureTime: arriveBy.addingTimeInterval(-duration),
                arrivalTime: arriveBy,
                duration: duration,
                summary: summary,
                legs: legs
            )
        }.sorted { $0.departureTime < $1.departureTime }

        guard !options.isEmpty else { throw TransitError.noRoute }
        return JourneyResult(provider: name, options: options)
    }

    private func waypoint(_ address: String, _ coord: Coordinate?) -> [String: Any] {
        if let c = coord {
            return ["location": ["latLng": ["latitude": c.latitude, "longitude": c.longitude]]]
        }
        return ["address": address]
    }

    private static func mapStep(_ s: Step) -> JourneyLeg {
        let mode: TransitMode = s.travelMode == "TRANSIT" ? .transit
            : s.travelMode == "WALK" ? .walk : .other
        let td = s.transitDetails
        let line = td?.transitLine?.nameShort ?? td?.transitLine?.name
        let depTime = td?.stopDetails?.departureTime
            .flatMap { ISO8601DateFormatter().date(from: $0) }
        return JourneyLeg(
            mode: mode,
            line: line,
            headsign: td?.headsign,
            departureStop: td?.stopDetails?.departureStop?.name,
            departureTime: depTime,
            duration: parseDuration(s.staticDuration)
        )
    }
}

private func parseDuration(_ s: String?) -> TimeInterval {
    guard let s, let n = Double(s.replacingOccurrences(of: "s", with: "")) else { return 0 }
    return n
}

// MARK: - Decodable shapes (only the fields we ask for in the field mask)

private struct RoutesResponse: Decodable { let routes: [Route]? }
private struct Route: Decodable { let duration: String?; let legs: [Leg]? }
private struct Leg: Decodable { let steps: [Step]? }
private struct Step: Decodable {
    let travelMode: String?
    let staticDuration: String?
    let transitDetails: TransitDetails?
}
private struct TransitDetails: Decodable {
    let stopDetails: StopDetails?
    let transitLine: TransitLine?
    let headsign: String?
}
private struct StopDetails: Decodable {
    let departureStop: NamedStop?
    let departureTime: String?
}
private struct NamedStop: Decodable { let name: String? }
private struct TransitLine: Decodable { let name: String?; let nameShort: String? }
