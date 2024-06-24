import { getOptimisedTimetable } from "./index";
import { timetable } from "../timetables/input";
import { Roarr as log } from "roarr";

const NUMSOLS = 1;
const INDEX = 0;
const TIMETABLES = [timetable];

const res = getOptimisedTimetable(TIMETABLES, INDEX, NUMSOLS);
log(Object(res), "res");
