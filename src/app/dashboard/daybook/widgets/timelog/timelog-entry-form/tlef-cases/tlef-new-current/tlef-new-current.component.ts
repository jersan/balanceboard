import { Component, OnInit, Input } from '@angular/core';
import { TimelogEntryItem } from '../../../timelog-large-frame/timelog-body/timelog-entry/timelog-entry-item.class';
import { TimelogEntryFormService } from '../../timelog-entry-form.service';

@Component({
  selector: 'app-tlef-new-current',
  templateUrl: './tlef-new-current.component.html',
  styleUrls: ['./tlef-new-current.component.css']
})
export class TlefNewCurrentComponent implements OnInit {

  public get entryItem(): TimelogEntryItem { return this.tlefService.openedTimelogEntry; }

  constructor(private tlefService: TimelogEntryFormService) { }

  ngOnInit() {
  }

}