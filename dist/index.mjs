var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// src/utils.ts
function convertDaytoNumber(inp) {
  const days = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };
  return days[inp];
}
function init2DArr(row, col, initval) {
  let output = [];
  for (let i = 0; i < row; i++) {
    output.push(new Array(col).fill(initval));
  }
  return output;
}
function timeToIndex(time) {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 2 + minutes / 30;
}
function preprocess(timeslots, venueInfo) {
  return timeslots.map((ts) => {
    const coord = ts.venue in venueInfo ? {
      lat: venueInfo[ts.venue].lat,
      lon: venueInfo[ts.venue].lon
    } : void 0;
    return __spreadProps(__spreadValues({}, ts), {
      startIndex: timeToIndex(parseInt(ts["startTime"])),
      endIndex: timeToIndex(parseInt(ts["endTime"])),
      dayIndex: convertDaytoNumber(ts["day"]),
      coord
    });
  });
}
function postprocess(timeslots) {
  return timeslots.map((ts) => {
    const _a = ts, { startIndex, endIndex, dayIndex, coord } = _a, remaining = __objRest(_a, ["startIndex", "endIndex", "dayIndex", "coord"]);
    return remaining;
  });
}
function calcDist(p1, p2) {
  const r = 6371;
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((p1.lat - p2.lat) * p) / 2 + Math.cos(p1.lat * p) * Math.cos(p2.lat * p) * (1 - Math.cos((p2.lon - p1.lon) * p)) / 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
function prettify(classes) {
  return Object(
    classes.map((cls) => `${cls.moduleCode} ${cls.lessonType} ${cls.classNo}`)
  );
}

// src/solver.ts
import { Roarr as log } from "roarr";
var HOURS_IN_DAY = 24;
var DAYS_IN_WEEK = 7;
var TIMESLOT_SIZE = 30;
function doTimeslotsOverlap(ts1, ts2) {
  if (ts1.dayIndex !== ts2.dayIndex) return false;
  return !(ts1.endIndex <= ts2.startIndex || ts2.endIndex <= ts1.startIndex);
}
function isBreakPresent(isFree, cls, breaks) {
  if ((breaks == null ? void 0 : breaks.length) <= 0) return true;
  Solver.setTimetable(isFree, cls);
  const res = breaks.every((b) => {
    const minDuration = b.minDuration;
    const overlap = cls.timeslots.some((ts) => {
      return b.timeslots.some((breakTS) => {
        console.log({ ts, breakTS });
        return doTimeslotsOverlap(ts, {
          startIndex: breakTS.start,
          endIndex: breakTS.end,
          dayIndex: ts.dayIndex
        });
      });
    });
    if (!overlap) {
      return true;
    }
    return b.timeslots.some((breakTS) => {
      const res2 = Array.from(
        cls.timeslots.reduce((acc, cur) => {
          acc.add(cur.dayIndex);
          return acc;
        }, /* @__PURE__ */ new Set())
      ).every((dayIndex) => {
        let totalbreak = 0;
        for (let i = breakTS.start; i < breakTS.end; i++) {
          if (isFree[dayIndex][i] !== void 0) {
            totalbreak = 0;
            continue;
          }
          totalbreak += TIMESLOT_SIZE;
          if (totalbreak >= minDuration) return true;
        }
        return false;
      });
      console.log({ breakTS, res: res2 });
      return res2;
    });
  });
  Solver.resetTimetable(isFree, cls);
  return res;
}
function isCloseEnough(isFree, cls, maxDist) {
  if (maxDist < 0) return true;
  return cls.timeslots.filter((cur) => cur.coord !== void 0).reduce((acc, cur) => {
    const day = cur.dayIndex;
    const prev = isFree[day][cur.startIndex - 1];
    if ((prev == null ? void 0 : prev.coord) !== void 0) {
      const dist = calcDist(prev.coord, cur.coord);
      acc && (acc = dist <= maxDist);
    }
    const next = isFree[day][cur.endIndex + 1];
    if ((next == null ? void 0 : next.coord) !== void 0) {
      const dist = calcDist(next.coord, cur.coord);
      acc && (acc = dist <= maxDist);
    }
    log(`acc: ${acc}`);
    return acc;
  }, true);
}
var Solver = class _Solver {
  constructor(config) {
    this.numsols = 0;
    this.maxsols = config.maxSols;
    this.config = config;
    this.curClasses = [];
    this.result = [];
    this.isLessonAllocated = /* @__PURE__ */ new Map();
    this.isFree = init2DArr(DAYS_IN_WEEK, HOURS_IN_DAY * 2, void 0);
    this.bestSol = [];
    this.minLessonCount = 0;
    this.allClasses = [];
    this.numClassPerLesson = {};
  }
  static getLessonKey(cls) {
    return `${cls.moduleCode} ${cls.lessonType}`.toLowerCase();
  }
  static getClassKey(cls) {
    return `${this.getLessonKey(cls)} ${cls.classNo}`.toLowerCase();
  }
  static calculatePriority(allClasess) {
    const freq = {};
    allClasess.forEach((userClasses) => {
      userClasses.forEach((cls) => {
        const key = _Solver.getClassKey(cls);
        if (key in freq) freq[key] += 1;
        else freq[key] = 1;
      });
    });
    return freq;
  }
  static assignPriority(classes, priority) {
    classes = classes.map((c) => {
      const key = _Solver.getClassKey(c);
      if (!(key in priority)) return c;
      return __spreadProps(__spreadValues({}, c), { priority: priority[key] });
    });
    return classes;
  }
  static groupIntoClasses(lessons) {
    const classToTimeSlot = {};
    lessons.forEach((l) => {
      const key = _Solver.getClassKey(l);
      if (key in classToTimeSlot) {
        classToTimeSlot[key].timeslots.push(l);
      } else {
        classToTimeSlot[key] = {
          moduleCode: l.moduleCode,
          lessonType: l.lessonType,
          classNo: l.classNo,
          priority: 0,
          coord: l.coord,
          timeslots: [l]
        };
      }
    });
    const classes = Object.values(classToTimeSlot);
    return classes;
  }
  static getNumClassPerLesson(classes) {
    const freq = {};
    classes.forEach((c) => {
      const key = _Solver.getLessonKey(c);
      if (key in freq) freq[key]++;
      else freq[key] = 1;
    });
    return freq;
  }
  // Optimisation
  // Preallocate the mods to prevent the need from going one level deeper in
  // the recursion tree
  preallocateMods(classes) {
    let numClassPerLesson = _Solver.getNumClassPerLesson(classes);
    classes.forEach((cls) => {
      const lessonKey = _Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      if (numclasses > 1) return;
      if (!_Solver.checkAvail(this.isFree, cls.timeslots)) {
        return;
      }
      _Solver.setTimetable(this.isFree, cls);
      this.curClasses.push(cls);
    });
    this.bestSol = structuredClone(this.curClasses);
    this.allClasses = classes.filter((cls) => {
      const lessonKey = _Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      return numclasses > 1;
    });
    this.numClassPerLesson = Object.fromEntries(
      Object.entries(numClassPerLesson).filter(([_, value]) => {
        return value > 1;
      })
    );
  }
  static resetTimetable(isFree, cls) {
    cls.timeslots.forEach((ts) => {
      _Solver.setTimetableVal(isFree, ts, void 0);
    });
  }
  static setTimetable(isFree, cls) {
    cls.timeslots.forEach((ts) => {
      _Solver.setTimetableVal(isFree, ts, cls);
    });
  }
  static setTimetableVal(bitmap, timeslot, val) {
    for (let i = timeslot.startIndex; i < timeslot.endIndex; i++) {
      const curVal = bitmap[timeslot.dayIndex][i];
      if (curVal === void 0 || this.getClassKey(curVal) === this.getClassKey(timeslot)) {
        bitmap[timeslot.dayIndex][i] = val;
      }
    }
  }
  static checkAvail(bitmap, timeslots) {
    for (let ts of timeslots) {
      for (let i = ts.startIndex; i < ts.endIndex; i++) {
        if (bitmap[ts.dayIndex][i] != void 0) return false;
      }
    }
    return true;
  }
  solve(input, index) {
    const allUsersClasses = input.map(
      (lessons) => _Solver.groupIntoClasses(lessons)
    );
    const coursePriority = _Solver.calculatePriority(allUsersClasses);
    const allClasses = _Solver.assignPriority(
      allUsersClasses[index],
      coursePriority
    );
    this.preallocateMods(allClasses);
    const daysRank = this.config.prefDays.reduce((acc, day, index2) => {
      acc[day % DAYS_IN_WEEK] = index2;
      return acc;
    }, new Array(DAYS_IN_WEEK).fill(DAYS_IN_WEEK));
    log(Object(daysRank), "daysRank");
    this.allClasses.sort((a, b) => {
      const aDay = a.timeslots.reduce(
        (acc, ts) => Math.min(daysRank[ts.dayIndex], acc),
        DAYS_IN_WEEK
      );
      const bDay = b.timeslots.reduce(
        (acc, ts) => Math.min(daysRank[ts.dayIndex], acc),
        DAYS_IN_WEEK
      );
      return b.priority - a.priority || aDay - bDay || b.moduleCode.localeCompare(a.moduleCode) || b.lessonType.localeCompare(a.lessonType) || b.classNo.localeCompare(a.classNo);
    });
    log(prettify(this.curClasses), "this.curClasses");
    log(prettify(this.allClasses), "this.allClasses");
    console.log({ allClasses: prettify(this.allClasses) });
    log(this.numClassPerLesson, "this.numClassPerLesson");
    const numlessons = Object.keys(this.numClassPerLesson).length;
    this.minLessonCount = numlessons;
    this._solve(0, numlessons);
    log(Object(this.result.map((classes) => prettify(classes))), "this.result");
    if (this.result.length <= 0) return [this.bestSol];
    return this.result;
  }
  _solve(counter, numlessons) {
    if (numlessons < this.minLessonCount) {
      this.minLessonCount = numlessons;
      this.bestSol = structuredClone(this.curClasses);
    }
    if (this.maxsols > 0 && this.numsols >= this.maxsols) {
      return;
    }
    if (numlessons <= 0) {
      this.numsols++;
      log(prettify(this.curClasses), "Solution");
      const solution = structuredClone(this.curClasses);
      this.result.push(solution);
      return;
    }
    if (counter == this.allClasses.length) {
      return;
    }
    const curCls = this.allClasses[counter];
    const lessonKey = _Solver.getLessonKey(curCls);
    this.numClassPerLesson[lessonKey]--;
    const isAvail = _Solver.checkAvail(this.isFree, curCls.timeslots);
    const isAllocated = !!this.isLessonAllocated.get(lessonKey);
    const isClose = isCloseEnough(
      this.isFree,
      curCls,
      this.config.maxDist
    );
    const hasBreak = isBreakPresent(
      this.isFree,
      curCls,
      this.config.breaks
    );
    if (isAvail && !isAllocated && (!isClose || !hasBreak)) {
      console.log({ curCls, isAvail, isAllocated, isClose, hasBreak });
    }
    if (isAvail && !isAllocated && isClose && hasBreak) {
      _Solver.setTimetable(this.isFree, curCls);
      this.isLessonAllocated.set(lessonKey, true);
      this.curClasses.push(curCls);
      this._solve(counter + 1, numlessons - 1);
      _Solver.resetTimetable(this.isFree, curCls);
      this.isLessonAllocated.set(lessonKey, false);
      this.curClasses.pop();
    }
    this._solve(counter + 1, numlessons);
    this.numClassPerLesson[lessonKey]++;
  }
};

// src/index.ts
var defaultConf = {
  maxSols: -1,
  prefDays: [],
  breaks: [],
  maxDist: -1,
  venueInfo: {}
};
function preprocessConfig(config) {
  return __spreadProps(__spreadValues({}, config), {
    breaks: config.breaks.map((b) => {
      return __spreadProps(__spreadValues({}, b), {
        timeslots: b.timeslots.map((ts) => {
          return {
            start: timeToIndex(ts.start),
            end: timeToIndex(ts.end)
          };
        })
      });
    })
  });
}
function getOptimisedTimetable(timetables, index, config = defaultConf) {
  const processedTimetable = timetables.map((e) => {
    return preprocess(e, config.venueInfo);
  });
  config = preprocessConfig(config);
  const solver = new Solver(config);
  const solvedTimetable = solver.solve(processedTimetable, index);
  const ret = [];
  solvedTimetable.forEach((timetable) => {
    let retTimetable = [];
    timetable.forEach((cls) => {
      retTimetable = retTimetable.concat(postprocess(cls.timeslots));
    });
    ret.push(retTimetable);
  });
  console.log(ret.map((classes) => prettify(classes)));
  return ret;
}
export {
  getOptimisedTimetable
};
//# sourceMappingURL=index.mjs.map