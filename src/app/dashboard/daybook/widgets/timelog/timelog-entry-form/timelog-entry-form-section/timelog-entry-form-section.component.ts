import { Component, OnInit, Input } from '@angular/core';
import { TimelogEntryFormSection, TimelogEntryFormSectionType} from './timelog-entry-form-section.class';

import { TimelogEntryForm } from '../timelog-entry-form.class';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-timelog-entry-form-section',
  templateUrl: './timelog-entry-form-section.component.html',
  styleUrls: ['./timelog-entry-form-section.component.css']
})
export class TimelogEntryFormSectionComponent implements OnInit {

  constructor() { }



  @Input() formSection: TimelogEntryFormSection;
  @Input() timelogEntryForm: TimelogEntryForm; 

  ngOnInit() {
    console.log("form section init:", this.formSection);
  }


  faCheck = faCheck;

}
