import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ThemeId, ThemeMeta } from '../services/theme.types';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
  standalone: false,
})
export class ThemeSwitcherComponent implements OnInit, OnDestroy {
  active: ThemeId = 'default';
  readonly themes: readonly ThemeMeta[];

  private sub?: Subscription;

  constructor(private themeService: ThemeService) {
    this.themes = themeService.themes;
  }

  ngOnInit(): void {
    this.sub = this.themeService.theme$.subscribe((id) => (this.active = id));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  select(id: ThemeId): void {
    this.themeService.setTheme(id);
  }
}
