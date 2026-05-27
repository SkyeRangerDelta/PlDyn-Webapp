import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  standalone: false,
})
export class NavigationComponent implements OnInit, OnDestroy {
  authed = false;
  username = 'Program!';

  private subs: Subscription[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const hasSession = localStorage.getItem('pldyn-session') === 'active';
    if (!hasSession && this.authService.isAuthenticated) {
      this.authService.logout();
    }

    this.subs.push(
      this.authService.authState$.subscribe((authed: boolean) => (this.authed = authed))
    );
    this.subs.push(
      this.authService.uname$.subscribe((uname: string) => (this.username = uname))
    );

    this.authed = this.authService.isAuthenticated;
    this.username = this.authService.getUsername;
  }

  ngOnDestroy() {
    for (const s of this.subs) s.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
