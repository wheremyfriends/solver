import { Solver } from "./solver";
import { Config, NUSModsLessons, TS } from "./types";
import { preprocess, postprocess, timeToIndex, prettify } from "./utils";

const defaultConf = {
  maxSols: -1,
  prefDays: [],
  breaks: [],
  maxDist: -1,
  venueInfo: {},
};

function preprocessConfig(config: Config) {
  return {
    ...config,
    breaks: config.breaks.map((b) => {
      return {
        ...b,
        timeslots: b.timeslots.map((ts) => {
          return {
            start: timeToIndex(ts.start),
            end: timeToIndex(ts.end),
          };
        }),
      };
    }),
  };
}

export function getOptimisedTimetable(
  timetables: NUSModsLessons[][],
  index: number,
  config: Config = defaultConf,
) {
  const processedTimetable: TS[][] = timetables.map((e) => {
    return preprocess(e, config.venueInfo);
  });

  config = preprocessConfig(config);

  const solver = new Solver(config);
  const solvedTimetable = solver.solve(processedTimetable, index);

  const ret: NUSModsLessons[][] = [];
  solvedTimetable.forEach((timetable) => {
    let retTimetable: any[] = [];
    timetable.forEach((cls) => {
      retTimetable = retTimetable.concat(postprocess(cls.timeslots));
    });

    ret.push(retTimetable);
  });

  console.log(ret.map((classes) => prettify(classes)));
  return ret;
}
