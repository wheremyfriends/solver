import { getOptimisedTimetable } from "./index";
import { timetable } from "../timetables/input";
import { Roarr as log } from "roarr";
import { venueInfo } from "../__mocks__/venues";
import { prettify } from "./utils";

const INDEX = 0;
const TIMETABLES = [timetable];
const CONFIG = {
  maxSols: 1,
  maxDist: -1,
  prefDays: [],
  breaks: [],
  venueInfo,
};

const res = getOptimisedTimetable(TIMETABLES, INDEX, CONFIG);
log(Object(res.map((classes) => prettify(classes))), "this.result");
log(`Length: ${res.length}`);
