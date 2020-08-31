import { Component, OnInit, HostListener } from '@angular/core';
import { AuthenticationService } from './authentication/authentication.service';
import { AppScreenSizeService } from './shared/app-screen-size/app-screen-size.service';
import { Subscription, Observable, Subject, BehaviorSubject, timer } from 'rxjs';
import * as moment from 'moment';
import { KeydownService } from './shared/keydown.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  private _authSubs: Subscription[] = [];
  private _isAuthenticated: boolean;
  private _userActivitySub: Subscription = new Subscription();
  private _inactivityStartTime: moment.Moment;
  private _keyDown$: BehaviorSubject<string> = new BehaviorSubject(null);

  public get isAuthenticated(): boolean { return this._isAuthenticated; }
  public get keyDown$(): Observable<string> { return this._keyDown$.asObservable(); }

  constructor(
    private authService: AuthenticationService,
    private sizeService: AppScreenSizeService,
    private keydownService: KeydownService,

  ) { }

  @HostListener('window:resize', ['$event']) onResize(e) {
    this.sizeService.updateSize(window.innerWidth, window.innerHeight);
    this._resetUserInactiveTimer();
  }

  @HostListener('window:mousemove') mouseMove() {
    this._resetUserInactiveTimer();
  }

  @HostListener('window:keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    this.keydownService.keyDown(event.key);
    this._resetUserInactiveTimer();
  }

  ngOnInit() {
    this._isAuthenticated = false;
    this.sizeService.updateSize(window.innerWidth, window.innerHeight);
    this._resetUserInactiveTimer();
    this._authSubs.forEach(sub => sub.unsubscribe());
    this._authSubs = [
      this.authService.onLogout$.subscribe(onLogout => this._isAuthenticated = false),
      this.authService.appComponentLogin$.subscribe(login => {
        if (login === true) {
          this._isAuthenticated = true;
        } else {
          this._isAuthenticated = false;
        }
      }),
    ];
  }


  private _resetUserInactiveTimer() {
    const diffMin = moment().diff(this._inactivityStartTime, 'minutes');
    // console.log("RESETTING INACTIVITY TIMER (prev val: " + diffMin + " minutes")
    const lockAtMinutes = 15;
    this._inactivityStartTime = moment();
    this._userActivitySub.unsubscribe();
    this._userActivitySub = timer(0, 3000).subscribe((tick) => {
      if (diffMin > lockAtMinutes) {
        this.authService.lock();
        this._userActivitySub.unsubscribe();
      }
    });
  }

}
