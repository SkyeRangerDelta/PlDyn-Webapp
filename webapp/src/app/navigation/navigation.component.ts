import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {

  authed: boolean = false;

  constructor( private authService: AuthService, private router: Router ) {
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

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
