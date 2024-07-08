// Unit tests for solver functionalities
import { describe, beforeEach, it, expect } from "@jest/globals";
import { doTimeslotsOverlap, isBreakPresent, Solver } from "../src/solver";
import { getEmptyTimetable, init2DArr } from "../src/utils";
import { Cls } from "../src/types";
import { modules } from "../__mocks__/modules";

it.each([
  [
    // Different day
    { dayIndex: 1, startIndex: 1000, endIndex: 1200 },
    { dayIndex: 2, startIndex: 1000, endIndex: 1200 },
    false,
  ],
  [
    // Same timeslot
    { dayIndex: 1, startIndex: 1000, endIndex: 1200 },
    { dayIndex: 1, startIndex: 1000, endIndex: 1200 },
    true,
  ],
  [
    // Consecutive timeslots
    { dayIndex: 1, startIndex: 1000, endIndex: 1200 },
    { dayIndex: 1, startIndex: 1200, endIndex: 1400 },
    false,
  ],
  [
    // Consecutive timeslots 2
    { dayIndex: 5, startIndex: 1000, endIndex: 1200 },
    { dayIndex: 5, startIndex: 1200, endIndex: 1400 },
    false,
  ],
  [
    // TS1 in front of TS2 with overlap
    { dayIndex: 5, startIndex: 1000, endIndex: 1300 },
    { dayIndex: 5, startIndex: 1200, endIndex: 1400 },
    true,
  ],
  [
    // TS2 in front of TS1 with overlap
    { dayIndex: 5, startIndex: 1200, endIndex: 1400 },
    { dayIndex: 5, startIndex: 1000, endIndex: 1300 },
    true,
  ],
  [
    // TS1 surrounded by TS2
    { dayIndex: 5, startIndex: 800, endIndex: 900 },
    { dayIndex: 5, startIndex: 600, endIndex: 1400 },
    true,
  ],
  [
    // TS2 surrounded by TS1
    { dayIndex: 5, startIndex: 600, endIndex: 1400 },
    { dayIndex: 5, startIndex: 800, endIndex: 900 },
    true,
  ],
  [
    // Totally not overlap
    { dayIndex: 5, startIndex: 600, endIndex: 800 },
    { dayIndex: 5, startIndex: 1300, endIndex: 1600 },
    false,
  ],
  [
    // Totally not overlap 2
    { dayIndex: 1, startIndex: 600, endIndex: 800 },
    { dayIndex: 5, startIndex: 1300, endIndex: 1600 },
    false,
  ],
])("test overlap timeslot feature: %o & %o", (ts1, ts2, expectedRes) => {
  expect(doTimeslotsOverlap(ts1, ts2)).toStrictEqual(expectedRes);
});

const CS2040S = {
  moduleCode: "CS2040S",
  lessonType: "Lecture",
  classNo: "1",
  coord: undefined,
  priority: 1,
  timeslots: [
    {
      moduleCode: "CS2040S",
      lessonType: "Lecture",
      classNo: "1",
      startIndex: 24,
      endIndex: 26,
      dayIndex: 1,
      coord: undefined,
    },
  ],
};

// it.each()("test hasBreak function", ({ isFree, cls, breaks, expected }) => {
//   const res = isBreakPresent(isFree, cls, breaks);
//   expect(res).toStrictEqual(expected);
// });

it("test if other mods will interfere (same day, same timeslot)", () => {
  const isFree = getEmptyTimetable();
  const breaks = [
    {
      minDuration: 60,
      timeslots: [
        {
          start: 24, // 1200
          end: 26, // 1300
        },
      ],
    },
  ];

  Solver.setTimetable(isFree, modules.CS2040S);

  const CS2100 = modules.CS2100;

  expect(isBreakPresent(isFree, CS2100, breaks)).toStrictEqual(true);
});

it("test disjointed breaks success", () => {
  const isFree = getEmptyTimetable();
  const breaks = [
    {
      minDuration: 60,
      timeslots: [
        {
          start: 22, // 1100
          end: 24, // 1200
        },
        {
          start: 24, // 1200
          end: 28, // 1400
        },
      ],
    },
  ];

  Solver.setTimetable(isFree, modules.CS2040S);

  expect(isBreakPresent(isFree, modules.CS2100, breaks)).toStrictEqual(true);
});

it("test disjointed breaks #2", () => {
  const isFree = getEmptyTimetable();
  const breaks = [
    {
      minDuration: 60,
      timeslots: [
        {
          start: 22, // 1100
          end: 24, // 1200
        },
        {
          start: 24, // 1200
          end: 26, // 1300
        },
      ],
    },
  ];

  Solver.setTimetable(isFree, modules.CS2040S);

  expect(isBreakPresent(isFree, modules.CS2100, breaks)).toStrictEqual(false);
});
