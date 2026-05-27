import { Inject, Injectable, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { THEMES, THEME_STORAGE_KEY, ThemeId, ThemeMeta } from './theme.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly subject = new BehaviorSubject<ThemeId>('default');
  readonly theme$: Observable<ThemeId> = this.subject.asObservable();
  readonly themes: readonly ThemeMeta[] = THEMES;

  private readonly renderer;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    const initial = this.readStoredTheme() ?? 'default';
    this.subject.next(initial);
    this.applyToDom(initial);
  }

  getTheme(): ThemeId {
    return this.subject.value;
  }

  setTheme(id: ThemeId): void {
    if (!THEMES.some((t) => t.id === id)) return;
    if (this.subject.value === id) return;
    this.subject.next(id);
    this.writeStoredTheme(id);
    this.applyToDom(id);
  }

  private applyToDom(id: ThemeId): void {
    const body = this.doc.body;
    const html = this.doc.documentElement;
    if (body) {
      for (const t of THEMES) {
        this.renderer.removeClass(body, `theme-${t.id}`);
      }
      this.renderer.addClass(body, `theme-${id}`);
    }
    if (html) {
      this.renderer.setAttribute(html, 'data-theme', id);
    }
  }

  private readStoredTheme(): ThemeId | null {
    try {
      const v = this.doc.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      if (v && THEMES.some((t) => t.id === v)) return v as ThemeId;
    } catch {
      /* localStorage unavailable */
    }
    return null;
  }

  private writeStoredTheme(id: ThemeId): void {
    try {
      this.doc.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* localStorage unavailable */
    }
  }
}
