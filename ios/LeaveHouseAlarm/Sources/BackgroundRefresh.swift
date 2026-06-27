import BackgroundTasks
import Foundation

// Periodic background refresh so departure times and scheduled alarms stay
// current even if you don't open the app. iOS decides exactly when these run
// (typically when it predicts you'll use the app), so this is best-effort — the
// pre-scheduled notifications are the real guarantee. The app also refreshes on
// every foreground.

enum BackgroundRefresh {
    static let taskIdentifier = "com.leavehouse.alarm.refresh"

    /// Register the handler. Call once at launch, before the app finishes
    /// launching, per BGTaskScheduler requirements.
    static func register() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: taskIdentifier, using: nil
        ) { task in
            guard let appRefresh = task as? BGAppRefreshTask else { return }
            handle(appRefresh)
        }
    }

    /// Ask iOS to run us again in ~30 minutes.
    static func schedule() {
        let request = BGAppRefreshTaskRequest(identifier: taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    private static func handle(_ task: BGAppRefreshTask) {
        schedule() // always queue the next one

        let work = Task { @MainActor in
            await AppModel.shared.refresh()
            task.setTaskCompleted(success: true)
        }
        task.expirationHandler = { work.cancel() }
    }
}
