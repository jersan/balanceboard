import { Injectable } from '@angular/core';
import { DaybookHttpRequestService } from './api/daybook-http-request.service';
import { BehaviorSubject, Observable, Subject, timer, Subscription } from 'rxjs';
import * as moment from 'moment';
import { DaybookDayItem } from './api/daybook-day-item.class';
import { AuthStatus } from '../../authentication/auth-status.class';
import { DayTemplatesService } from '../scheduling/day-templates/day-templates.service';
import { ServiceAuthenticates } from '../../authentication/service-authentication/service-authenticates.interface';
import { ScheduleRotationsService } from '../scheduling/schedule-rotations/schedule-rotations.service';
import { RoutineDefinitionService } from '../activities/routines/api/routine-definition.service';
import { ActivityCategoryDefinitionService } from '../activities/api/activity-category-definition.service';


@Injectable({
  providedIn: 'root'
})
export class DaybookService implements ServiceAuthenticates {

  constructor(
    private daybookHttpRequestService: DaybookHttpRequestService,
    private scheduleRotationService: ScheduleRotationsService,
    private routineDefinitionService: RoutineDefinitionService,
    private activitiesService: ActivityCategoryDefinitionService,
    private dayTemplatesService: DayTemplatesService,
  ) { }

  public killKillKill() {
    console.log(" Kill kill kill ")
    this.daybookHttpRequestService.killKillKill();
  }

  private _authStatus: AuthStatus;
  private _daybookDayItems$: BehaviorSubject<DaybookDayItem[]> = new BehaviorSubject([]);
  private _loginComplete$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _allSubscriptions: Subscription[] = [];

  public login$(authStatus: AuthStatus): Observable<boolean> {
    this._authStatus = authStatus;
    if (this.daybookHttpRequestService.daybookDayItems.length == 0) {
      this.startANewDay(this._todayYYYYMMDD);
    }
    this._allSubscriptions.push(this.daybookHttpRequestService.daybookDayItems$.subscribe((daybookDayItems: DaybookDayItem[]) => {
      if (daybookDayItems.length > 0) {
        this._daybookDayItems$.next(daybookDayItems);
        this.initiateClock();
      }
    }));
    this._allSubscriptions.push(this.activitiesService.activitiesTree$.subscribe((changedTree) => {
      this.updateActivityItems(changedTree);
    }));

    return this._loginComplete$.asObservable();
  }

  public logout() {
    this._authStatus = null;
    this._activeDay$.next(null);
    this._today$.next(null);

    this._daybookDayItems$.next([]);
    this._activeDayYYYYMMDD = this._todayYYYYMMDD;
    this._clock = null;
    this.clockSubscription.unsubscribe();
    this._allSubscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    this._allSubscriptions = [];
  }



  private _clock$: BehaviorSubject<moment.Moment> = new BehaviorSubject(moment());
  public get clock$(): Observable<moment.Moment> { return this._clock$.asObservable(); }
  public get clock(): moment.Moment { return this._clock$.getValue(); }
  private set _clock(time: moment.Moment) { this._clock$.next(time); }

  private _todayYYYYMMDD: string = moment().format("YYYY-MM-DD");
  private _today$: BehaviorSubject<DaybookDayItem> = new BehaviorSubject(null);
  public get today$(): Observable<DaybookDayItem> {
    return this._today$.asObservable();
  }
  public get today(): DaybookDayItem {
    return this._today$.getValue();
  }

  public get activeDayIsToday(): boolean {
    return this._activeDayYYYYMMDD == moment().format("YYYY-MM-DD");
  }

  private _activeDayYYYYMMDD: string = moment().format("YYYY-MM-DD");
  private _activeDay$: BehaviorSubject<DaybookDayItem> = new BehaviorSubject(null);
  public get activeDay$(): Observable<DaybookDayItem> {
    return this._activeDay$.asObservable();
  }
  public get activeDay(): DaybookDayItem {
    return this._activeDay$.getValue();
  }


  public set activeDayYYYYMMDD(changedDayYYYYMMDD: string) {
    console.log("Daybook service: changing the active date to: " + changedDayYYYYMMDD);
    this._activeDayYYYYMMDD = changedDayYYYYMMDD;
    this.updateTodayAndActiveDay(moment());
  }
  public get activeDayYYYYMMDD(): string {
    return this._activeDayYYYYMMDD;
  }


  private clockSubscription: Subscription = new Subscription();
  private initiateClock() {
    this.clockSubscription.unsubscribe();
    this._clock = moment();
    this.clockSubscription = timer(0, 1000).subscribe((second) => {
      this._clock = moment();
      if (this.clock.format("YYYY-MM-DD") != this._todayYYYYMMDD) {
        console.log("Its not the same day.  we passed midnight")
        this.updateTodayAndActiveDay(this.clock);
      }
    });
    this.updateTodayAndActiveDay(this.clock);
  }

  private updateTodayAndActiveDay(time: moment.Moment) {
    this._todayYYYYMMDD = moment(time).format("YYYY-MM-DD");
    let todayItem: DaybookDayItem = this.getDaybookDayItemByDate(this._todayYYYYMMDD);
    if (todayItem) {
      let newPreviousDay: DaybookDayItem;
      let newFollowingDay: DaybookDayItem;
      let saveNewDays: DaybookDayItem[] = [];
      if (!todayItem.previousDay) {
        newPreviousDay = this.buildNewDaybookDayItem(moment(todayItem.dateYYYYMMDD).subtract(1, "days").format("YYYY-MM-DD"));
        saveNewDays.push(newPreviousDay);
      }
      if (!todayItem.followingDay) {
        newFollowingDay = this.buildNewDaybookDayItem(moment(todayItem.dateYYYYMMDD).add(1, "days").format("YYYY-MM-DD"));
        saveNewDays.push(newFollowingDay);
      }
      if (saveNewDays.length > 0) {
        this.daybookHttpRequestService.saveMultipleDayItems(saveNewDays);
      } else {
        this._today$.next(todayItem);
      }
    } else {
      this.startANewDay(this._todayYYYYMMDD);
    }

    if (this._todayYYYYMMDD == this._activeDayYYYYMMDD) {
      this._activeDay$.next(this._today$.getValue());
    } else {
      let activeItem: DaybookDayItem = this.getDaybookDayItemByDate(this._activeDayYYYYMMDD);
      if (activeItem) {
        let newPreviousDay: DaybookDayItem;
        let newFollowingDay: DaybookDayItem;
        let saveNewDays: DaybookDayItem[] = [];
        if (!activeItem.previousDay) {
          newPreviousDay = this.buildNewDaybookDayItem(moment(activeItem.dateYYYYMMDD).subtract(1, "days").format("YYYY-MM-DD"));
          saveNewDays.push(newPreviousDay);
        }
        if (!activeItem.followingDay) {
          newFollowingDay = this.buildNewDaybookDayItem(moment(activeItem.dateYYYYMMDD).add(1, "days").format("YYYY-MM-DD"));
          saveNewDays.push(newFollowingDay);
        }
        if (saveNewDays.length > 0) {
          this.daybookHttpRequestService.saveMultipleDayItems(saveNewDays);
        } else {
          this._activeDay$.next(activeItem);
        }
      } else {
        console.log("daybook ****Warning: Starting a new Active day - Method disabled.");
        this.startANewDay(this._activeDayYYYYMMDD);
      }
    }
    // console.log("Daybook service login is complete.")
    this._loginComplete$.next(true);
    this.updateIsPastMidnight();
  }

  private getDaybookDayItemByDate(dateYYYYMMDD: string): DaybookDayItem {
    let foundDaybookDayItem: DaybookDayItem = this._daybookDayItems$.getValue().find((daybookDayItem: DaybookDayItem) => {
      return daybookDayItem.dateYYYYMMDD == dateYYYYMMDD;
    });
    if (foundDaybookDayItem) {
      return foundDaybookDayItem;
    } else {
      return null;
    }
  }

  private startANewDay(newDateYYYYMMDD: string): void {
    // console.log("***** Daybook:  Starting a new day: ", newDateYYYYMMDD);
    let newDay: DaybookDayItem = this.buildNewDaybookDayItem(newDateYYYYMMDD);
    let saveDays: DaybookDayItem[] = [newDay];
    let previousDaybookDayItem: DaybookDayItem = this.getDaybookDayItemByDate(moment(newDateYYYYMMDD).subtract(1, "day").format("YYYY-MM-DD"));
    let followingDaybookDayItem: DaybookDayItem = this.getDaybookDayItemByDate(moment(newDateYYYYMMDD).add(1, "day").format("YYYY-MM-DD"));
    if (!previousDaybookDayItem) {
      previousDaybookDayItem = this.buildNewDaybookDayItem(moment(newDateYYYYMMDD).subtract(1, "day").format("YYYY-MM-DD"));
      saveDays.push(previousDaybookDayItem);
    }
    if (!followingDaybookDayItem) {
      followingDaybookDayItem = this.buildNewDaybookDayItem(moment(newDateYYYYMMDD).add(1, "day").format("YYYY-MM-DD"));
      saveDays.push(followingDaybookDayItem);
    }
    this.daybookHttpRequestService.saveMultipleDayItems(saveDays);
  }

  private buildNewDaybookDayItem(dateYYYYMMDD: string): DaybookDayItem {
    // console.log("Building a new Daybook item: " , dateYYYYMMDD);
    let daybookDayItem: DaybookDayItem = new DaybookDayItem(dateYYYYMMDD);
    daybookDayItem.dayTemplateId = "placeholder:NO_DAY_TEMPLATE";
    daybookDayItem.dayStructureDataItems = this.scheduleRotationService.getDayStructureItemsForDate(dateYYYYMMDD);
    daybookDayItem.sleepStructureDataItems = this.scheduleRotationService.getSleepCycleItemsForDate(dateYYYYMMDD);
    daybookDayItem.setScheduledActivityItems(this.activitiesService.activitiesTree.buildScheduledActivityItemsOnDate(dateYYYYMMDD), this.activitiesService.activitiesTree);


    // console.log("Structure items: ", daybookDayItem.dayStructureDataItems)


    // daybookDayItem.dayTemplateId = this.scheduleRotationService.dayTemplateForD1ate(newDateYYYYMMDD).id;
    // console.log("daybookDayItem templateId", daybookDayItem.dayTemplateId);

    // let dailyTaskListItems: DailyTaskListDataItem[] = this.recurringTaskService.generateDailyTaskListItemsForDate(newDateYYYYMMDD);
    // if(dailyTaskListItems.length == 0){
    //   console.log("Setting and saving default task items");
    //   this.recurringTaskService.setAndSaveDefaultTaskItems$().subscribe((taskItems)=>{
    //     console.log("Forkjoin subscribed: new task items saved", taskItems);
    //     daybookDayItem.dailyTaskListDataItems = taskItems;
    //   })

    // }else if(dailyTaskListItems.length > 1){
    //   daybookDayItem.dailyTaskListDataItems = dailyTaskListItems;
    // }
    // console.log("daybook item built: " , daybookDayItem.dateYYYYMMDD)
    return daybookDayItem;

  }

  updateActivityItems(changedTree) {
    console.log("Method not implemented: update activity tree");
    /**
     * This method runs any time the activity tree changes.
     * When this happens, we need to ensure that the active day and following days have proper scheduled activity items.
     */
  }

  private updateIsPastMidnight() {
    /**
     * This method needs to be improved, right now it works adequately for functional purposes but needs to account for other variables eventually.
     * For example, maybe a person's day is defined as 3pm to 8am, for night-shift related reasons or whatever reason, and so in that case
     * what happens if it's 7:30 am and they have yet to go to bed?  In that case, we need to account for this circumstance
     */

    if(this.activeDayIsToday){
      let isAfterMidnight: boolean = false;
      if (this.clock.hour() >= 0 && this.clock.hour() <= 6) {
        isAfterMidnight = true;
      }
      this._isAwakeAfterMidnight = isAfterMidnight;
    }else{
      this._isAwakeAfterMidnight = false;
    }
    
  }

  private _isAwakeAfterMidnight: boolean = false;
  public get isAwakeAfterMidnight(): boolean { return this._isAwakeAfterMidnight; }


}
