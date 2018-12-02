import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimelogService } from './timelog.service';
import { TimeMark } from './time-mark.model';
import { faTimes, faCog, faArrowCircleRight, faArrowCircleLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';

import * as moment from 'moment';
import { interval, Subscription, BehaviorSubject, Observable } from 'rxjs';

export interface ITimeMarkTile {
  timeMark: TimeMark,
  style: Object,
  deleteButtonIsVisible: boolean
}

@Component({
  selector: 'app-timelog',
  templateUrl: './timelog.component.html',
  styleUrls: ['./timelog.component.css']
})

export class TimelogComponent implements OnInit, OnDestroy {


  constructor(private timeLogService: TimelogService) { }



  faTimes = faTimes;
  faCog = faCog;
  faArrowCircleRight = faArrowCircleRight;
  faArrowCircleLeft = faArrowCircleLeft;
  faSpinner = faSpinner;

  ifLoadingTimeMarks: boolean;
  addTimeMarkForm: boolean = false;

  private _thisMonthsTimeMarks$: BehaviorSubject<TimeMark[]> = new BehaviorSubject<TimeMark[]>(null);
  // private _thisDaysTimeMarks$: BehaviorSubject<TimeMark[]> = new BehaviorSubject<TimeMark[]>(null);
  private _currentDate$: BehaviorSubject<moment.Moment> = new BehaviorSubject<moment.Moment>(moment());

  thisDayCardStyle = {};

  timeMarkTiles: ITimeMarkTile[] = [];
  private defaultTimeMarkTileStyle: Object;


  ngOnInit() {
    this.ifLoadingTimeMarks = true;
    this.defaultTimeMarkTileStyle = {};

    this._currentDate$.subscribe((date) => {
      this.buildThisDaysTimeMarkTiles();

    })


    // this._thisDaysTimeMarks$.subscribe((timeMarks) => {
    //   this.buildThisDaysTimeMarkTiles(this.currentDate);
    // })

    this._thisMonthsTimeMarks$.subscribe((timeMarks: TimeMark[]) => {
      // let thisDaysTimeMarks: TimeMark[] = [];
      // if (timeMarks != null) {
      //   for (let timeMark of timeMarks) {
      //     if (timeMark.startTime.dayOfYear() == this.currentDate.dayOfYear() || timeMark.endTime.dayOfYear() == this.currentDate.dayOfYear()) {
      //       thisDaysTimeMarks.push(timeMark);
      //     }
      //   }
      // }
      this.buildThisDaysTimeMarkTiles();
      // this._thisDaysTimeMarks$.next(thisDaysTimeMarks);
    })

    this.timeLogService.timeMarks$.subscribe((timeMarks: TimeMark[]) => {
      if (timeMarks != null) {
        this._thisMonthsTimeMarks$.next(timeMarks);
      }
    });
    this.timeLogService.timeMarkUpdatesInterval(moment(this.currentDate).startOf('month'), moment(this.currentDate).endOf('month'));
  }
  ngOnDestroy() {

  }

  get currentDate$(): Observable<moment.Moment> {
    return this._currentDate$.asObservable();
  }

  get currentDate(): moment.Moment {
    return this._currentDate$.getValue();
  }

  get latestTimeMark(): TimeMark {
    return this.timeLogService.latestTimeMark;
  }

  get thisDate(): string {
    return this.currentDate.format('YYYY-MM-DD');
  }
  get thisDatePlusOne(): string {
    return moment(this.currentDate).add(1, 'days').format('YYYY-MM-DD');
  }
  get thisDateMinusOne(): string {
    return moment(this.currentDate).subtract(1, 'days').format('YYYY-MM-DD');
  }

  onClickNewTimeMark() {
    this.addTimeMarkForm = true;
  }
  onCloseForm() {
    this.addTimeMarkForm = false;
  }

  private buildThisDaysTimeMarkTiles(): void {
    let timeMarkTiles: ITimeMarkTile[] = [];
    let thisMonthsTimeMarks = this._thisMonthsTimeMarks$.getValue();
    if (thisMonthsTimeMarks != null) {
      for (let timeMark of thisMonthsTimeMarks) {
        if (timeMark.startTime.dayOfYear() == this.currentDate.dayOfYear() || timeMark.endTime.dayOfYear() == this.currentDate.dayOfYear()) {
          let timeMarkTile: ITimeMarkTile = { timeMark: timeMark, style: this.defaultTimeMarkTileStyle, deleteButtonIsVisible: false };
          timeMarkTiles.push(timeMarkTile);
        }
      }
    }
    this.timeMarkTiles = timeMarkTiles;
    this.ifLoadingTimeMarks = false;

  }

  // private getThisDaysTimeMarks(thisDay: moment.Moment, timeMarks: TimeMark[]): TimeMark[] {
  //   let thisDaysTimeMarks: TimeMark[] = [];
  //   if (timeMarks) {
  //     for (let timeMark of timeMarks) {
  //       /*
  //         2018-11-23:
  //         moment(undefined) produces the same result as moment().
  //         therefore, if we pass it something that looks like this(moment(timeMark.startTimeISO)) where startTimeISO is undefined,
  //         then it will just use todays date which causes problems for these purposes.

  //         so we have to check that start time is defined.
  //       */
  //       if(timeMark.startTimeISO){
  //         let isStartTimeToday: boolean = moment(timeMark.startTimeISO).local().format('YYYY-MM-DD') == moment(thisDay).format('YYYY-MM-DD');
  //         let isEndTimeToday: boolean = moment(timeMark.endTimeISO).local().format('YYYY-MM-DD') == moment(thisDay).format('YYYY-MM-DD');
  //         if (isStartTimeToday || isEndTimeToday) {
  //           thisDaysTimeMarks.push(timeMark);
  //         }
  //       }else{
  //         console.log("time mark startTime is not defined.", timeMark)
  //       }


  //     }
  //   }
  //   return thisDaysTimeMarks;
  // }

  onMouseEnterTimeMarkTile(timeMarkTile: ITimeMarkTile) {
    timeMarkTile.deleteButtonIsVisible = true;
  }

  onMouseLeaveTimeMarkTile(timeMarkTile: ITimeMarkTile) {
    timeMarkTile.deleteButtonIsVisible = false;
  }

  onClickDeleteTimeMark(timeMark: TimeMark) {
    //to do:  when clicked, prompt for a confirmation:  "Delete this time mark?"
    this.timeLogService.deleteTimeMark(timeMark);
  }

  onClickAdjacentDate(dateYYYYMMDD: string) {
    this.timeMarkTiles = null;
    this.ifLoadingTimeMarks = true;
    this._currentDate$.next(moment(dateYYYYMMDD))
    // this.currentDate = moment(dateYYYYMMDD);

    this.onCloseForm();
  }
  onDateChange(calendarDate) {
    this._currentDate$.next(moment(calendarDate))
    // console.log("Date changed by calendar: ", moment(something).toISOString());
  }

  dateNotGreaterThanToday(dateYYYYMMDD: string): boolean {
    if (moment().format('YYYY-MM-DD') < moment(dateYYYYMMDD).format('YYYY-MM-DD')) {
      return false;
    } else {
      return true;
    }
  }

  dateRelevanceToTodayString(dateYYYYMMDD: string): string {
    //Used by the template to input any date and return a colloquialism relative to Today
    if (moment(dateYYYYMMDD).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
      return "Today";
    } else if (moment(dateYYYYMMDD).format('YYYY-MM-DD') == moment().add(1, 'days').format('YYYY-MM-DD')) {
      return "Tomorrow";
    } else if (moment(dateYYYYMMDD).format('YYYY-MM-DD') == moment().add(-1, 'days').format('YYYY-MM-DD')) {
      return "Yesterday";
    } else if (moment(dateYYYYMMDD).isBefore(moment().startOf('day'))) {
      let duration = moment.duration(moment().startOf('day').diff(dateYYYYMMDD));
      let days = duration.asDays().toFixed(0);
      return "" + days + " days ago";
    } else if (moment(dateYYYYMMDD).isAfter(moment().endOf('day'))) {
      let duration = moment.duration(moment(dateYYYYMMDD).diff(moment().startOf('day')));
      let days = duration.asDays().toFixed(0);
      return "" + days + " days from today";
    }
  }

  dayOfWeek(dateYYYYMMDD: string): string {
    return moment(dateYYYYMMDD).format('dddd');
  }
  dayOfMonth(dateYYYYMMDD: string): string {
    return moment(dateYYYYMMDD).format('MMM Do');
  }

  dateFormattedDateString(dateYYYYMMDD: string): string {
    //Used by template to input any date and receive back a formatted date string 
    return moment(dateYYYYMMDD).format('dddd, MMMM Do, gggg');
  }
  dateFormattedDateStringShort(dateYYYYMMDD: string): string {
    //Used by template to input any date and receive back a formatted date string 
    return moment(dateYYYYMMDD).format('MMMM Do, gggg');
  }

  dateIsToday(dateYYYYMMDD: string): boolean {
    //Used by template to check if provided date string is Today
    return (moment().format('YYYY-MM-DD') == dateYYYYMMDD);
  }

}
