import Foundation
import SwiftUI

// Ties everything together: load events → look up transit → build the plan →
// (re)schedule the alarms. Drives the UI as an ObservableObject.

@MainActor
final class AppModel: ObservableObject {
    /// Single shared instance so the background-task handler and the SwiftUI
    /// view tree operate on the same state.
    static let shared = AppModel()

    @Published var prefs: Prefs { didSet { Persistence.save(prefs) } }
    @Published var events: [CalEvent] = []
    @Published var plan: AlarmPlan?
    @Published var statusMessage: String?
    @Published var isWorking = false
    /// Live Singapore bus arrivals at the configured home stop (LTA DataMall).
    @Published var busArrivals: [BusArrival] = []

    let calendar = CalendarService()
    let alarms = AlarmScheduler()

    init() {
        prefs = Persistence.loadPrefs()
    }

    private var provider: TransitProvider {
        switch prefs.transitProvider {
        case .mapKit:
            return MapKitTransitProvider()
        case .google:
            return prefs.googleApiKey.isEmpty
                ? MockTransitProvider()
                : GoogleTransitProvider(apiKey: prefs.googleApiKey)
        }
    }

    /// First-run permission prompts.
    func bootstrap() async {
        await calendar.requestAccess()
        await alarms.requestAuthorization()
        await refresh()
    }

    /// Full recompute: reload events, look up the next journey, reschedule.
    func refresh() async {
        isWorking = true
        defer { isWorking = false }

        events = calendar.upcomingEvents()
        guard let next = Scheduler.nextRelevantEvent(events, now: Date()) else {
            plan = nil
            statusMessage = "No upcoming events with a location."
            alarms.cancelAll()
            return
        }

        // Show a provisional plan immediately, then refine with transit data.
        plan = Scheduler.buildPlan(event: next, journey: nil, prefs: prefs)

        guard !prefs.homeLocation.isEmpty else {
            statusMessage = "Set your home location to compute departure times."
            return
        }

        let arriveBy = next.start.addingMinutes(-prefs.arrivalBufferMinutes)
        let query = JourneyQuery(
            origin: prefs.homeLocation,
            originCoordinate: nil,
            destination: next.location,
            destinationCoordinate: next.coordinate,
            arriveBy: arriveBy
        )

        do {
            let journey = try await provider.journey(for: query)
            plan = Scheduler.buildPlan(event: next, journey: journey, prefs: prefs)
            statusMessage = nil
        } catch {
            statusMessage = error.localizedDescription
            // Keep the provisional (no-journey) plan so the UI still shows times.
        }

        if let plan { await alarms.reschedule(for: plan) }

        await refreshBusArrivals()
    }

    /// Pull live bus arrivals for the home stop, if configured (Singapore).
    func refreshBusArrivals() async {
        let code = prefs.homeBusStopCode.trimmingCharacters(in: .whitespaces)
        guard !code.isEmpty, !prefs.ltaAccountKey.isEmpty else {
            busArrivals = []
            return
        }
        do {
            busArrivals = try await LTADataMall(accountKey: prefs.ltaAccountKey)
                .nextBuses(busStopCode: code)
        } catch {
            busArrivals = []
        }
    }
}

/// Tiny UserDefaults-backed persistence for preferences.
enum Persistence {
    private static let key = "leaveHouse.prefs.v1"

    static func loadPrefs() -> Prefs {
        guard let data = UserDefaults.standard.data(forKey: key),
              let prefs = try? JSONDecoder().decode(Prefs.self, from: data)
        else { return Prefs() }
        return prefs
    }

    static func save(_ prefs: Prefs) {
        if let data = try? JSONEncoder().encode(prefs) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
