import { TimeSlot, TS, Solver } from "./solver";
import { preprocess, postprocess } from "./utils";

export function getOptimisedTimetable(
  timetables: TimeSlot[][],
  index: number,
  maxSols: number = -1,
) {
  const processedTimetable: TS[][] = timetables.map((e) => {
    return preprocess(e);
  });

  const solver = new Solver({ maxSols });
  const solvedTimetable = solver.solve(processedTimetable, index);

  const ret: TimeSlot[][] = [];
  solvedTimetable.forEach((timetable) => {
    let retTimetable: TimeSlot[] = [];
    timetable.forEach((cls) => {
      retTimetable = retTimetable.concat(postprocess(cls.timeslots));
    });

    ret.push(retTimetable);
  });

  return ret;
}
