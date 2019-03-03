import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthenticationService } from './authentication.service';
import { AuthData } from './auth-data.model';
import { AuthStatus } from './auth-status.model';
import { faKey, faUser, faUnlock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { User } from './user.model';
import { UserSetting } from '../user-settings/user-setting.model';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { ActivitiesService } from '../dashboard/activities/activities.service';
import { TimelogService } from '../dashboard/daybook/time-log/timelog.service';


@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.css']
})
export class AuthenticationComponent implements OnInit, OnDestroy {


  faKey = faKey;
  faUser = faUser;
  faUnlock = faUnlock;
  faSpinner = faSpinner;

  action: string = "welcome";

  formMessage: string = "";
  errorMessage: string = "";

  authData: AuthData = { user: null, password: '' };


  registrationForm: FormGroup;
  confirmRegistrationForm: FormGroup;
  loginForm: FormGroup;
  continueDisabled: boolean = true;


  constructor(private authService: AuthenticationService, private userSettingsService: UserSettingsService) { }

  attemptLogin() {
    this.setAction("waiting");
    this.authService.loginAttempt(this.authData);
  }



  ngOnInit() {
    this.registrationForm = new FormGroup({
      'emailAddress': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });
    this.confirmRegistrationForm = new FormGroup({
      'password': new FormControl(null, Validators.required),
    });
    this.loginForm = new FormGroup({
      'emailAddress': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    })

  }

  setAction(action: string) {
    this.formMessage = "";
    this.errorMessage = "";
    this.action = action;
  }

  onClickLogin() {
    this.setAction("waiting");

    if (this.loginForm.valid) {
      let loginUser = new User('', this.loginForm.controls['emailAddress'].value, []);
      this.authData = { user: loginUser, password: this.loginForm.controls['password'].value }
      this.authService.loginAttempt$.subscribe((successful: boolean) => {
        if(successful){
          this.setAction("waiting");
          this.formMessage = "Logging in...";
        }else{
          this.setAction("login");
          this.formMessage = "Bad username or password";
        }
      });
      this.attemptLogin();
    } else {
      this.formMessage = "Form is invalid";
    }

  }



  onClickContinueRegistration() {
    if (this.registrationForm.valid) {
      this.setAction("waiting");
      this.authService.checkForExistingAccount$(this.registrationForm.controls['emailAddress'].value).subscribe((response: any) => {
        if (response.data == null) {
          this.setAction("confirm_registration");
        } else {
          this.setAction("register");
          this.formMessage = "An account with this email address already exists"
        }
      }, error => {
        this.setAction("error");
        this.errorMessage = error.message;
      })
    } else {
      this.formMessage = "Form is invalid";
    }

  }

  onClickCancelRegistration() {
    this.setAction("welcome");
  }

  onClickFinishRegistration() {

    /*
      2019-01-28

      What is the proper way to do authentication?  checking in the front end, or make another request with the newly typed password to check with the server?
      is it safe to have that information in the front end at all ?

    */

    if (this.registrationForm.controls['password'].value == this.confirmRegistrationForm.controls['password'].value) {
      this.setAction("waiting");
      let defaultSettings: UserSetting[] = this.userSettingsService.createDefaultSettings();
      let newUser = new User(null, this.registrationForm.controls['emailAddress'].value, defaultSettings);
      this.authData = { user: newUser, password: this.registrationForm.controls['password'].value };
      this.authService.registerUser$(this.authData).subscribe((response: { data: any, message: string }) => {
        if (response != null) {
          this.setAction("successful_registration");
        } else {
          this.setAction("error");
          this.errorMessage = "No response from server.";
        }
      }, error => {
        console.log(error);
        this.setAction("error");
        this.errorMessage = error.message;
      });

    } else {
      this.setAction("confirm_registration");
      this.formMessage = "Passwords do not match";
    }


  }


  onClickContinuePostRegistration() {
    this.attemptLogin();
  }

  ngOnDestroy() {
    this.registrationForm.reset();
    this.confirmRegistrationForm.reset();
  }

}
