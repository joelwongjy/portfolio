import SwiftUI

struct ContentView: View {
    @EnvironmentObject var model: AppModel
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let plan = model.plan {
                        PlanView(plan: plan)
                    } else {
                        EmptyStateView(message: model.statusMessage
                            ?? "No upcoming located events.")
                    }

                    if let status = model.statusMessage, model.plan != nil {
                        Label(status, systemImage: "info.circle")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }

                    if !model.busArrivals.isEmpty {
                        BusArrivalsView(arrivals: model.busArrivals,
                                        stopName: model.busStopName)
                    }

                    UpcomingList(events: model.events)

                    DisclaimerView()
                }
                .padding()
            }
            .navigationTitle("Leave House Alarm")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSettings = true } label: {
                        Image(systemName: "gearshape")
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        Task { await model.refresh() }
                    } label: {
                        if model.isWorking {
                            ProgressView()
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
}

private struct EmptyStateView: View {
    let message: String
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nothing to catch yet")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16))
    }
}

private struct UpcomingList: View {
    let events: [CalEvent]
    var body: some View {
        if events.count > 1 {
            VStack(alignment: .leading, spacing: 8) {
                Text("Upcoming")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                ForEach(events.prefix(6)) { e in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(e.title).font(.callout)
                            Text(e.location).font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(e.start, format: .dateTime.weekday().hour().minute())
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

// Live Singapore bus arrivals (LTA DataMall) for the configured home stop.
private struct BusArrivalsView: View {
    let arrivals: [BusArrival]
    let stopName: String?
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(stopName.map { "Live buses · \($0)" } ?? "Live buses at your stop",
                  systemImage: "bus.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(arrivals) { bus in
                HStack {
                    Text(bus.serviceNo)
                        .font(.callout.weight(.bold))
                        .frame(minWidth: 44, alignment: .leading)
                    Spacer()
                    Text(waitText(bus))
                        .font(.callout)
                        .foregroundStyle(.green)
                }
                .padding(.vertical, 2)
            }
        }
        .padding()
        .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16))
    }

    private func waitText(_ bus: BusArrival) -> String {
        let now = Date()
        let mins = bus.arrivals.prefix(3).map { arrival -> String in
            let m = max(0, Int(arrival.timeIntervalSince(now) / 60))
            return m == 0 ? "Arr" : "\(m) min"
        }
        return mins.joined(separator: " · ")
    }
}

private struct DisclaimerView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("How alarms fire")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("Two local notifications are scheduled in advance — one to get ready, one to leave — so they fire even when the app is closed. For a loud ring that bypasses silent mode, enable Critical Alerts in Settings (needs Apple approval). Transit uses Apple Maps by default; switch to Google Routes in Settings for line-level bus detail.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
    }
}
