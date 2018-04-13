import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxNotificationComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxnotification";
import {GlobalComponentsService} from "../../../services/global-components.service";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  @ViewChild("infoNotification") infoNotification: jqxNotificationComponent;
  @ViewChild("errorNotification") errorNotification: jqxNotificationComponent;

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.notification = this;
  }

  openInfo(text: string) {
    document.getElementById('info-notification-text').innerText = text;
    this.infoNotification.open();
  }

  openError(text: string) {
    document.getElementById('error-notification-text').innerText = text;
    this.errorNotification.open();
  }
}