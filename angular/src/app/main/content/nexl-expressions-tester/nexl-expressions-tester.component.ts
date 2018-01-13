import {Component} from '@angular/core';

@Component({
	selector: '.app-nexl-expressions-tester',
	templateUrl: './nexl-expressions-tester.component.html',
	styleUrls: ['./nexl-expressions-tester.component.css']
})
export class NexlExpressionsTesterComponent {
	eval() {
		alert(1);
	}

	assemble() {
		alert(2);
	}

	args() {
		alert(3);
	}
}