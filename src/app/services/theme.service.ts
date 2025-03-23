import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'hn-theme-preference';
  private readonly document = inject(DOCUMENT);

  // Media query for system preference
  private systemDarkModeQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  // Reactive state using signals
  themeMode = signal<ThemeMode>(this.getStoredThemeMode());
  systemPrefersDark = signal<boolean>(this.systemDarkModeQuery.matches);

  constructor() {
    // Apply theme when signal changes
    effect(() => {
      this.applyTheme();
      this.saveThemePreference();
    });

    // Listen for system theme changes
    this.systemDarkModeQuery.addEventListener('change', (e) => {
      this.systemPrefersDark.set(e.matches);

      // Only update if in system mode
      if (this.themeMode() === 'system') {
        this.applyTheme();
      }
    });

    // Initial theme application
    this.applyTheme();
  }

  isDarkMode(): boolean {
    const mode = this.themeMode();
    return mode === 'dark' || (mode === 'system' && this.systemPrefersDark());
  }

  toggleTheme(): void {
    const currentMode = this.themeMode();
    if (currentMode === 'light') {
      this.themeMode.set('dark');
    } else {
      this.themeMode.set('light');
    }
  }

  private applyTheme(): void {
    const isDark = this.isDarkMode();
    const root = this.document.documentElement;

    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
    }
  }

  private getStoredThemeMode(): ThemeMode {
    const stored = localStorage.getItem(this.THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored as ThemeMode;
    }
    return 'system';
  }

  private saveThemePreference(): void {
    localStorage.setItem(this.THEME_KEY, this.themeMode());
  }
}
