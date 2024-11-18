import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component( {
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'PlDyn Dashboard';
  flagshipLogo = 'assets/logo.png';

  authed: boolean = false;

  constructor( private authService: AuthService ) {
    this.authed = this.authService.isAuthenticated;
  }

  ngOnInit() {
    this.authService.authState$.subscribe( (authed: boolean) => {
      this.authed = authed;
    });
  }

  logout() {
    this.authService.logout();
  }

  getUsername() {
    return this.authService.getUsername();
  }
}
