import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import 'rxjs/Rx';

// todo : make separate URLs for dev and prod
const GET_NEXL_SOURCES = 'http://localhost:3000/nexl/rest/get-nexl-sources';

const RO_ICONS = ['./nexl/site/images/dir.png', './nexl/site/images/js-file-read-only'];
const WRITE_ICONS = ['./nexl/site/images/dir.png', './nexl/site/images/js-file.png'];

@Injectable()
export class NexlSourcesService {
	constructor(private httpClient: HttpClient) {
	}

	substIcons(json: any) {
		json.forEach((item)=> {
			var icons = item.value.hasWritePermission ? WRITE_ICONS : RO_ICONS;
			item.icon = item.value.isDir ? icons[0] : icons[1];
		});
	}

	getNexlSources(relativePath?: string) {
		const params = new HttpParams().set('relativePath', relativePath || '/');
		return this.httpClient.get<any>(GET_NEXL_SOURCES, {params: params}).map(
			(data)=> {
				this.substIcons(data);
				return data;
			}
		);

	}
}
