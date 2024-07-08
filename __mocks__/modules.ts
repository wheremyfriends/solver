import { Cls } from "../src/types";

export const modules: { [key: string]: Cls } = {
  CS2040S: {
    priority: 0,
    classNo: "1",
    lessonType: "Lecture",
    moduleCode: "CS2040S",
    coord: undefined,
    timeslots: [
      {
        classNo: "1",
        startIndex: 24, // 1200
        endIndex: 26, // 1300
        coord: undefined,
        dayIndex: 4,
        lessonType: "Lecture",
        moduleCode: "CS2040S",
      },
    ],
  },
  CS2100: {
    priority: 0,
    classNo: "1",
    lessonType: "Lecture",
    moduleCode: "CS2100",
    coord: undefined,
    timeslots: [
      {
        classNo: "1",
        startIndex: 22, // 1100
        endIndex: 24, // 1200
        coord: undefined,
        dayIndex: 4,
        lessonType: "Lecture",
        moduleCode: "CS2040S",
      },
    ],
  },
};
