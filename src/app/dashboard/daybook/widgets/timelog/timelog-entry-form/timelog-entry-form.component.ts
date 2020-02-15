import { Component, OnInit, Input } from '@angular/core';
import { TimelogEntryItem } from '../timelog-large-frame/timelog-body/timelog-entry/timelog-entry-item.class';
import { ToolboxService } from '../../../../../toolbox-menu/toolbox.service';
import { DaybookControllerService } from '../../../controller/daybook-controller.service';
import * as moment from 'moment';
import { LoggingService } from '../../../../../shared/logging/logging.service';
import { TLEFFormCase } from './tlef-form-case.enum';
import { DurationString } from '../../../../../shared/utilities/time-utilities/duration-string.class';
import { TimelogEntryFormService } from './timelog-entry-form.service';

@Component({
  selector: 'app-timelog-entry-form',
  templateUrl: './timelog-entry-form.component.html',
  styleUrls: ['./timelog-entry-form.component.css']
})
export class TimelogEntryFormComponent implements OnInit {

  constructor(
    private toolsService: ToolboxService,
    private daybookControllerService: DaybookControllerService,
    private loggingService: LoggingService,
    private timelogEntryFormService: TimelogEntryFormService,
  ) { }

  private _formCase: TLEFFormCase;
  private _entryItem: TimelogEntryItem;

  private _changesMade: boolean = false;
  private _confirmDelete: boolean = false;

  ngOnInit() {



    

  }

  public get entryItem(): TimelogEntryItem { return this.timelogEntryFormService.openedTimelogEntry; }
  public get formCase(): TLEFFormCase { return this.timelogEntryFormService.formCase; }

  public get durationString(): string { return this.entryItem.durationString; }
  public get confirmDelete(): boolean { return this._confirmDelete; }


  public onClickSave() {
    this.daybookControllerService.activeDayController.saveTimelogEntryItem$(this.entryItem);
    this.toolsService.closeTool();
  }
  public onClickDelete() {
    this._confirmDelete = true;

  }
  public onClickConfirmDelete() {
    this.daybookControllerService.activeDayController.deleteTimelogEntryItem$(this.entryItem);
    this.toolsService.closeTool();
  }

  public onClickDiscard() {
    if (!this._changesMade) {
      this.toolsService.closeTool();
    } else {
      console.log("Warning: need to implement a confirmation here")
      this.toolsService.closeTool();
    }
  }

  

}
