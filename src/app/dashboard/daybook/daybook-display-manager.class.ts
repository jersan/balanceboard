import { DaybookTimeSchedule } from './api/daybook-time-schedule/daybook-time-schedule.class';
import * as moment from 'moment';
import { TLEFController } from './widgets/timelog/timelog-entry-form/TLEF-controller.class';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { TimelogZoomController } from './widgets/timelog/timelog-large-frame/timelog-zoom-controller/timelog-zoom-controller.class';
import { SleepCycleScheduleItemsBuilder } from './sleep-manager/sleep-cycle/sleep-cycle-schedule-items-builder.class';
import { DaybookTimeScheduleItem } from './api/daybook-time-schedule/daybook-time-schedule-item.class';
import { TimelogZoomType } from './widgets/timelog/timelog-large-frame/timelog-zoom-controller/timelog-zoom-type.enum';
import { ToolboxService } from '../../toolbox-menu/toolbox.service';
import { ActivityHttpService } from '../activities/api/activity-http.service';
import { TimelogDelineator, TimelogDelineatorType } from './widgets/timelog/timelog-large-frame/timelog-body/timelog-delineator.class';
import { DaybookDelineatorSetter } from './api/daybook-delineator-setter.class';
import { DaybookTimeScheduleAvailableItem } from './api/daybook-time-schedule/daybook-time-schedule-available-item.class';
import { DaybookTimeScheduleStatus } from './api/daybook-time-schedule/daybook-time-schedule-status.enum';
import { DaybookTimeScheduleActiveItem } from './api/daybook-time-schedule/daybook-time-schedule-active-item.class';
import { DaybookTimeScheduleSleepItem } from './api/daybook-time-schedule/daybook-time-schedule-sleep-item.class';
import { TimeSelectionColumn } from './widgets/timelog/timelog-large-frame/timelog-body/time-selection-column/time-selection-column.class';
import { TimelogDisplayGrid } from './widgets/timelog/timelog-large-frame/timelog-body/timelog-display-grid-class';

export class DaybookDisplayManager {
    /**
     *  This class is responsible managing everything related to the display of daybook
     *
     *  Key components of the Daybook, including:
     *  -TimeSelectionColumn component,
     *  -TimelogBody component / (TimelogDisplayGrid)
     *  -Timelog Entry Form Controller, AKA TLEF component / TLEF controller
     *
     *
     *  This class has a DaybookTimeScheduleProperty which it receives from DaybookDisplayService
     *  This class is a property of DaybookDisplayService
     *
     *  All daybook and timelog components that need to coordinate with the current display
     *  will access this class through the DaybookDisplayService
     */
    constructor(toolboxService: ToolboxService, activityService: ActivityHttpService) {
        this._toolboxService = toolboxService;
        this._activityService = activityService;
    }



    private _tlefController: TLEFController;
    private _timelogDisplayGrid: TimelogDisplayGrid;
    private _schedule: DaybookTimeSchedule;
    private _sleepCycle: SleepCycleScheduleItemsBuilder;
    private _toolboxService: ToolboxService;
    private _activityService: ActivityHttpService;
    private _timeSelectionColumn: TimeSelectionColumn;

    private _zoomController: TimelogZoomController;

    private _displayItems: DaybookTimeScheduleItem[] = [];
    private _displayDelineators: TimelogDelineator[] = [];
    // private _currentlyOpenItemIndex$: BehaviorSubject<number> = new BehaviorSubject(-1);

    public get displayItems(): DaybookTimeScheduleItem[] { return this._displayItems; }
    public get displayItemsAvailable(): DaybookTimeScheduleItem[] {
        return this.displayItems.filter(i => i.scheduleStatus === DaybookTimeScheduleStatus.AVAILABLE);
    }
    public get displayItemsActive(): DaybookTimeScheduleItem[] {
        return this.displayItems.filter(i => i.scheduleStatus === DaybookTimeScheduleStatus.ACTIVE);
    }
    public get displayItemsSleep(): DaybookTimeScheduleItem[] {
        return this.displayItems.filter(i => i.scheduleStatus === DaybookTimeScheduleStatus.SLEEP);
    }
    public get displayDelineators(): TimelogDelineator[] { return this._displayDelineators; }

    public get tlefController(): TLEFController { return this._tlefController; }
    public get timelogDisplayGrid(): TimelogDisplayGrid { return this._timelogDisplayGrid; }
    public get timeSelectionColumn(): TimeSelectionColumn { return this._timeSelectionColumn; }

    public get displayEndTime(): moment.Moment { return this._zoomController.displayEndTime; }
    public get displayStartTime(): moment.Moment { return this._zoomController.displayStartTime; }
    public get wakeupTime(): moment.Moment { return this._sleepCycle.previousWakeupTime; }
    public get fallAsleepTime(): moment.Moment { return this._sleepCycle.nextFallAsleepTime; }
    public get displayDurationMs(): number { return this._zoomController.displayDurationMs; }
    public get zoomController(): TimelogZoomController { return this._zoomController; }

    public openNewCurrentTimelogEntry() { this.tlefController.openNewCurrentTimelogEntry(); }


    public openTLEDelineator(delineator: TimelogDelineator) { this.tlefController.openTLEDelineator(delineator); }

    public openItemByIndex(itemIndex: number) {
        console.log("Opening item: " + itemIndex);
        this.timelogDisplayGrid.openItemByIndex(itemIndex);
        this.tlefController.openItemByIndex(itemIndex);
        const foundItem = this.displayItems.find(item => item.itemIndex === itemIndex);
        if(foundItem){
            if(foundItem.isSleepItem){
                this._toolboxService.openSleepEntryForm();
            }else{
                this._toolboxService.openTimelogEntryForm();
            }
        }else{
            console.log("Error opening item by index: " + itemIndex);
        }
    }
    // public get currentlyOpenItemIndex(): number { return this._currentlyOpenItemIndex$.getValue(); }
    // public get currentlyOpenItemIndex$(): Observable<number> { return this._currentlyOpenItemIndex$.asObservable(); }

    public updateDisplayManager(timeSched: DaybookTimeSchedule, sleepCycle: SleepCycleScheduleItemsBuilder) {
        console.log('****** DaybookDisplayManager.updateDisplayManager()')
        this._schedule = timeSched;
        this._sleepCycle = sleepCycle;
        if (!this._zoomController) {
            this._zoomController = new TimelogZoomController(timeSched, sleepCycle);
        } else {
            this._zoomController.update(timeSched, sleepCycle);
        }
        // console.log("DISPLAY MS IS " + this.displayDurationMs)
        // console.log("DISPLAY TIME IS " + this.displayStartTime.format('hh:mm a') + " to " + this.displayEndTime.format('hh:mm a'))
        this._displayItems = this._schedule.getItemsInRange(this.displayStartTime, this.displayEndTime);
        this._displayItems.forEach(di => di.setDisplayPercent(this.displayDurationMs));
        this._setDisplayDelineators();
        this._updateTimeSelectionColumn();
        this._updateTimelogDisplayGrid();
        this._updateTlefController();
    }
    public onZoomChanged(zoom: TimelogZoomType) {
        this._zoomController.setZoom(zoom);
        this._displayItems = this._schedule.getItemsInRange(this.displayStartTime, this.displayEndTime);
    }

    private _updateTimeSelectionColumn() {
        console.log('DaybookDisplayManager._updateTimeSelectionColumn()')

        this.displayItems.forEach(i => console.log(" display item: " + i.toString()))

        this._timeSelectionColumn = new TimeSelectionColumn(this.displayDelineators, this.displayItemsAvailable);

        this.displayItems.forEach(i => console.log(" display item: " + i.toString()))

    }
    private _updateTimelogDisplayGrid() {
        console.log('DaybookDisplayManager._updateTimelogDisplayGrid()')
        if (!this._timelogDisplayGrid) {
            this._timelogDisplayGrid = new TimelogDisplayGrid(this._displayItems);
        } else {
            this._timelogDisplayGrid.update(this._displayItems);
        }
    }
    private _updateTlefController() {
        console.log('DaybookDisplayManager._updateTlefController()')
        if (!this._tlefController) {
            this._tlefController = new TLEFController(this._displayItems, this._activityService.activityTree);
        } else {
            this._tlefController.update(this._displayItems);
        }
    }


    private _setDisplayDelineators() {
        console.log("* Delineators")
        const delineatorSetter = new DaybookDelineatorSetter(this._displayItems);
        this._displayDelineators = delineatorSetter.displayDelineators;
        this._displayItems = delineatorSetter.displayItems;
        // console.log("YEA BRO")
        this._displayDelineators.forEach(item => console.log("  " + item.toString()))
        // console.log('\n');
        // console.log('DISPLAY ITEMS BRAH');
        // this._displayItems.forEach(item => console.log('  ' + item.toString()));
    }



}
