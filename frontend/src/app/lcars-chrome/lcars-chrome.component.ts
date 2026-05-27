import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ThemeId, ThemeMeta } from '../services/theme.types';
import { AuthService } from '../services/auth.service';

const ROUTE_LABELS: { match: RegExp; label: string }[] = [
  { match: /^\/login/, label: 'USER AUTH' },
  { match: /^\/media$/, label: 'MEDIA OPS' },
  { match: /^\/media\/.*/, label: 'MEDIA OPS' },
  { match: /^\/music-editor/, label: 'MUSIC EDITOR' },
  { match: /^\/settings/, label: 'CONFIG' },
  { match: /^\/$/, label: 'MAIN' },
];

@Component({
  selector: 'app-lcars-chrome',
  templateUrl: './lcars-chrome.component.html',
  styleUrl: './lcars-chrome.component.scss',
  standalone: false,
})
export class LcarsChromeComponent implements OnInit, OnDestroy {
  active: ThemeId = 'default';
  pageLabel = 'MAIN';
  stardate = '';
  sectionLabels = ['NAV', 'OPS', 'DB-LINK', 'SEC-3', 'AUX'];

  authed = false;
  username = 'Program!';

  readonly themes: readonly ThemeMeta[];

  private subs: Subscription[] = [];

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private authService: AuthService
  ) {
    this.themes = themeService.themes;
  }

  ngOnInit(): void {
    this.subs.push(
      this.themeService.theme$.subscribe((id) => (this.active = id))
    );
    this.subs.push(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => (this.pageLabel = this.resolveLabel(e.urlAfterRedirects)))
    );
    this.subs.push(
      this.authService.authState$.subscribe((a) => (this.authed = a))
    );
    this.subs.push(
      this.authService.uname$.subscribe((u) => (this.username = u))
    );

    this.authed = this.authService.isAuthenticated;
    this.username = this.authService.getUsername;
    this.pageLabel = this.resolveLabel(this.router.url);
    this.stardate = this.computeStardate();
  }

  ngOnDestroy(): void {
    for (const s of this.subs) s.unsubscribe();
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setTheme(id: ThemeId): void {
    this.themeService.setTheme(id);
  }

  private resolveLabel(url: string): string {
    for (const r of ROUTE_LABELS) if (r.match.test(url)) return r.label;
    return 'MAIN';
  }

  private computeStardate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 0);
    const diff = (now.getTime() - start.getTime()) / 86400000;
    return (1000 * (year - 2000) + diff * 2.73).toFixed(1);
  }
}
