// Unit tests for solver functionalities
import { describe, beforeEach, it, expect } from "@jest/globals";
import { doTimeslotsOverlap, isBreakPresent } from "../src/solver";
import { init2DArr } from "../src/utils";
import { Cls } from "../src/types";

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

it.each([
  {
    isFree: init2DArr(7, 48, undefined),
    cls: {
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
    },
    breaks: [
      {
        minDuration: 60,
        timeslots: [
          {
            start: 24,
            end: 26,
          },
        ],
      },
    ],
    expected: false,
  },
  {
    isFree: init2DArr(7, 48, undefined),
    cls: {
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
          startIndex: 25,
          endIndex: 26,
          dayIndex: 1,
          coord: undefined,
        },
      ],
    },
    breaks: [
      {
        minDuration: 60,
        timeslots: [
          {
            start: 24,
            end: 26,
          },
        ],
      },
    ],
    expected: false,
  },
  {
    isFree: init2DArr(7, 48, undefined),
    cls: {
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
    },
    breaks: [
      {
        minDuration: 30,
        timeslots: [
          {
            start: 24,
            end: 26,
          },
        ],
      },
    ],
    expected: true,
  },
  {
    isFree: init2DArr(7, 48, undefined),
    cls: {
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
          startIndex: 26,
          endIndex: 28,
          dayIndex: 1,
          coord: undefined,
        },
      ],
    },
    breaks: [
      {
        minDuration: 60,
        timeslots: [
          {
            start: 24,
            end: 26,
          },
        ],
      },
    ],
    expected: true,
  },
])("test hasBreak function", ({ isFree, cls, breaks, expected }) => {
  const res = isBreakPresent(isFree, cls, breaks);
  expect(res).toStrictEqual(expected);
});
