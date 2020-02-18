import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { DaybookControllerService } from '../../../../../controller/daybook-controller.service';
import { faSpinner} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-tlef-wakeup-time',
  templateUrl: './tlef-wakeup-time.component.html',
  styleUrls: ['./tlef-wakeup-time.component.css']
})
export class TlefWakeupTimeComponent implements OnInit {
  
  /**
   * This form will only ever be used for NEW_CURRENT timelog entries, so at this point there is no need to consider dealing with other cases.
   */
  constructor(private daybookControllerService: DaybookControllerService) { }
  faSpinner = faSpinner;

  private _saveClicked = false;

  ngOnInit() {


    this._time = moment(this.daybookControllerService.activeDayController.wakeupTime);
    this.maxVal = moment();
    this.minVal = this.daybookControllerService.todayController.prevDayFallAsleepTime;
  }

  @Output() timeChanged: EventEmitter<moment.Moment> = new EventEmitter();

  private _time: moment.Moment;
  public get time(): moment.Moment { return this._time; };

  public minVal: moment.Moment = moment().startOf("day");
  public maxVal: moment.Moment = moment();
  public get saveClicked(): boolean { return this._saveClicked; }

  onTimeChanged(time: moment.Moment) {
    // console.log("wakeup time changed " + time.format("YYYY-MM-DD hh:mm a"))
    this._time = moment(time);
    this.maxVal = moment();
  }
 

  onClickSave() {

    this._saveClicked = true;
    // console.log("Saving time to sleepcontroller: " + this.time.format('YYYY-MM-DD hh:mm a'))
    this.daybookControllerService.todayController.setWakeupTimeForDay(this.time)
  }
}