import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-delete-confirm-button',
  templateUrl: './delete-confirm-button.component.html',
  styleUrls: ['./delete-confirm-button.component.css']
})
export class DeleteConfirmButtonComponent implements OnInit {

  constructor() { }

  private _confirmDelete = false;
  public get confirmDelete(): boolean { return this._confirmDelete; }
  
  @Output() public delete: EventEmitter<boolean> = new EventEmitter();

  ngOnInit() {
  }

  public onMouseLeave(){
    this._confirmDelete = false;
  }
  public onClickDelete(){
    this._confirmDelete = true;
  }

  public onClickConfirmDelete(){
    this._confirmDelete = false;
    this.delete.emit(true);
  }

}