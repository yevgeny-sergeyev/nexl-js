import {Component, OnInit} from '@angular/core';
import {AuthService} from "./services/auth.service";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "./services/message.service";
import {HttpRequestService} from "./services/http.requests.service";
import {GlobalComponentsService} from "./services/global-components.service";
import {UtilsService} from "./services/utils.service";
import {ICONS} from "./misc/messagebox/messagebox.component";

export const CTRL_S = 'control+s';
export const F9 = 'F9';
export const F7 = 'F7';
export const F8 = 'F8';
export const ALT_F7 = 'ALT_F7';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  timerCounter: number = 0;

  constructor(private authService: AuthService, private messageService: MessageService, private http: HttpRequestService, private globalComponentsService: GlobalComponentsService) {
  }

  // todo : improve this code
  discoverKeyCombination(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
          return CTRL_S;
      }
    }

    if (event.altKey || event.metaKey) {
      if (event.which === 118) {
        return ALT_F7;
      }
    }

    if (event.which === 118) {
      return F7;
    }

    if (event.which === 119) {
      return F8;
    }

    if (event.which === 120) {
      return F9;
    }

    return null;
  }

  interceptHotKeys() {
    $(window).bind('keydown',
      (event) => {
        const key = this.discoverKeyCombination(event);

        switch (key) {
          case CTRL_S: {
            this.messageService.sendMessage(MESSAGE_TYPE.SAVE_FILE_TO_STORAGE);
            event.preventDefault();
            return;
          }

          case F7 : {
            event.preventDefault();
            this.messageService.sendMessage(MESSAGE_TYPE.PRETTIFY_FILE);
            return;
          }

          case F8 : {
            event.preventDefault();
            this.messageService.sendMessage(MESSAGE_TYPE.TOGGLE_ARGS_WINDOW);
            return;
          }

          case F9 : {
            event.preventDefault();
            this.messageService.sendMessage(MESSAGE_TYPE.EVAL_NEXL_EXPRESSION);
            return;
          }

          case ALT_F7 : {
            event.preventDefault();
            this.messageService.sendMessage(MESSAGE_TYPE.FIND_FILE);
            return;
          }
        }
      });
  }

  ngOnInit() {
    setInterval(_ => {
      this.timerCounter++;
      this.messageService.sendMessage(MESSAGE_TYPE.TIMER, this.timerCounter);
    }, 10000);

    // loading server info
    this.http.post({}, REST_URLS.GENERAL.URLS.INFO, 'json').subscribe(
      (info: any) => {
        UtilsService.setServerInfo(info.body);
        this.authService.refreshStatus();
        this.interceptHotKeys();
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to load data from server. Reason : [${err.statusText}]`);
      }
    );

  }
}
