# Leave House Alarm (native iOS)

A SwiftUI app that reads your **iOS Calendar**, looks up **transit** to your next
event's location, and fires two alarms — one to **start getting ready** and one
to **leave the house** in time for the bus.

> Built in a Linux CI environment with no macOS/Xcode, so the source is complete
> but has **not been compiled here**. Open it in Xcode on a Mac to build, sign,
> and run. Expect to fix any small API drift for your Xcode/iOS version.

## What it does

- **Calendar (EventKit):** reads upcoming, non-all-day events that have a
  location; uses the event's geo-coordinate when present, otherwise geocodes the
  location text.
- **Transit (pluggable):**
  - **Apple Maps (default, no API key)** — `MKDirections.calculateETA` with
    `.transit` gives expected departure/arrival/duration anchored to your
    arrive-by time. Has Singapore transit coverage.
  - **Google Routes (optional)** — set an API key in Settings for line-level
    detail ("Bus 12 towards …").
  - A **mock** provider is used automatically if Google is selected without a
    key, so the app is always usable.
- **Singapore live buses (LTA DataMall):** enter a free DataMall **AccountKey**
  and your **home bus stop code** (the 5-digit code on every SG bus stop sign) in
  Settings to see real-time "next bus in N min" arrivals — the Singapore answer
  to "how long until the next bus". Free key: https://datamall.lta.gov.sg
- **Alarms (local notifications):** schedules two `UNCalendarNotificationTrigger`
  notifications in advance, so they fire even when the app is closed. Marked
  `.timeSensitive`. For a loud ring that bypasses silent/DND, enable
  **Critical Alerts** (see below).
- **Background refresh (BGTaskScheduler):** periodically recomputes the plan and
  reschedules alarms; also refreshes on every foreground.

## The honest limitation

Only Apple's Clock app can guarantee an always-on alarm at an arbitrary computed
time. Third-party apps can't run continuously in the background to recompute "the
next bus" and ring like an alarm clock. This app's design is the realistic
best: **pre-schedule** the get-ready/leave notifications and refresh them when
iOS lets the app run. Critical Alerts make those notifications loud.

## Build

```bash
brew install xcodegen          # one-time
cd ios/LeaveHouseAlarm
xcodegen generate              # creates LeaveHouseAlarm.xcodeproj from project.yml
open LeaveHouseAlarm.xcodeproj
```

In Xcode: select your development **Team** under Signing & Capabilities, then run
on a **real device** (calendar, transit and notifications don't fully work in the
Simulator).

No XcodeGen? Create a new iOS App project in Xcode, then drag the `Sources/`
folder in and point the target's Info.plist at `Resources/Info.plist`.

## Critical Alerts (optional, for loud alarms)

1. Request the entitlement from Apple:
   https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
2. Once granted, uncomment the key in `Resources/LeaveHouseAlarm.entitlements`.
3. Set `AlarmScheduler.useCriticalSound = true`.

## Layout

```
Sources/
  Models.swift              domain types
  Scheduler.swift           pure planning logic (unit-tested)
  CalendarService.swift     EventKit access
  AlarmScheduler.swift      local-notification scheduling
  BackgroundRefresh.swift   BGTaskScheduler wiring
  AppModel.swift            orchestrator + persistence
  LeaveHouseAlarmApp.swift  @main entry
  Transit/                  TransitProvider protocol + Apple/Google/mock
  Views/                    SwiftUI screens
Tests/SchedulerTests.swift  logic tests
Resources/                  Info.plist, entitlements
project.yml                 XcodeGen spec
```

## Why not Citymapper?

Citymapper shut down its public/self-serve developer API in June 2023, so it
can't be used by an individual app. Apple Maps and Google Routes provide the
same next-departure + journey-duration data this app needs.
