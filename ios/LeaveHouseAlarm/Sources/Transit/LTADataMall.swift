import Foundation

// Singapore real-time bus arrivals via LTA DataMall.
//
// This is the Singapore answer to "how long until the next bus" — LTA's Bus
// Arrival API returns *live* estimated arrival times for each service at a bus
// stop (not just the timetable). Get a free AccountKey at
// https://datamall.lta.gov.sg and enter it in Settings.
//
// Journey routing (which bus/MRT, total duration) still comes from the
// MapKit/Google provider; LTA enriches that with the live wait for the next bus
// at your boarding stop.

struct BusArrival: Identifiable, Equatable {
    let serviceNo: String
    /// Up to three upcoming live arrival times, soonest first.
    let arrivals: [Date]
    var id: String { serviceNo }

    /// Minutes until the next bus (negative/zero means "arriving / now").
    func minutesAway(from now: Date) -> Int? {
        guard let next = arrivals.first else { return nil }
        return max(0, Int(next.timeIntervalSince(now) / 60))
    }
}

struct LTADataMall {
    let accountKey: String

    // v3 is current; the older /ltaodataservice/BusArrivalv2 path also works.
    private static let base =
        "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival"

    /// Live arrivals for every service calling at `busStopCode` (e.g. "83139").
    func nextBuses(busStopCode: String) async throws -> [BusArrival] {
        guard !accountKey.isEmpty else { throw TransitError.missingKey }
        guard var components = URLComponents(string: Self.base) else {
            throw TransitError.noRoute
        }
        components.queryItems = [URLQueryItem(name: "BusStopCode", value: busStopCode)]
        guard let url = components.url else { throw TransitError.noRoute }

        var request = URLRequest(url: url)
        request.setValue(accountKey, forHTTPHeaderField: "AccountKey")
        request.setValue("application/json", forHTTPHeaderField: "accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw TransitError.http(http.statusCode, String(text.prefix(300)))
        }

        let decoded = try JSONDecoder().decode(BusArrivalResponse.self, from: data)
        let formatter = ISO8601DateFormatter()

        return decoded.services.compactMap { svc in
            let times = [svc.nextBus, svc.nextBus2, svc.nextBus3]
                .compactMap { $0?.estimatedArrival }
                .filter { !$0.isEmpty }
                .compactMap { formatter.date(from: $0) }
                .sorted()
            guard !times.isEmpty else { return nil }
            return BusArrival(serviceNo: svc.serviceNo, arrivals: times)
        }
        .sorted { $0.serviceNo.localizedStandardCompare($1.serviceNo) == .orderedAscending }
    }
}

// MARK: - Decodable shapes

private struct BusArrivalResponse: Decodable {
    let services: [Service]
    enum CodingKeys: String, CodingKey { case services = "Services" }
}

private struct Service: Decodable {
    let serviceNo: String
    let nextBus: NextBus?
    let nextBus2: NextBus?
    let nextBus3: NextBus?
    enum CodingKeys: String, CodingKey {
        case serviceNo = "ServiceNo"
        case nextBus = "NextBus"
        case nextBus2 = "NextBus2"
        case nextBus3 = "NextBus3"
    }
}

private struct NextBus: Decodable {
    let estimatedArrival: String?
    enum CodingKeys: String, CodingKey { case estimatedArrival = "EstimatedArrival" }
}
