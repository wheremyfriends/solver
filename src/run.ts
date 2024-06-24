import { getOptimisedTimetable } from "./index";
import { timetable } from "../timetables/input";

const NUMSOLS = 1;
const INDEX = 0;
const TIMETABLES = [timetable];

const res = getOptimisedTimetable(TIMETABLES, INDEX, NUMSOLS);
console.log({ res });
