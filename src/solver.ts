import { Break, Cls, Config, Status, TS } from "./types";
import { init2DArr, calcDist, prettify } from "./utils";
import { Roarr as log } from "roarr";

// Terminologies
// Module > Lesson > Class > Timeslots

const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const TIMESLOT_SIZE = 30; // minutes

type SimpleTime = {
  dayIndex: number;
  startIndex: number;
  endIndex: number;
};
export function doTimeslotsOverlap(ts1: SimpleTime, ts2: SimpleTime) {
  // If not on the same day, false for sure
  if (ts1.dayIndex !== ts2.dayIndex) return false;

  // Returns true if class overlaps timeslot
  return !(ts1.endIndex <= ts2.startIndex || ts2.endIndex <= ts1.startIndex);
}

// Check whether the included mod is the cause of the lack of break
export function isBreakPresent(isFree: Status[][], cls: Cls, breaks: Break[]) {
  if (breaks?.length <= 0) return true;

  // Every break needs to be true
  return breaks.every((b) => {
    // For each break, there needs at least minDuration consecutive hours
    const minDuration = b.minDuration;
    let vacuouslyTrue = true;
    for (let breakTS of b.timeslots) {
      const hasOverlap = cls.timeslots.some((classTS) =>
        doTimeslotsOverlap(
          {
            ...breakTS,
            startIndex: breakTS.start,
            endIndex: breakTS.end,
            dayIndex: classTS.dayIndex,
          },
          classTS,
        ),
      );

      // If the newly inserted timeslot doesn't clash with the breaktime,
      // then it shouldn't affect
      if (!hasOverlap) continue;
      vacuouslyTrue = false;

      Solver.setTimetable(isFree, cls);
      const res = cls.timeslots.every((ts) => {
        const dayIndex = ts.dayIndex;

        let totalbreak = 0;
        for (let i = breakTS.start; i < breakTS.end; i++) {
          if (isFree[dayIndex][i] !== undefined) totalbreak = 0;

          totalbreak += TIMESLOT_SIZE;
          if (totalbreak >= minDuration) return true;
        }
      });
      Solver.resetTimetable(isFree, cls);

      return res;
    }

    return vacuouslyTrue;
  });
}

function isCloseEnough(isFree: Status[][], cls: Cls, maxDist: number) {
  if (maxDist < 0) return true;

  return (
    cls.timeslots
      .filter((cur) => cur.coord !== undefined)
      // TODO: Change to use every
      .reduce((acc, cur) => {
        const day = cur.dayIndex;

        // Previous
        // TODO: This might not be -1 given that each block is half hour now
        const prev = isFree[day][cur.startIndex - 1];
        if (prev?.coord !== undefined) {
          const dist = calcDist(prev.coord, cur.coord!);
          acc &&= dist <= maxDist;
        }

        // Previous
        const next = isFree[day][cur.endIndex + 1];
        if (next?.coord !== undefined) {
          const dist = calcDist(next.coord, cur.coord!);
          acc &&= dist <= maxDist;
        }

        log(`acc: ${acc}`);
        return acc;
      }, true)
  );
}

export class Solver {
  // Keep track of allocation status
  isFree: Status[][]; // NOTE: One array item represents half hour, instead of one hour, there are 48 half hours a day
  isLessonAllocated: Map<string, boolean>;

  allClasses: Cls[]; // All classes to consider
  curClasses: Cls[]; // Working Set
  result: Cls[][]; // Working Set

  // Additional information to terminate branch early
  numClassPerLesson: { [key: string]: number };

  // Limit Number of Solutions
  maxsols: number;
  numsols: number;

  // Give best solution
  bestSol: Cls[];
  minLessonCount: number;

  config: Config;

  constructor(config: Config) {
    this.numsols = 0;
    this.maxsols = config.maxSols;
    this.config = config;

    this.curClasses = [];
    this.result = [];

    this.isLessonAllocated = new Map();
    this.isFree = init2DArr<Status>(DAYS_IN_WEEK, HOURS_IN_DAY * 2, undefined);

    this.bestSol = [];
    this.minLessonCount = 0;

    this.allClasses = [];
    this.numClassPerLesson = {};
  }

  static getLessonKey(cls: { moduleCode: string; lessonType: string }) {
    return `${cls.moduleCode} ${cls.lessonType}`.toLowerCase();
  }

  static getClassKey(cls: {
    moduleCode: string;
    lessonType: string;
    classNo: string;
  }) {
    return `${this.getLessonKey(cls)} ${cls.classNo}`.toLowerCase();
  }

  static calculatePriority(allClasess: Cls[][]): { [key: string]: number } {
    const freq: { [key: string]: number } = {};
    allClasess.forEach((userClasses) => {
      userClasses.forEach((cls: Cls) => {
        const key = Solver.getClassKey(cls);

        if (key in freq) freq[key] += 1;
        else freq[key] = 1;
      });
    });

    return freq;
  }

  static assignPriority(classes: Cls[], priority: { [key: string]: number }) {
    classes = classes.map((c: Cls) => {
      const key = Solver.getClassKey(c);

      if (!(key in priority)) return c;

      return { ...c, priority: priority[key] };
    });

    return classes;
  }

  static groupIntoClasses(lessons: TS[]) {
    const classToTimeSlot: { [key: string]: Cls } = {};
    lessons.forEach((l: TS) => {
      const key = Solver.getClassKey(l);

      if (key in classToTimeSlot) {
        classToTimeSlot[key].timeslots.push(l);
      } else {
        classToTimeSlot[key] = {
          moduleCode: l.moduleCode,
          lessonType: l.lessonType,
          classNo: l.classNo,
          priority: 0,
          coord: l.coord,
          timeslots: [l],
        };
      }
    });

    const classes = Object.values(classToTimeSlot);

    return classes;
  }

  static getNumClassPerLesson(classes: Cls[]) {
    const freq: { [key: string]: number } = {};
    classes.forEach((c: Cls) => {
      const key = Solver.getLessonKey(c);
      if (key in freq) freq[key]++;
      else freq[key] = 1;
    });

    return freq;
  }

  // Optimisation
  // Preallocate the mods to prevent the need from going one level deeper in
  // the recursion tree
  preallocateMods(classes: Cls[]) {
    let numClassPerLesson = Solver.getNumClassPerLesson(classes);

    classes.forEach((cls: Cls) => {
      const lessonKey = Solver.getLessonKey(cls);

      const numclasses = numClassPerLesson[lessonKey];

      if (numclasses > 1) return;

      if (!Solver.checkAvail(this.isFree, cls.timeslots)) {
        return;
      }

      Solver.setTimetable(this.isFree, cls);

      this.curClasses.push(cls);
    });

    this.bestSol = structuredClone(this.curClasses);

    // Remove unwanted classes
    this.allClasses = classes.filter((cls: Cls) => {
      const lessonKey = Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      return numclasses > 1;
    });

    // Remove unwanted classes
    this.numClassPerLesson = Object.fromEntries(
      Object.entries(numClassPerLesson).filter(([_, value]) => {
        return value > 1;
      }),
    );
  }

  static resetTimetable(isFree: Status[][], cls: Cls) {
    cls.timeslots.forEach((ts: TS) => {
      Solver.setTimetableVal(isFree, ts, undefined);
    });
  }

  static setTimetable(isFree: Status[][], cls: Cls) {
    cls.timeslots.forEach((ts: TS) => {
      Solver.setTimetableVal(isFree, ts, cls);
    });
  }

  static setTimetableVal(
    bitmap: Status[][],
    timeslot: TS,
    val: Cls | undefined,
  ) {
    for (let i = timeslot.startIndex; i < timeslot.endIndex; i++) {
      bitmap[timeslot.dayIndex][i] = val;
    }
  }

  static checkAvail(bitmap: Status[][], timeslots: TS[]) {
    for (let ts of timeslots) {
      for (let i = ts.startIndex; i < ts.endIndex; i++) {
        if (bitmap[ts.dayIndex][i] != undefined) return false;
      }
    }
    return true;
  }

  solve(input: TS[][], index: number) {
    const allUsersClasses = input.map((lessons) =>
      Solver.groupIntoClasses(lessons),
    );

    // Find "priority" of each lesson slot
    const coursePriority = Solver.calculatePriority(allUsersClasses);

    const allClasses = Solver.assignPriority(
      allUsersClasses[index],
      coursePriority,
    );

    // Preprocess timetable
    this.preallocateMods(allClasses);

    // Days preference
    // Map day to its "rank"
    const daysRank = this.config.prefDays.reduce((acc, day, index) => {
      acc[day % DAYS_IN_WEEK] = index; // Sunday is both 7 and 0
      return acc;
    }, new Array(DAYS_IN_WEEK).fill(DAYS_IN_WEEK));

    log(Object(daysRank), "daysRank");

    // Sort to guarantee predictability
    this.allClasses.sort((a: Cls, b: Cls) => {
      const aDay = a.timeslots.reduce(
        (acc, ts) => Math.min(daysRank[ts.dayIndex], acc),
        DAYS_IN_WEEK,
      );
      const bDay = b.timeslots.reduce(
        (acc, ts) => Math.min(daysRank[ts.dayIndex], acc),
        DAYS_IN_WEEK,
      );

      return (
        b.priority - a.priority ||
        aDay - bDay ||
        b.moduleCode.localeCompare(a.moduleCode) ||
        b.lessonType.localeCompare(a.lessonType) ||
        b.classNo.localeCompare(a.classNo)
      );
    });

    log(prettify(this.curClasses), "this.curClasses");
    log(prettify(this.allClasses), "this.allClasses");
    log(this.numClassPerLesson, "this.numClassPerLesson");

    const numlessons = Object.keys(this.numClassPerLesson).length;
    this.minLessonCount = numlessons;
    this._solve(0, numlessons);

    log(Object(this.result.map((classes) => prettify(classes))), "this.result");
    if (this.result.length <= 0) return [this.bestSol];

    return this.result;
  }

  _solve(counter: number, numlessons: number): void {
    // Save "best" result
    if (numlessons < this.minLessonCount) {
      this.minLessonCount = numlessons;
      this.bestSol = structuredClone(this.curClasses);
    }

    if (this.maxsols > 0 && this.numsols >= this.maxsols) {
      return;
    }

    if (numlessons <= 0) {
      this.numsols++;

      // Save solution
      log(prettify(this.curClasses), "Solution");
      // Deep Copy for minimal confusion
      const solution = structuredClone(this.curClasses);
      // const solution = this.curClasses;
      this.result.push(solution);
      return;
    }

    if (counter == this.allClasses.length) {
      // Base Case
      // guarantees algorithm terminate
      return;
    }
    const curCls = this.allClasses[counter];
    const lessonKey = Solver.getLessonKey(curCls);

    this.numClassPerLesson[lessonKey]--;

    // For every mod, make the decision to choose or don't choose
    // Choice 1: Pick
    const isAvail = Solver.checkAvail(this.isFree, curCls.timeslots);
    const isAllocated: boolean = !!this.isLessonAllocated.get(lessonKey);
    const isClose: boolean = isCloseEnough(
      this.isFree,
      curCls,
      this.config.maxDist,
    );
    const hasBreak: boolean = isBreakPresent(
      this.isFree,
      curCls,
      this.config.breaks,
    );

    // console.log({ curCls, isAvail, isAllocated, isClose, hasBreak });

    if (isAvail && !isAllocated && isClose && hasBreak) {
      Solver.setTimetable(this.isFree, curCls);
      this.isLessonAllocated.set(lessonKey, true);
      this.curClasses.push(curCls);

      this._solve(counter + 1, numlessons - 1);

      Solver.resetTimetable(this.isFree, curCls);
      this.isLessonAllocated.set(lessonKey, false);
      this.curClasses.pop();
    }

    // Choice 2: Don't pick
    this._solve(counter + 1, numlessons);

    this.numClassPerLesson[lessonKey]++;
  }
}
