import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {NgForm} from "@angular/forms";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('loginWindow')
  loginWindow: jqxWindowComponent;

  @ViewChild('messageBox')
  messageBox: ElementRef;

  @ViewChild('loginButton')
  loginButton: jqxButtonComponent;

  @ViewChild('cancelButton')
  cancelButton: jqxButtonComponent;

  constructor(private authService: AuthService) {
  }

  ngAfterViewInit() {
    this.loginWindow.close();
  }

  open() {
    this.loginWindow.open();
  }

  onLogin(loginForm: NgForm) {
    if (!loginForm.valid) {
      return;
    }

    const username = loginForm.form.controls['username'].value;
    const password = loginForm.form.controls['password'].value;

    this.authService.login(username, password)
      .subscribe(
        response => {
          this.setErrMsg('');
        },
        err => {
          this.setErrMsg(err.statusText);
          loginForm.form.patchValue({password: ''});
        })
  }

  private setErrMsg(errMsg: string) {
    this.messageBox.nativeElement.innerHTML = errMsg;
    this.messageBox.nativeElement.title = errMsg;
  }

  initContent = () => {
    this.loginButton.createComponent();
    this.cancelButton.createComponent();
  }

  close() {
    this.loginWindow.close()
  }
}
