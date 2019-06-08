
import * as moment from 'moment';
import { RecurringTaskRepitition } from './recurring-task-form/rt-repititions/recurring-task-repitition.interface';
import { DailyTaskListItem } from '../../tools/tool-components/dtl-tool/daily-task-list-item.class';


export class RecurringTaskDefinition{

    public get httpSave(): any {
        return {
            userId: this.userId,
            name: this.name,
            groupIds: this.groupIds,
            activityTreeId: this.activityTreeId,
            repititions: this.repititions,
        }
    }
    public get httpUpdate(): any {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            groupIds: this.groupIds,
            activityTreeId: this.activityTreeId,
            repititions: this.repititions,
        }
    }
    public get httpDelete(): any{ 
        return {
            id: this.id,
        }
    }
    id: string;
    userId: string;

    name: string;


    groupIds: string[] = [];
    //can group into a grouping for example "Morning"

    activityTreeId: string = "";
    //can be related to an activityTreeId


    
    repititions: RecurringTaskRepitition[] = [];


    constructor(id: string, userId: string, name: string, repititions: RecurringTaskRepitition[]){
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.repititions = repititions;
    }

    public hasTaskOnDate(date: moment.Moment): boolean{
        let hasTaskOnDate: boolean = false;
        for(let repitition of this.repititions){

            let start: moment.Moment = moment(repitition.startDate);
            if(start.format('YYYY-MM-DD') == date.format('YYYY-MM-DD')){
                return true;
            }
            let currentTime: moment.Moment = moment(start);            
            while(currentTime.isSameOrBefore(moment(date))){
                if(currentTime.format('YYYY-MM-DD') == moment(date).format('YYYY-MM-DD')){
                    hasTaskOnDate = true;
                    currentTime = moment(date);
                }
                currentTime = moment(currentTime).add(repitition.value, repitition.period);
            }
        }
        return hasTaskOnDate;
    }

    public dailyTaskChecklistItemsOnDate(date: moment.Moment): DailyTaskListItem[] {
        let dtlclItems: DailyTaskListItem[] = [];
        for(let repitition of this.repititions){
            let start: moment.Moment = moment(repitition.startDate);
            // let daysDifference:number = moment().diff(start, "days");
            let currentTime: moment.Moment = moment(start);            
            while(currentTime.isSameOrBefore(moment(date))){
                if(currentTime.format('YYYY-MM-DD') == moment(date).format('YYYY-MM-DD')){
                    dtlclItems.push( new DailyTaskListItem(this));
                    currentTime = moment(date);
                }
                currentTime = moment(currentTime).add(repitition.value, repitition.period);
            }
        }        
        return dtlclItems;
    }
}




