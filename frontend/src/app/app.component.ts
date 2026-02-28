import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component( {
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: false
})
export class AppComponent {
  title = 'PlDyn Dashboard';
  flagshipLogo = 'assets/logo.png';

  constructor( private titleService: Title ) {
    this.titleService.setTitle( this.title );
  }
}
