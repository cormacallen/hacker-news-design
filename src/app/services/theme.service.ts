import { Injectable, signal } from '@angular/core';
import { effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'hn-theme-preference';
  private systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

  // Use signal for reactive theme state
  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Set up effect to update theme when signal changes
    effect(() => {
      this.saveThemePreference(this.isDarkMode());
      this.applyTheme();
    });

    // Initial theme application
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.update((isDark) => !isDark);
  }

  private getInitialTheme(): boolean {
    // Check for saved preference
    const savedPreference = localStorage.getItem(this.THEME_KEY);

    if (savedPreference !== null) {
      return savedPreference === 'dark';
    }

    // Default to system preference if no saved preference
    return this.systemDarkMode.matches;
  }

  private saveThemePreference(isDark: boolean): void {
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
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
