import * as moment from 'moment';
import { timer, Subscription } from 'rxjs';
import { DurationString } from '../../../../../shared/utilities/duration-string.class';
import { SleepBatteryConfiguration } from '../../sleep-battery/sleep-battery-configuration.interface';
import { SleepQuality } from './form-sections/wakeup-section/sleep-quality.enum';
import { DaybookDayItem } from '../../../api/daybook-day-item.class';
import { DaybookDayItemSleepProfile } from '../../../api/data-items/daybook-day-item-sleep-profile.interface';
import { TimeOfDay } from '../../../../../shared/utilities/time-of-day-enum';
import { ActivityCategoryDefinition } from '../../../../activities/api/activity-category-definition.class';
import { DaybookDayItemScheduledActivity } from '../../../api/data-items/daybook-day-item-scheduled-activity.class';

import { TimelogEntryFormSection, TimelogEntryFormSectionType } from './timelog-entry-form-section/timelog-entry-form-section.class';

export class TimelogEntryForm {

    private userName: string = "Jeremy";

    static readonly defaultWakeupTime: moment.Moment = moment().hour(7).minute(0).second(0).millisecond(0);
    static readonly defaultBedtime: moment.Moment = moment().hour(22).minute(30).second(0).millisecond(0);
    static readonly defaultpreviousFallAsleepTime: moment.Moment = moment(TimelogEntryForm.defaultBedtime).subtract(1, "days");

    private activeDay: DaybookDayItem;

    constructor(activeDay: DaybookDayItem) {
        this.activeDay = activeDay;
        this.setSleepParameters();
        this.updateTimes();
        this.rebuildFormSections();

        timer(0, 1000).subscribe((tick) => {
            this._currentTime = moment();
            if (this.currentTime.hour() < 12) {
                this._message = "Good morning " + this.userName;
            } else if (this.currentTime.hour() >= 12 && this.currentTime.hour() < 18) {
                this._message = "Good afternoon " + this.userName;
            } else if (this.currentTime.hour() >= 18) {
                this._message = "Good evening " + this.userName;
            }
        });
        timer(0, 60000).subscribe((tick) => {
            this.updateTimes();
        });
    }

    private _formSections: TimelogEntryFormSection[] = [];
    public get formSections(): TimelogEntryFormSection[] {
        return this._formSections;
    }

    private rebuildFormSections() {
        let formSections: TimelogEntryFormSection[] = [];

        let wakeupSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.WakeupSection, "Wakeup");
        if(this.activeDay.sleepProfile.previousFallAsleepTimeISO && this.activeDay.sleepProfile.wakeupTimeISO){
            wakeupSection.isComplete = true;
            wakeupSection.title = this.wakeupTime.format("h:mm a") + " wakeup";
        }
        formSections.push(wakeupSection);

        let earlyMorningSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.TimeOfDaySection, "Early morning");
        earlyMorningSection.scheduledActivities = this.activeDay.scheduledActivities.filter((scheduledActivity: DaybookDayItemScheduledActivity) => {
            return scheduledActivity.activityDefinition.scheduleConfiguration.timeOfDay == TimeOfDay.EarlyMorning;
        });
        if(earlyMorningSection.scheduledActivities.length > 0){
            let sectionIsComplete: boolean = true;
            earlyMorningSection.scheduledActivities.forEach((activity)=>{
                if(!activity.isComplete){
                    sectionIsComplete = false;
                }
            })
            earlyMorningSection.isComplete = sectionIsComplete;
            formSections.push(earlyMorningSection);
        }
        

        let morningSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.TimeOfDaySection, "Morning");
        morningSection.scheduledActivities = this.activeDay.scheduledActivities.filter((scheduledActivity: DaybookDayItemScheduledActivity) => {
            return scheduledActivity.activityDefinition.scheduleConfiguration.timeOfDay == TimeOfDay.Morning;
        });
        if(morningSection.scheduledActivities.length > 0){
            let sectionIsComplete: boolean = true;
            morningSection.scheduledActivities.forEach((activity)=>{
                if(!activity.isComplete){
                    sectionIsComplete = false;
                }
            })
            morningSection.isComplete = sectionIsComplete;
            formSections.push(morningSection);
        }

        let afternoonSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.TimeOfDaySection, "Afternoon");
        afternoonSection.scheduledActivities = this.activeDay.scheduledActivities.filter((scheduledActivity: DaybookDayItemScheduledActivity) => {
            return scheduledActivity.activityDefinition.scheduleConfiguration.timeOfDay == TimeOfDay.Afternoon;
        });
        if(afternoonSection.scheduledActivities.length > 0){
            let sectionIsComplete: boolean = true;
            afternoonSection.scheduledActivities.forEach((activity)=>{
                if(!activity.isComplete){
                    sectionIsComplete = false;
                }
            })
            afternoonSection.isComplete = sectionIsComplete;
            formSections.push(afternoonSection);
        }

        let eveningSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.TimeOfDaySection, "Evening");
        eveningSection.scheduledActivities = this.activeDay.scheduledActivities.filter((scheduledActivity: DaybookDayItemScheduledActivity) => {
            return scheduledActivity.activityDefinition.scheduleConfiguration.timeOfDay == TimeOfDay.Evening;
        });
        if(eveningSection.scheduledActivities.length > 0){
            let sectionIsComplete: boolean = true;
            eveningSection.scheduledActivities.forEach((activity)=>{
                if(!activity.isComplete){
                    sectionIsComplete = false;
                }
            })
            eveningSection.isComplete = sectionIsComplete;
            formSections.push(eveningSection);
        }
        /**
         * Not handled:  
         *  TimeOfDay.Any , or 
         *  TimeOfDay.SpecifiedRange, or 
         *  TimeOfDay.Variates
         */

        let bedtimeSection: TimelogEntryFormSection = new TimelogEntryFormSection(TimelogEntryFormSectionType.BedtimeSection, "Bedtime");
        if(this.activeDay.sleepProfile.bedtimeISO){
            bedtimeSection.isComplete = true;
            bedtimeSection.title = this.bedtime.format("h:mm a") + " bedtime";
        }
        formSections.push(bedtimeSection);

        this._formSections = formSections;
        this.updateFormSaveSubscriptions();
    }

    private _formSectionSaveSubscriptions: Subscription[] = [];
    private updateFormSaveSubscriptions(){
        this._formSectionSaveSubscriptions.forEach((sub)=>{sub.unsubscribe()});
        this._formSectionSaveSubscriptions = [];
        this.formSections.forEach((formSection)=>{
            let newSub = formSection.onSaveChanges$.subscribe((onSaveChanges)=>{
                this.updateScheduledActivities(formSection);        
            });
            this._formSectionSaveSubscriptions.push(newSub);
        });
    }

    private updateScheduledActivities(formSection: TimelogEntryFormSection){
        console.log("Updating form section data,", formSection.scheduledActivities);
        let formSectionIsComplete: boolean = true;
        formSection.scheduledActivities.forEach((scheduledActivity: DaybookDayItemScheduledActivity)=>{
            if(scheduledActivity.isRoutine){
                scheduledActivity.updateFullRoutineCompletionStatus();
            }else if(!scheduledActivity.isRoutine){

            }
            if(!scheduledActivity.isComplete){
                formSectionIsComplete = false;
            }
        });
        
        this.activeDay.updateScheduledActivityItems(formSection.scheduledActivities.map((item)=>{
            return item.scheduledActivityItem;
        }));
        formSection.isComplete = formSectionIsComplete;
    }



    private setSleepParameters() {
        if (this.activeDay.sleepProfile.bedtimeISO) {
            // console.log("Setting bed time to: ", this.activeDay.sleepProfile.bedtimeISO)
            this._bedTime = moment(this.activeDay.sleepProfile.bedtimeISO);
    
        }
        if (this.activeDay.sleepProfile.previousFallAsleepTimeISO) {
            // console.log("setting fall asleep time to: ", this.activeDay.sleepProfile.previousFallAsleepTimeISO)
            this._lastNightFallAsleepTime = moment(this.activeDay.sleepProfile.previousFallAsleepTimeISO);
        }
        if (this.activeDay.sleepProfile.wakeupTimeISO) {
            // console.log("setting wakeup time: ", this.activeDay.sleepProfile.wakeupTimeISO);
            this._wakeupTime = moment(this.activeDay.sleepProfile.wakeupTimeISO);
        }
        this._sleepQuality = this.activeDay.sleepProfile.sleepQuality;
    }

    public updateActiveDay(activeDay: DaybookDayItem) {
        this.activeDay = activeDay;
    }

    private _message: string = "";
    public get message(): string {
        return this._message;
    }

    private _currentTime = moment();
    public get currentTime(): moment.Moment {
        return moment(this._currentTime);
    }

    private _bedTime: moment.Moment = moment(TimelogEntryForm.defaultBedtime);
    private _timeUntilBedtime: string = "";
    public get timeUntilBedtime(): string {
        return this._timeUntilBedtime;
    }
    public get bedtime(): moment.Moment {
        return moment(this._bedTime);
    }
    public get wakeupTime(): moment.Moment {
        return moment(this._wakeupTime);
    }
    public get bedtimeUtcOffsetMinutes(): number{
        return this.activeDay.sleepProfile.bedtimeUtcOffsetMinutes;
    }
    public get bedtimeISO(): string{
        return this.activeDay.sleepProfile.bedtimeISO;
    }
    public get sleepProfile(): DaybookDayItemSleepProfile{
        return this.activeDay.sleepProfile;
    }

    private _wakeupTime: moment.Moment = moment(TimelogEntryForm.defaultWakeupTime);
    private _timeSinceWakeup: string = "";
    public get timeSinceWakeup(): string {
        return this._timeSinceWakeup;
    }
    public get wakeupTimeHHmm(): string {
        return this._wakeupTime.format("HH:mm");
    }

    private _lastNightFallAsleepTime: moment.Moment = moment(TimelogEntryForm.defaultpreviousFallAsleepTime);
    public get lastNightFallAsleepTimeHHmm(): string {
        return this._lastNightFallAsleepTime.format("HH:mm");
    }
    public get lastNightFallAsleepTime(): moment.Moment {
        return moment(this._lastNightFallAsleepTime);
    }

    public get wakeupTimeIsSet(): boolean {
        return this.activeDay.sleepProfile.wakeupTimeISO != "";
    }
    public get previousFallAsleepTimeIsSet(): boolean {
        return this.activeDay.sleepProfile.previousFallAsleepTimeISO != "";
    }
    public get bedtimeIsSet(): boolean {
        return this.activeDay.sleepProfile.bedtimeISO != "";
    }
    public get wakeupSectionIsComplete(): boolean {
        return this.activeDay.sleepProfile.wakeupTimeISO != "" && this.activeDay.sleepProfile.previousFallAsleepTimeISO != "";
    }
    public get sleepQualityIsComplete(): boolean{
        return this.activeDay.sleepProfile.sleepQuality != null;
    }

    public onClickSaveSleepProfile(sleepProfile: DaybookDayItemSleepProfile) {
        if(sleepProfile.wakeupTimeISO){
            this._wakeupTime = moment(sleepProfile.wakeupTimeISO);
        }
        if(sleepProfile.previousFallAsleepTimeISO){
            this._lastNightFallAsleepTime = moment(sleepProfile.previousFallAsleepTimeISO);
        }
        if(sleepProfile.bedtimeISO){
            this._bedTime = moment(sleepProfile.bedtimeISO);
        }
        this.updateTimes();
        this.activeDay.sleepProfile = sleepProfile;
    }



    private _sleepQuality: SleepQuality = SleepQuality.Okay;
    public set sleepQuality(sleepQuality: SleepQuality) {
        this._sleepQuality = sleepQuality;
    }
    public get sleepQuality(): SleepQuality {
        return this._sleepQuality;
    }
    public get sleepDuration(): string {
        return DurationString.calculateDurationString(this.lastNightFallAsleepTime, this.wakeupTime);
    }
    public get sleepDurationShort(): string {
        return DurationString.calculateDurationString(this.lastNightFallAsleepTime, this.wakeupTime, true);
    }





    private updateTimes() {

        if (this.currentTime.hour() < 12) {
            this._message = "Good morning " + this.userName;
        } else if (this.currentTime.hour() >= 12 && this.currentTime.hour() < 18) {
            this._message = "Good afternoon " + this.userName;
        } else if (this.currentTime.hour() >= 18) {
            this._message = "Good evening " + this.userName;
        }


        let timeUntilBedtime = "";
        if (this.currentTime.isBefore(this._bedTime)) {
            timeUntilBedtime = DurationString.calculateDurationString(this.currentTime, this._bedTime, true) + " remaining";
        } else {
            timeUntilBedtime = DurationString.calculateDurationString(this._bedTime, this.currentTime, true) + " past pedtime";
        }
        this._timeUntilBedtime = timeUntilBedtime;

        let timeSinceWakeup = "";
        if (this.currentTime.isBefore(this._wakeupTime)) {
            timeSinceWakeup = "";
        } else if (this.currentTime.isAfter(this._wakeupTime)) {
            console.log("WOKE UP AT: ", this._wakeupTime.format('YYYY-MM-DD hh:mm a'))
            console.log("CURRENT TIME: ", this._currentTime.format('YYYY-MM-DD hh:mm a'))
            timeSinceWakeup = DurationString.calculateDurationString(this._wakeupTime, this.currentTime, true);
        }
        this._timeSinceWakeup = timeSinceWakeup;
        this.updateBatteryConfiguration();
    }

    private updateBatteryConfiguration() {
        let batteryConfiguration: SleepBatteryConfiguration = {
            wakeupTime: this.wakeupTime,
            bedtime: this.bedtime,
        }
        this._batteryConfiguration = batteryConfiguration;
    }

    private _batteryConfiguration: SleepBatteryConfiguration = null;
    public get batteryConfiguration(): SleepBatteryConfiguration {
        return this._batteryConfiguration;
    }

}