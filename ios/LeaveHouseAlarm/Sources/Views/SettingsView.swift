import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Home / start location") {
                    TextField("e.g. 10 Downing St, London",
                              text: $model.prefs.homeLocation)
                        .textInputAutocapitalization(.words)
                }

                Section("Timing (minutes)") {
                    Stepper("Get ready: \(model.prefs.prepMinutes)",
                            value: $model.prefs.prepMinutes, in: 0...180, step: 5)
                    Stepper("Leave buffer: \(model.prefs.leaveBufferMinutes)",
                            value: $model.prefs.leaveBufferMinutes, in: 0...30)
                    Stepper("Arrive early: \(model.prefs.arrivalBufferMinutes)",
                            value: $model.prefs.arrivalBufferMinutes, in: 0...60)
                }

                Section("Transit data") {
                    Picker("Provider", selection: $model.prefs.transitProvider) {
                        ForEach(TransitProviderKind.allCases) { kind in
                            Text(kind.label).tag(kind)
                        }
                    }
                    if model.prefs.transitProvider == .google {
                        TextField("Google Routes API key",
                                  text: $model.prefs.googleApiKey)
                            .font(.system(.body, design: .monospaced))
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                    }
                }

                Section {
                    Label(model.calendar.authorized
                          ? "Calendar access granted"
                          : "Calendar access needed",
                          systemImage: model.calendar.authorized
                          ? "checkmark.circle" : "exclamationmark.circle")
                    Label(model.alarms.authorized
                          ? "Notifications enabled"
                          : "Notifications needed",
                          systemImage: model.alarms.authorized
                          ? "checkmark.circle" : "exclamationmark.circle")
                } header: {
                    Text("Permissions")
                } footer: {
                    Text("Grant calendar + notification access in iOS Settings if these show as needed.")
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                        Task { await model.refresh() }
                    }
                }
            }
        }
    }
}
