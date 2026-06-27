import Foundation

// Singapore bus-stop catalogue from LTA DataMall, used to auto-resolve your
// nearest boarding stop from your home address — so you never have to type a
// stop code. The dataset (~5000 stops) is fetched once (paginated 500 at a
// time), cached to disk, and refreshed weekly.

struct BusStop: Codable, Equatable {
    let code: String
    let roadName: String
    let description: String
    let lat: Double
    let lng: Double
}

actor BusStopCatalog {
    static let shared = BusStopCatalog()

    private var stops: [BusStop] = []
    private var loadedAt: Date?
    private static let maxAge: TimeInterval = 7 * 24 * 3600

    private static let endpoint =
        "https://datamall2.mytransport.sg/ltaodataservice/BusStops"

    /// Nearest stop to a coordinate, loading/caching the catalogue as needed.
    func nearestStop(to coord: Coordinate, accountKey: String) async -> BusStop? {
        await ensureLoaded(accountKey: accountKey)
        return Self.nearest(in: stops, to: coord)
    }

    /// Pure nearest-stop selection — separated out so it's unit-testable.
    static func nearest(in stops: [BusStop], to coord: Coordinate) -> BusStop? {
        stops.min { distanceSquared($0, coord) < distanceSquared($1, coord) }
    }

    private func ensureLoaded(accountKey: String) async {
        if !stops.isEmpty, let t = loadedAt, Date().timeIntervalSince(t) < Self.maxAge {
            return
        }
        if let cached = Self.loadCache() {
            stops = cached.stops
            loadedAt = cached.savedAt
            if Date().timeIntervalSince(cached.savedAt) < Self.maxAge { return }
        }
        if let fetched = try? await fetchAll(accountKey: accountKey), !fetched.isEmpty {
            stops = fetched
            loadedAt = Date()
            Self.saveCache(Cache(savedAt: Date(), stops: fetched))
        }
    }

    private func fetchAll(accountKey: String) async throws -> [BusStop] {
        var all: [BusStop] = []
        var skip = 0
        // ~5000 stops → ~10 pages; cap well above that as a safety net.
        while skip <= 15_000 {
            guard var comps = URLComponents(string: Self.endpoint) else { break }
            comps.queryItems = [URLQueryItem(name: "$skip", value: String(skip))]
            guard let url = comps.url else { break }

            var request = URLRequest(url: url)
            request.setValue(accountKey, forHTTPHeaderField: "AccountKey")
            request.setValue("application/json", forHTTPHeaderField: "accept")

            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                throw TransitError.http(http.statusCode, "")
            }
            let page = try JSONDecoder().decode(BusStopsResponse.self, from: data)
            let mapped = page.value.compactMap { $0.toBusStop() }
            all.append(contentsOf: mapped)
            if page.value.count < 500 { break } // last page
            skip += 500
        }
        return all
    }

    // Equirectangular approximation — plenty accurate for "which stop is closest"
    // within a city. Longitude is scaled by cos(latitude).
    private static func distanceSquared(_ s: BusStop, _ c: Coordinate) -> Double {
        let dLat = s.lat - c.latitude
        let dLng = (s.lng - c.longitude) * cos(c.latitude * .pi / 180)
        return dLat * dLat + dLng * dLng
    }

    // MARK: - Disk cache

    private struct Cache: Codable {
        let savedAt: Date
        let stops: [BusStop]
    }

    private static var cacheURL: URL? {
        FileManager.default
            .urls(for: .cachesDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("lta-bus-stops.json")
    }

    private static func loadCache() -> Cache? {
        guard let url = cacheURL, let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Cache.self, from: data)
    }

    private static func saveCache(_ cache: Cache) {
        guard let url = cacheURL, let data = try? JSONEncoder().encode(cache) else { return }
        try? data.write(to: url, options: .atomic)
    }
}

// MARK: - Decodable shapes

private struct BusStopsResponse: Decodable {
    let value: [LtaStop]
}

private struct LtaStop: Decodable {
    let busStopCode: String?
    let roadName: String?
    let description: String?
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case busStopCode = "BusStopCode"
        case roadName = "RoadName"
        case description = "Description"
        case latitude = "Latitude"
        case longitude = "Longitude"
    }

    func toBusStop() -> BusStop? {
        guard let code = busStopCode, let lat = latitude, let lng = longitude,
              lat != 0 || lng != 0 else { return nil }
        return BusStop(
            code: code,
            roadName: roadName ?? "",
            description: description ?? code,
            lat: lat,
            lng: lng
        )
    }
}
