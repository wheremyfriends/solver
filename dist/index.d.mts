type Coord = {
    lat: number;
    lon: number;
};
type VenueInfo = {
    [key: string]: Coord;
};
type Break = {
    minDuration: number;
    timeslots: {
        start: number;
        end: number;
    }[];
};
type Config = {
    maxSols: number;
    prefDays: number[];
    breaks: Break[];
    maxDist: number;
    venueInfo: VenueInfo;
};
type NUSModsLessons = {
    moduleCode: string;
    lessonType: string;
    classNo: string;
    startTime: string;
    endTime: string;
    day: string;
    venue: string;
    [key: string]: any;
};

declare function getOptimisedTimetable(timetables: NUSModsLessons[][], index: number, config?: Config): NUSModsLessons[][];

export { getOptimisedTimetable };
