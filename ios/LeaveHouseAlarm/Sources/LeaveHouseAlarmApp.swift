import SwiftUI

@main
struct LeaveHouseAlarmApp: App {
    @StateObject private var model = AppModel.shared
    @Environment(\.scenePhase) private var scenePhase

    init() {
        // Must register background task handlers before launch completes.
        BackgroundRefresh.register()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .task { await model.bootstrap() }
                .preferredColorScheme(.dark)
        }
        .onChange(of: scenePhase) { phase in
            switch phase {
            case .active:
                Task { await model.refresh() }
            case .background:
                BackgroundRefresh.schedule()
            default:
                break
            }
        }
    }
}
