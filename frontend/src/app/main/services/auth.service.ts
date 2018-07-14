import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';
import {MESSAGE_TYPE, MessageService} from "./message.service";
import {GlobalComponentsService} from "./global-components.service";
import {CREDENTIALS, LocalStorageService} from "./localstorage.service";

@Injectable()
export class AuthService {
  constructor(private httpClient: HttpClient, private messageService: MessageService, private globalComponentsService: GlobalComponentsService) {
  }

  changePassword(currentPassword, newPassword) {
    const params = {
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };
    return this.httpClient.post<any>(REST_URLS.AUTH.URLS.CHANGE_PASSWORD, params, opts);
  }

  resolveStatus() {
    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };
    return this.httpClient.post<any>(REST_URLS.AUTH.URLS.RESOLVE_USER_STATUS, {}, opts);
  }

  refreshStatus() {
    this.resolveStatus().subscribe(
      (status: any) => {
        this.messageService.sendMessage(MESSAGE_TYPE.AUTH_CHANGED, status.body);
      },
      (err) => {
        this.globalComponentsService.messageBox.openSimple('Error', `Failed to resolve server status. Reason : [${err.statusText}]`);
        console.log(err);
      }
    );
  }

  login(username, password) {
    const params = {
      username: username,
      password: password
    };

    const opts: any = {
      observe: 'response',
      responseType: 'text'
    };

    return this.httpClient.post<any>(REST_URLS.AUTH.URLS.LOGIN, params, opts).map(response => {
      LocalStorageService.storeRaw(CREDENTIALS, response['body']);
      return response;
    });
  }

  register(username, password, token) {
    const params = {
      username: username,
      password: password,
      token: token
    };

    const opts: any = {
      observe: 'response',
      responseType: 'text'
    };

    return this.httpClient.post<any>(REST_URLS.AUTH.URLS.REGISTER, params, opts);
  }

  getToken(): any {
    return LocalStorageService.loadRaw(CREDENTIALS);
  }

  logout() {
    // todo : how to disable login token permanently ?
    LocalStorageService.storeRaw(CREDENTIALS, null);
    this.refreshStatus();
  }
}
