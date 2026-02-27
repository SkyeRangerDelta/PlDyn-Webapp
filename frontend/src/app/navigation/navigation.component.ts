import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrl: './navigation.component.scss',
    standalone: false
})
export class NavigationComponent {

  authed: boolean = false;
  username: string = 'Program!';

  constructor( private authService: AuthService, private router: Router ) {
    // Initialize with default values - subscriptions will update them
    this.authed = false;
    this.username = 'Program!';
  }

  ngOnInit() {
    // Sync auth state with localStorage on init
    const hasSession = localStorage.getItem('pldyn-session') === 'active';
    if (!hasSession && this.authService.isAuthenticated) {
      // Session flag was removed but authService still thinks user is authenticated
      this.authService.logout();
    }

    // Subscribe to auth state changes
    this.authService.authState$.subscribe( (authed: boolean) => {
      this.authed = authed;
    });

    this.authService.uname$.subscribe( (uname: string) => {
      this.username = uname;
    });

    // Set initial state from observables
    this.authed = this.authService.isAuthenticated;
    this.username = this.authService.getUsername;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
