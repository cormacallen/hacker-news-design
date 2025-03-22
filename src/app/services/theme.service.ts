import { Injectable, signal } from '@angular/core';
import { effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'hn-theme-preference';
  private systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

  // Use signal for reactive theme state
  themeMode = signal<ThemeMode>(this.getSavedTheme());
  isDarkMode = signal<boolean>(this.calculateIsDarkMode());

  constructor() {
    // Set up effect to update theme when signal changes
    effect(() => {
      const mode = this.themeMode();
      this.saveTheme(mode);
      this.isDarkMode.set(this.calculateIsDarkMode());
      this.applyTheme();
    });

    // Listen for system theme changes
    this.systemDarkMode.addEventListener('change', () => {
      if (this.themeMode() === 'system') {
        this.isDarkMode.set(this.systemDarkMode.matches);
        this.applyTheme();
      }
    });
  }

  toggleTheme(): void {
    const currentMode = this.themeMode();
    if (currentMode === 'light') {
      this.themeMode.set('dark');
    } else if (currentMode === 'dark') {
      this.themeMode.set('system');
    } else {
      this.themeMode.set('light');
    }
  }

  private getSavedTheme(): ThemeMode {
    return (localStorage.getItem(this.THEME_KEY) as ThemeMode) || 'system';
  }

  private saveTheme(mode: ThemeMode): void {
    localStorage.setItem(this.THEME_KEY, mode);
  }

  private calculateIsDarkMode(): boolean {
    const mode = this.themeMode();
    if (mode === 'system') {
      return this.systemDarkMode.matches;
    }
    return mode === 'dark';
  }

  private applyTheme(): void {
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
