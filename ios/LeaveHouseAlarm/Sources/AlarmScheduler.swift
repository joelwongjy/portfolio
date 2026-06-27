import Foundation
import UserNotifications

// Schedules the two local notifications ("get ready" / "leave now") for a plan.
//
// This is how a native app gets an alarm that fires when the app is closed: we
// pre-schedule UNNotificationRequests. They survive backgrounding/termination.
// For a loud, silent-mode-overriding ring you need Apple's "Critical Alerts"
// entitlement (a special request to Apple) — wire `useCriticalSound` to true
// once granted. Without it, notifications still fire with the default sound.

@MainActor
final class AlarmScheduler: ObservableObject {
    private let center = UNUserNotificationCenter.current()
    static let category = "LEAVE_HOUSE_ALARM"

    @Published var authorized = false

    /// Whether to use a critical (loud, bypasses silent/DND) sound. Requires the
    /// com.apple.developer.usernotifications.critical-alerts entitlement.
    var useCriticalSound = false

    func requestAuthorization() async {
        var options: UNAuthorizationOptions = [.alert, .sound, .badge]
        if useCriticalSound { options.insert(.criticalAlert) }
        do {
            authorized = try await center.requestAuthorization(options: options)
        } catch {
            authorized = false
        }
        let category = UNNotificationCategory(
            identifier: Self.category, actions: [],
            intentIdentifiers: [], options: []
        )
        center.setNotificationCategories([category])
    }

    /// Replace any previously scheduled alarms with the ones for this plan.
    /// Past times are skipped.
    func reschedule(for plan: AlarmPlan) async {
        center.removeAllPendingNotificationRequests()
        let now = Date()

        await schedule(.getReady, at: plan.getReadyAt, plan: plan, now: now)
        await schedule(.leave, at: plan.leaveHomeAt, plan: plan, now: now)
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }

    private func schedule(_ kind: AlarmKind, at date: Date, plan: AlarmPlan, now: Date) async {
        guard date > now else { return }

        let content = UNMutableNotificationContent()
        content.title = kind.title
        content.body = body(for: kind, plan: plan)
        content.categoryIdentifier = Self.category
        content.interruptionLevel = .timeSensitive
        if useCriticalSound {
            content.sound = .defaultCritical
        } else {
            content.sound = .default
        }

        let comps = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute, .second], from: date
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let request = UNNotificationRequest(
            identifier: "\(plan.event.id):\(kind.rawValue)",
            content: content, trigger: trigger
        )
        try? await center.add(request)
    }

    private func body(for kind: AlarmKind, plan: AlarmPlan) -> String {
        let time = DateFormatter.shortTime.string(from: plan.event.start)
        switch kind {
        case .getReady:
            return "\(plan.event.title) at \(time) · \(plan.event.location)"
        case .leave:
            let route = plan.chosen?.summary ?? "your journey"
            let leave = DateFormatter.shortTime.string(from: plan.leaveHomeAt)
            return "\(plan.event.title) — \(route). Leave by \(leave)."
        }
    }
}

extension DateFormatter {
    static let shortTime: DateFormatter = {
        let f = DateFormatter()
        f.timeStyle = .short
        f.dateStyle = .none
        return f
    }()
}
