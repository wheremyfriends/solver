type TimeSlot = {
    moduleCode: string;
    lessonType: string;
    classNo: string;
    startTime: string;
    endTime: string;
    day: string;
    [key: string]: any;
};

declare function getOptimisedTimetable(timetables: TimeSlot[][], index: number, maxSols?: number): TimeSlot[][];

export { getOptimisedTimetable };
