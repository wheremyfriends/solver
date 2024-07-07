enum Day {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export type Coord = {
  lat: number;
  lon: number;
};

export type VenueInfo = {
  [key: string]: Coord;
};

export type Break = {
  minDuration: number;
  timeslots: {
    start: number;
    end: number;
  }[];
};

export type Config = {
  maxSols: number;
  prefDays: number[];
  breaks: Break[];
  maxDist: number;
  venueInfo: VenueInfo;
};

export type Cls = {
  moduleCode: string;
  lessonType: string;
  classNo: string;
  priority: number;
  coord: Coord | undefined;
  timeslots: TS[];
};

// TS for TimeSlot
export type TS = {
  moduleCode: string;
  lessonType: string;
  classNo: string;
  startIndex: number;
  endIndex: number;
  dayIndex: Day;
  coord: Coord | undefined;
  [key: string]: any;
};

export type NUSModsLessons = {
  moduleCode: string;
  lessonType: string;
  classNo: string;
  startTime: string;
  endTime: string;
  day: string;
  venue: string;
  [key: string]: any;
};

export type Status = Cls | undefined;
