import { TimeOfDay } from "../../../shared/utilities/time-utilities/time-of-day-enum";
import { TimeRange } from "../../../shared/utilities/time-utilities/time-range.interface";
import { DayOfWeek } from "../../../shared/utilities/time-utilities/day-of-week.enum";
import { TimeUnit } from "../../../shared/utilities/time-utilities/time-unit.enum";

export interface ActivityOccurrenceConfiguration{

    index: number;
    unit: TimeUnit;
    

    minutesPerOccurrence: number;
    timeOfDayQuarter: TimeOfDay;
    timeOfDayHour: number;
    timeOfDayMinute: number;


    timesOfDay: TimeOfDay[],
    timesOfDayRanges: TimeRange[],

    timesOfDayExcludedRanges: TimeRange[],

    daysOfWeek: DayOfWeek[],
    daysOfWeekExcluded: DayOfWeek[],

    daysOfYear: number[],
}