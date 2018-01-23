import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {NgForm} from "@angular/forms";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginWindow')
  loginWindow: jqxWindowComponent;

  @ViewChild('messageBox')
  messageBox: ElementRef;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {

  }

  show() {
    this.loginWindow.open();
  }

  onLogin(loginForm: NgForm) {
    if (!loginForm.valid) {
      return;
    }

    const username = loginForm.form.controls['username'].value;
    const password = loginForm.form.controls['password'].value;

    this.messageBox.nativeElement.innerHTML = 'Bad credentials';

    this.authService.login(username, password);
  }
}
