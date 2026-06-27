import EventKit
import Foundation

// Reads the user's real iOS calendars via EventKit and surfaces upcoming events
// that have a location worth routing to.

@MainActor
final class CalendarService: ObservableObject {
    private let store = EKEventStore()

    @Published var authorized = false
    @Published var lastError: String?

    /// Request calendar access. Uses the iOS 17+ full-access API when available.
    func requestAccess() async {
        do {
            let granted: Bool
            if #available(iOS 17.0, *) {
                granted = try await store.requestFullAccessToEvents()
            } else {
                granted = try await withCheckedThrowingContinuation { cont in
                    store.requestAccess(to: .event) { ok, err in
                        if let err { cont.resume(throwing: err) }
                        else { cont.resume(returning: ok) }
                    }
                }
            }
            authorized = granted
            if !granted { lastError = "Calendar access was denied." }
        } catch {
            authorized = false
            lastError = error.localizedDescription
        }
    }

    /// Upcoming located events within `days` from now, soonest first.
    func upcomingEvents(days: Int = 7) -> [CalEvent] {
        guard authorized else { return [] }
        let now = Date()
        let end = Calendar.current.date(byAdding: .day, value: days, to: now) ?? now
        let predicate = store.predicateForEvents(
            withStart: now, end: end, calendars: nil
        )

        return store.events(matching: predicate)
            .filter { !$0.isAllDay }
            .compactMap { Self.map($0) }
            .filter { $0.hasDestination && $0.start > now }
            .sorted { $0.start < $1.start }
    }

    private static func map(_ ek: EKEvent) -> CalEvent? {
        guard let start = ek.startDate else { return nil }
        let geo = ek.structuredLocation?.geoLocation
        let coordinate = geo.map {
            Coordinate(latitude: $0.coordinate.latitude,
                       longitude: $0.coordinate.longitude)
        }
        return CalEvent(
            id: ek.eventIdentifier ?? "\(ek.title ?? "")-\(start.timeIntervalSince1970)",
            title: ek.title ?? "Event",
            location: ek.location ?? "",
            start: start,
            coordinate: coordinate
        )
    }
}
