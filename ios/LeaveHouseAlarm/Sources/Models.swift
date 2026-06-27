import Foundation

// Core domain types. Mirrors the shared logic: look at the next located
// calendar event, work out the transit that gets you there, and fire two
// alarms — one to start getting ready, one to leave the house.

/// A calendar event we might need to leave the house for.
struct CalEvent: Identifiable, Equatable {
    let id: String
    let title: String
    /// Free-text address/place name, used for routing when no coordinate exists.
    let location: String
    let start: Date
    /// Optional precise coordinate from EventKit's structured location.
    let coordinate: Coordinate?

    var hasDestination: Bool { coordinate != nil || !location.isEmpty }
}

struct Coordinate: Equatable {
    let latitude: Double
    let longitude: Double
}

enum TransitMode: String {
    case walk, transit, other
}

/// One stage of a journey (a walk, a bus, a train…).
struct JourneyLeg: Equatable {
    let mode: TransitMode
    /// e.g. "Bus 12" / "Northern Line".
    let line: String?
    let headsign: String?
    let departureStop: String?
    let departureTime: Date?
    let duration: TimeInterval
}

/// A normalized, provider-agnostic way to make the journey.
struct JourneyOption: Equatable {
    /// When you must leave the origin to take this option.
    let departureTime: Date
    /// When this option gets you to the destination.
    let arrivalTime: Date
    let duration: TimeInterval
    /// Short human summary, e.g. "Bus 12 → walk".
    let summary: String
    let legs: [JourneyLeg]
}

struct JourneyResult: Equatable {
    let provider: String
    let options: [JourneyOption]
}

/// User preferences that drive the alarm maths.
struct Prefs: Codable, Equatable {
    /// Where journeys start from.
    var homeLocation: String = ""
    /// Minutes needed to get ready before leaving.
    var prepMinutes: Int = 30
    /// Safety cushion subtracted from the computed departure time.
    var leaveBufferMinutes: Int = 3
    /// Arrive this many minutes before the event starts.
    var arrivalBufferMinutes: Int = 5
    /// Which transit backend to use.
    var transitProvider: TransitProviderKind = .mapKit
    /// Optional Google Routes API key (only used when provider == .google).
    var googleApiKey: String = ""
    /// Singapore LTA DataMall AccountKey for live bus arrivals (free).
    var ltaAccountKey: String = ""
    /// Your home/boarding bus stop code, e.g. "83139" — shown on every SG bus
    /// stop sign. Enables the live "next bus" countdown.
    var homeBusStopCode: String = ""
}

enum TransitProviderKind: String, Codable, CaseIterable, Identifiable {
    case mapKit
    case google
    var id: String { rawValue }
    var label: String {
        switch self {
        case .mapKit: return "Apple Maps (no key)"
        case .google: return "Google Routes (API key)"
        }
    }
}

/// The computed plan for a single event: when to get ready, when to leave.
struct AlarmPlan: Equatable {
    let event: CalEvent
    /// The journey option we picked (latest that still arrives in time).
    let chosen: JourneyOption?
    /// Start getting ready.
    let getReadyAt: Date
    /// Leave the house now.
    let leaveHomeAt: Date
    /// Latest acceptable arrival (event start − arrival buffer).
    let arriveBy: Date
    /// False when no option arrives in time (you'd be late).
    let feasible: Bool
    /// Human note for edge cases.
    let note: String?
}

enum AlarmKind: String {
    case getReady
    case leave

    var title: String {
        switch self {
        case .getReady: return "Time to get ready"
        case .leave: return "Leave now!"
        }
    }
}
