import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";

@Component({
    selector: "app-example-page",
    standalone: true,
    imports: [
        MatButton,
        NgOptimizedImage
    ],
    templateUrl: "./example-page.component.html",
    styleUrl: "./example-page.component.scss"
})
export class ExamplePageComponent {

}
