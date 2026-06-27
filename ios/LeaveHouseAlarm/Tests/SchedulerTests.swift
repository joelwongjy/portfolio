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

    func testNearestBusStopPicksClosest() {
        let stops = [
            BusStop(code: "A", roadName: "Far Rd", description: "Far",
                    lat: 1.40, lng: 103.90),
            BusStop(code: "B", roadName: "Near Rd", description: "Near",
                    lat: 1.3001, lng: 103.8001),
            BusStop(code: "C", roadName: "Mid Rd", description: "Mid",
                    lat: 1.31, lng: 103.81),
        ]
        let home = Coordinate(latitude: 1.30, longitude: 103.80)
        XCTAssertEqual(BusStopCatalog.nearest(in: stops, to: home)?.code, "B")
        XCTAssertNil(BusStopCatalog.nearest(in: [], to: home))
    }

    func testBusArrivalMinutesAway() {
        let now = Date(timeIntervalSince1970: 1_000_000)
        let bus = BusArrival(serviceNo: "15", arrivals: [
            now.addingTimeInterval(180), now.addingTimeInterval(600),
        ])
        XCTAssertEqual(bus.minutesAway(from: now), 3)
        let arriving = BusArrival(serviceNo: "2", arrivals: [now.addingTimeInterval(-10)])
        XCTAssertEqual(arriving.minutesAway(from: now), 0)
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
