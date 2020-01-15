import { Component, OnInit, Input } from '@angular/core';
import { TimelogEntryItem } from './timelog-entry-item.class';
import { ActivityCategoryDefinitionService } from '../../../../../../activities/api/activity-category-definition.service';
import { ActivityCategoryDefinition } from '../../../../../../activities/api/activity-category-definition.class';
import { ScreenSizeService } from '../../../../../../../shared/app-screen-size/screen-size.service';
import { AppScreenSize } from '../../../../../../../shared/app-screen-size/app-screen-size.enum';
import { ColorConverter } from '../../../../../../../shared/utilities/color-converter.class';
import { ColorType } from '../../../../../../../shared/utilities/color-type.enum';
import { TimelogEntryActivity } from '../../../../../api/data-items/timelog-entry-activity.interface';

@Component({
  selector: 'app-timelog-entry',
  templateUrl: './timelog-entry.component.html',
  styleUrls: ['./timelog-entry.component.css']
})
export class TimelogEntryComponent implements OnInit {

  constructor(private activitiesService: ActivityCategoryDefinitionService, private screenSizeService: ScreenSizeService) { }

  private _entries: TimelogEntryItem[] = [];
  @Input() public set entries(entryItems: TimelogEntryItem[]) {
    this._entries = entryItems;
    this.rebuild();
  }
  public get entries(): TimelogEntryItem[] { return this._entries; }

  private _minutesPerTwentyPixels: number = 20;
  @Input() public set minutesPerTwentyPixels(minutesPerTwentyPixels: number) {
    this._minutesPerTwentyPixels = minutesPerTwentyPixels;
    if(this._entries.length > 0){
      const minutes: number = this.entries[this.entries.length-1].endTime.diff(this.entries[0].startTime, 'minutes');
      const safeBuffer: number = 5; // subtract a few px just so as to not go over
      let height: number = ((minutes * 20) / minutesPerTwentyPixels) - safeBuffer;
      const rowHeight: number = 20;
      this._rows = Math.floor(height / rowHeight);  
    }
    
  }

  private _rows: number = 1;

  public get minutesPerTwentyPixels(): number { return this._minutesPerTwentyPixels; };


  private _activityDisplayEntries: { activity: ActivityCategoryDefinition, name: string, color: string, durationMinutes: number }[] = [];
  public get activityDisplayEntries(): { activity: ActivityCategoryDefinition, name: string, color: string, durationMinutes: number }[] { return this._activityDisplayEntries; }

  public screenSize: AppScreenSize;

  ngOnInit() {
    console.log("TimelogEntry Display Init()")
    this.screenSize = this.screenSizeService.appScreenSize;
    this.screenSizeService.appScreenSize$.subscribe((size)=>{
      this.screenSize = size;
    })
    this.activitiesService.activitiesTree$.subscribe((treeChanged) => {
      this.rebuild();
    });
   
    // console.log("Activity display entries:", this._activityDisplayEntries);

  }

  private _backgroundColor: string = "rgba(255, 255, 255, 0.5)";
  public get backgroundColor(): string { return this._backgroundColor; };

  private _units: { color: string, unitType: "HOUR" | "FIFTEEN", fill: any[] }[] = [];
  public get units(): { color: string, unitType: "HOUR" | "FIFTEEN",  fill: any[] }[] { return this._units; };

  private _displayString: string = "";
  public get displayString(): string { return this._displayString; };


  private rebuild() {
    if(this.entries.length > 0){
      if(this.entries.length === 1){

      }else{
        const entryDuration: number = this.entries[0].durationSeconds/60;

        let displayString: string = "";
    
        let units: { color: string, unitType: "HOUR" | "FIFTEEN", fill: any[] }[] = [];
        let topActivitySet: boolean = false;
        this.entries[0].timelogEntryActivities.sort((a1, a2)=>{
          if(a1.percentage > a2.percentage) return -1;
          else if(a1.percentage < a2.percentage) return 1;
          else return 0;
        }).forEach((activityEntry) => {
          let foundActivity: ActivityCategoryDefinition = this.activitiesService.findActivityByTreeId(activityEntry.activityTreeId);
          let durationMinutes: number =(activityEntry.percentage * entryDuration) / 100;
    
          if(!topActivitySet){
            topActivitySet = true;
            const alpha = 0.06;
            this._backgroundColor = ColorConverter.convert(foundActivity.color, ColorType.RGBA, alpha);
            if(foundActivity){
              displayString = foundActivity.name;
            }else{
              displayString = "Unknown activity";
            }
          } 
        
          let color: string = "";
          if (foundActivity) {
            color = foundActivity.color;
          } else {
            color = "rgba(0,0,0,0.1)";
          }
    
          let unitCount: number = Math.ceil(durationMinutes/15);
          if(this._rows === 1){
            for(let i=0; i< unitCount; i++){
              units.push({
                color: color,
                unitType: "FIFTEEN",
                fill: [1],
              });
            }
          }else if(this._rows > 1){
            let remainingUnitCount: number = unitCount;
            while(remainingUnitCount > 0){
              if(remainingUnitCount >= 4){
                let fill: any[] = [1, 2, 3, 4];
                units.push({
                  color: color,
                  unitType: "HOUR",
                  fill: fill,
                });
                remainingUnitCount-= 4;
              }else{
                let fill: any[] = [];
                for(let i=1; i<=remainingUnitCount; i++){
                  fill.push(i);
                }
                units.push({
                  color: color,
                  unitType: "HOUR",
                  fill: fill,
                });
                remainingUnitCount = 0;
              }
            }
          }
        });
    
        if(this.entries[0].timelogEntryActivities.length > 1){
          displayString += " +" + (this.entries[0].timelogEntryActivities.length-1) + " more";
        }
        
    
    
        this._displayString = displayString;
        this._units = units;
      }

    }else{
      
    }
    
  }

}
