import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.component.html',
  styleUrls: ['./splashscreen.component.css']
})
export class SplashscreenComponent implements AfterViewInit {
  @ViewChild('splash')
  splash: jqxWindowComponent;

  constructor() {
  }

  ngAfterViewInit(): void {
    setTimeout(_ => {
      this.splash.close();
    }, 100);
  }

}
