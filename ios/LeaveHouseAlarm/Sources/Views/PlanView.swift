import SwiftUI

// The hero card: the next trip plus the two alarm countdowns.
struct PlanView: View {
    let plan: AlarmPlan

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("NEXT TRIP")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                Text(plan.event.title)
                    .font(.title2.weight(.bold))
                Text("\(plan.event.start, format: .dateTime.weekday().hour().minute()) · \(plan.event.location.isEmpty ? "no location" : plan.event.location)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 0) {
                CountdownRow(label: "Start getting ready",
                             date: plan.getReadyAt, tint: .yellow)
                Divider().overlay(.white.opacity(0.1))
                CountdownRow(label: "Leave the house",
                             date: plan.leaveHomeAt, tint: .red)
            }
            .padding(.vertical, 4)

            if let chosen = plan.chosen {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(chosen.summary) · \(durationText(chosen.duration)) · arrive ~\(chosen.arrivalTime, format: .dateTime.hour().minute())")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    if let transit = chosen.legs.first(where: { $0.mode == .transit }),
                       let dep = transit.departureTime {
                        Text("Next \(transit.line ?? "service") departs \(dep, format: .dateTime.hour().minute())\(transit.departureStop.map { " from \($0)" } ?? "")")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let note = plan.note {
                Text(note)
                    .font(.footnote)
                    .foregroundStyle(.orange)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.orange.opacity(0.12),
                                in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding()
        .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 20))
    }

    private func durationText(_ seconds: TimeInterval) -> String {
        let m = Int(seconds / 60)
        if m < 60 { return "\(m) min" }
        return "\(m / 60) h \(m % 60) min"
    }
}

private struct CountdownRow: View {
    let label: String
    let date: Date
    let tint: Color

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(date, format: .dateTime.hour().minute())
                .font(.headline)
                .foregroundStyle(tint)
            if date > Date() {
                Text(date, style: .relative)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: 70, alignment: .trailing)
            } else {
                Text("passed")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: 70, alignment: .trailing)
            }
        }
        .padding(.vertical, 8)
    }
}
