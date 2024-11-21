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
  username: string = 'Program!';

  constructor( private authService: AuthService, private router: Router ) {
    this.authed = this.authService.isAuthenticated;
    this.username = this.authService.getUsername;
  }

  ngOnInit() {
    this.authService.authState$.subscribe( (authed: boolean) => {
      this.authed = authed;
    });

    this.authService.uname$.subscribe( (uname: string) => {
      this.username = uname;
    });
  }

  logout() {
    this.authService.logout();
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
