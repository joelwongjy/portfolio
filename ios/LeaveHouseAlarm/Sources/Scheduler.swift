import Foundation

// Pure planning logic — no UIKit/EventKit so it's trivially unit-testable.

enum Scheduler {

    /// Pick the best journey option for an event: the *latest* departure that
    /// still arrives by `arriveBy` (least waiting around). If nothing arrives in
    /// time, fall back to the option arriving soonest and report not-feasible.
    static func chooseOption(
        _ options: [JourneyOption],
        arriveBy: Date
    ) -> (option: JourneyOption?, feasible: Bool) {
        guard !options.isEmpty else { return (nil, false) }

        let inTime = options.filter { $0.arrivalTime <= arriveBy }
        if let best = inTime.max(by: { $0.departureTime < $1.departureTime }) {
            return (best, true)
        }
        let earliest = options.min(by: { $0.arrivalTime < $1.arrivalTime })
        return (earliest, false)
    }

    /// Build the full alarm plan for an event.
    ///
    ///   arriveBy    = event.start − arrivalBuffer
    ///   leaveHomeAt = chosen.departureTime − leaveBuffer
    ///   getReadyAt  = leaveHomeAt − prepMinutes
    static func buildPlan(
        event: CalEvent,
        journey: JourneyResult?,
        prefs: Prefs
    ) -> AlarmPlan {
        let arriveBy = event.start.addingMinutes(-prefs.arrivalBufferMinutes)

        guard let journey, !journey.options.isEmpty else {
            return AlarmPlan(
                event: event,
                chosen: nil,
                getReadyAt: arriveBy.addingMinutes(-prefs.prepMinutes),
                leaveHomeAt: arriveBy,
                arriveBy: arriveBy,
                feasible: false,
                note: journey == nil
                    ? "Transit not looked up yet."
                    : "No transit route found — times are a rough guess."
            )
        }

        let (option, feasible) = chooseOption(journey.options, arriveBy: arriveBy)
        let chosen = option!
        let leaveHomeAt = chosen.departureTime.addingMinutes(-prefs.leaveBufferMinutes)
        let getReadyAt = leaveHomeAt.addingMinutes(-prefs.prepMinutes)

        return AlarmPlan(
            event: event,
            chosen: chosen,
            getReadyAt: getReadyAt,
            leaveHomeAt: leaveHomeAt,
            arriveBy: arriveBy,
            feasible: feasible,
            note: feasible
                ? nil
                : "Heads up: the soonest route still arrives after your target time."
        )
    }

    /// The soonest upcoming event that has a destination.
    static func nextRelevantEvent(_ events: [CalEvent], now: Date) -> CalEvent? {
        events
            .filter { $0.hasDestination && $0.start > now }
            .sorted { $0.start < $1.start }
            .first
    }
}

extension Date {
    func addingMinutes(_ minutes: Int) -> Date {
        addingTimeInterval(TimeInterval(minutes) * 60)
    }
}
