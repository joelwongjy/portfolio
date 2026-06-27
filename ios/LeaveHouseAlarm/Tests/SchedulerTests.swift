import XCTest
@testable import LeaveHouseAlarm

final class SchedulerTests: XCTestCase {

    private func event(start: Date) -> CalEvent {
        CalEvent(id: "e1", title: "Standup", location: "Office",
                 start: start, coordinate: nil)
    }

    private func option(depart: Date, arrive: Date) -> JourneyOption {
        JourneyOption(departureTime: depart, arrivalTime: arrive,
                      duration: arrive.timeIntervalSince(depart),
                      summary: "Bus", legs: [])
    }

    func testChoosesLatestOnTimeDeparture() {
        let arriveBy = Date(timeIntervalSince1970: 10_000)
        let early = option(depart: arriveBy.addingMinutes(-60),
                           arrive: arriveBy.addingMinutes(-30))
        let late = option(depart: arriveBy.addingMinutes(-40),
                          arrive: arriveBy.addingMinutes(-5))
        let tooLate = option(depart: arriveBy.addingMinutes(-10),
                             arrive: arriveBy.addingMinutes(15))

        let result = Scheduler.chooseOption([early, late, tooLate], arriveBy: arriveBy)
        XCTAssertTrue(result.feasible)
        XCTAssertEqual(result.option, late) // latest departure still arriving in time
    }

    func testInfeasibleWhenNothingArrivesInTime() {
        let arriveBy = Date(timeIntervalSince1970: 10_000)
        let a = option(depart: arriveBy, arrive: arriveBy.addingMinutes(20))
        let b = option(depart: arriveBy, arrive: arriveBy.addingMinutes(10))
        let result = Scheduler.chooseOption([a, b], arriveBy: arriveBy)
        XCTAssertFalse(result.feasible)
        XCTAssertEqual(result.option, b) // soonest arrival as fallback
    }

    func testBuildPlanDerivesGetReadyAndLeaveTimes() {
        let start = Date(timeIntervalSince1970: 100_000)
        var prefs = Prefs()
        prefs.prepMinutes = 30
        prefs.leaveBufferMinutes = 5
        prefs.arrivalBufferMinutes = 10

        let arriveBy = start.addingMinutes(-10)
        let depart = arriveBy.addingMinutes(-40)
        let journey = JourneyResult(provider: "test",
                                    options: [option(depart: depart, arrive: arriveBy)])

        let plan = Scheduler.buildPlan(event: event(start: start),
                                       journey: journey, prefs: prefs)

        XCTAssertTrue(plan.feasible)
        XCTAssertEqual(plan.leaveHomeAt, depart.addingMinutes(-5))
        XCTAssertEqual(plan.getReadyAt, depart.addingMinutes(-35))
    }

    func testNoJourneyStillReturnsUsablePlan() {
        let start = Date(timeIntervalSince1970: 100_000)
        let plan = Scheduler.buildPlan(event: event(start: start),
                                       journey: nil, prefs: Prefs())
        XCTAssertFalse(plan.feasible)
        XCTAssertNil(plan.chosen)
        XCTAssertNotNil(plan.note)
    }

    func testNextRelevantEventSkipsPastAndLocationless() {
        let now = Date(timeIntervalSince1970: 50_000)
        let past = CalEvent(id: "p", title: "Past", location: "X",
                            start: now.addingMinutes(-30), coordinate: nil)
        let noLoc = CalEvent(id: "n", title: "NoLoc", location: "",
                             start: now.addingMinutes(30), coordinate: nil)
        let good = CalEvent(id: "g", title: "Good", location: "Y",
                            start: now.addingMinutes(60), coordinate: nil)

        let next = Scheduler.nextRelevantEvent([past, noLoc, good], now: now)
        XCTAssertEqual(next, good)
    }
}
