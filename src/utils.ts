import { Coord, VenueInfo, TS, NUSModsLessons, Status } from "./types";

/**
 * Converts day (e.g Monday/Tuesday/Wednesday) to its corresponding number.
 * 0 - Sunday
 * 1 - Monday
 * etc
 */
export function convertDaytoNumber(inp: string): number {
  const days: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  return days[inp];
}

export function convertNumbertoDay(inp: number): string {
  const days: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days[inp];
}

export function init2DArr<T>(row: number, col: number, initval: T): T[][] {
  let output: T[][] = [];

  for (let i = 0; i < row; i++) {
    output.push(new Array<T>(col).fill(initval));
  }

  return output;
}

export function getEmptyTimetable(): Status[][] {
  return init2DArr<Status>(7, 48, undefined);
}

export function timeToIndex(time: number) {
  // Each day is split into half hours
  // 1 day has 48 half hours
  const hours = Math.floor(time / 100);
  const minutes = time % 100;

  return hours * 2 + minutes / 30;
}

// function indexToTime(timeIndex: number) {
//   const minuteIndex = timeIndex % 2;
//   const hours = (timeIndex - minuteIndex) / 2;
//   const minutes = `${minuteIndex * 30}`.padStart(2, "0");
//
//   return `${hours}${minutes}`.padStart(4, "0");
// }

export function preprocess(
  timeslots: NUSModsLessons[],
  venueInfo: VenueInfo,
): TS[] {
  return timeslots.map((ts) => {
    // Get coords of venue
    const coord =
      ts.venue in venueInfo
        ? {
            lat: venueInfo[ts.venue].lat,
            lon: venueInfo[ts.venue].lon,
          }
        : undefined;

    return {
      ...ts,
      startIndex: timeToIndex(parseInt(ts["startTime"])),
      endIndex: timeToIndex(parseInt(ts["endTime"])),
      dayIndex: convertDaytoNumber(ts["day"]),
      coord: coord,
    };
  });
}

export function postprocess(timeslots: TS[]) {
  return timeslots.map((ts) => {
    // Remove keys added during preprocessing
    const { startIndex, endIndex, dayIndex, coord, ...remaining } = ts;
    return remaining;
  });
}

export function calcDist(p1: Coord, p2: Coord) {
  const r = 6371; // km
  const p = Math.PI / 180;

  const a =
    0.5 -
    Math.cos((p1.lat - p2.lat) * p) / 2 +
    (Math.cos(p1.lat * p) *
      Math.cos(p2.lat * p) *
      (1 - Math.cos((p2.lon - p1.lon) * p))) /
      2;

  return 2 * r * Math.asin(Math.sqrt(a)); // in KM
}

export function prettify(
  classes: {
    moduleCode: string;
    lessonType: string;
    classNo: string;
  }[],
) {
  return Object(
    classes.map((cls) => `${cls.moduleCode} ${cls.lessonType} ${cls.classNo}`),
  );
}

export function transformVenues(venueInfo: {
  [key: string]: {
    location: {
      x: number;
      y: number;
    };
  };
}): VenueInfo {
  return Object.keys(venueInfo)
    .filter((key) => "location" in venueInfo[key])
    .reduce((acc, key) => {
      acc[key] = {
        lon: venueInfo[key].location.x,
        lat: venueInfo[key].location.y,
      };
      return acc;
    }, {} as VenueInfo);
}
