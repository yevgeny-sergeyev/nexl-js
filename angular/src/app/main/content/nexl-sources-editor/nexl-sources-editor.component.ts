import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../../services/http.requests.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";

@Component({
  selector: '.app-nexl-sources-editor',
  templateUrl: './nexl-sources-editor.component.html',
  styleUrls: ['./nexl-sources-editor.component.css'],
})
export class NexlSourcesEditorComponent implements AfterViewInit {
  @ViewChild('nexlSourcesTabs') nexlSourcesTabs: jqxTabsComponent;

  id = 0;

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      this.handleMessages(message);
    });
  }

  handleMessages(message) {
    if (message.type === MESSAGE_TYPE.OPEN_FILE) {
      this.openFile(message.data);
    }
  }

  ngAfterViewInit(): void {
    this.nexlSourcesTabs.scrollPosition('both');
    this.nexlSourcesTabs.removeFirst();
  }

  newTabItem(relativePath: string) {
    const title = relativePath.replace(/.*[/\\]/, '');
    const contentId = 'tabs-content-' + this.id++;

    return {
      contentId: contentId,
      title: '<span relative-path="' + relativePath + '" content-id="' + contentId + '">' + title + '<img src="/nexl/site/images/close.png"></span>',
      isJSFile: relativePath.search(/(\.js)$/i) >= 0
    };
  }

  resolveTab(relativePath: string) {
    for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
      const titleItem = this.nexlSourcesTabs.getTitleAt(index);
      const contentItem = this.nexlSourcesTabs.getContentAt(index);
      console.log('The title is : ', titleItem);
      console.log('The content is : ', contentItem);
    }
    return -1;
  }

  openFile(relativePath: string) {
    const tab = this.resolveTab(relativePath);
    if (tab >= 0) {
      this.nexlSourcesTabs.val(tab + '');
      return;
    }

    this.globalComponentsService.loader.open();

    this.http.post({relativePath: relativePath}, '/sources/get-source-content', 'text').subscribe(
      (content: any) => {
        const tabItem = this.newTabItem(relativePath);
        console.log(tabItem);
        this.nexlSourcesTabs.addLast(tabItem.title, '<div id="' + tabItem.contentId + '" style="width:100%; height:100%;">' + content.body + '</div>');
        ace.edit(tabItem.contentId);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to read nexl source content\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  onRemove(event: any) {
    /*
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
    */
  }
}
