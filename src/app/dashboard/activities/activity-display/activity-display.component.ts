import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { UserDefinedActivity } from '../user-defined-activity.model';
import { ActivitiesService } from '../activities.service';
import { Subscription } from 'rxjs';
import { IActivityInstance } from './activity-instance.interface';
import * as moment from 'moment';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { ActivityTree } from '../activity-tree.model';

@Component({
  selector: 'app-activity-display',
  templateUrl: './activity-display.component.html',
  styleUrls: ['./activity-display.component.css']
})
export class ActivityDisplayComponent implements OnInit, OnDestroy {

  faSpinner = faSpinner;
  faEdit = faEdit;

  constructor(private activitiesService: ActivitiesService) { }

  ifLoading: boolean = true;

  activityInstances: IActivityInstance[] = [];

  activity: UserDefinedActivity = null;

  private activityDataSubscription: Subscription = new Subscription();

  action: string = "view";

  @Output() displayClosed: EventEmitter<boolean> = new EventEmitter();

  @Input() set selectedActivity(activity: UserDefinedActivity){
    this.action = "view";
    this.activity = activity;
    this.getActivityData();
  }
  ngOnInit() {
    this.action = "view";

    this.activitiesService.activitiesTree$.subscribe((newTree: ActivityTree)=>{
      let foundActivity = newTree.findActivityByTreeId(this.activity.treeId);
      this.activity = Object.assign({}, foundActivity);
      this.getActivityData();
    })
  }

  private getActivityData(){
    this.ifLoading = true;
    this.activityInstances = [];
    this.activityDataSubscription.unsubscribe();
    this.activityDataSubscription = this.activitiesService.getActivityData(this.activity).subscribe((response: {data: any, message: string})=>{
      console.log("response from activities service: ", response)
      /*
        data is of type TimeSegment[] from server

        need to map data to interface type IActivityInstance
      */

      for(let data of response.data){
        let startTime: moment.Moment = moment(data.startTimeISO);
        let endTime: moment.Moment = moment(data.endTimeISO);
        let durationHours = moment(endTime).diff(moment(startTime), 'minutes')  / 60;
        let instance: IActivityInstance = { startTime: startTime, endTime: endTime, durationHours: durationHours, activityTreeId: this.activity.treeId }
        this.activityInstances.push(instance);
      }
      this.ifLoading = false;
    });
    
  }

  onClickEdit(){
    this.action = "edit";
  }

  onFormClosed(val: string){
    this.action = "view";
    if(val == "DELETE"){
      this.displayClosed.emit();
    }
    
  }

  ngOnDestroy(){
    this.activityDataSubscription.unsubscribe();
  }

  onClickCloseActivity(){
    this.displayClosed.emit();
    this.ngOnDestroy();
  } 

}
