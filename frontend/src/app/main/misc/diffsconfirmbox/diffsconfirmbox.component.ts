import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: 'app-diffsconfirmbox',
  templateUrl: './diffsconfirmbox.component.html',
  styleUrls: ['./diffsconfirmbox.component.css']
})
export class DiffsConfirmBoxComponent implements OnInit {
  @ViewChild('diffsConfirmBoxWindow') diffsConfirmBoxWindow: jqxWindowComponent;
  @ViewChild('overrideButton') overrideButton: jqxButtonComponent;
  @ViewChild('diffsButton') diffsButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  private onOverride: () => void;
  private onDiff: () => void;

  initContent = () => {
    this.overrideButton.createComponent();
    this.diffsButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.diffsConfirmBox = this;
  }

  open(onOverride: () => void, onDiff: () => void) {
    this.onOverride = onOverride;
    this.onDiff = onDiff;
    this.diffsConfirmBoxWindow.open();
  }

  overrideFile() {
    this.onOverride();
    this.diffsConfirmBoxWindow.close();
  }

  makeDiffs() {
    this.onDiff();
    this.diffsConfirmBoxWindow.close();
  }
}
