import { Injectable, signal, effect, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'hn-theme-preference';
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // Media query for system preference
  private systemDarkModeQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  // Reactive states using signals
  themeMode = signal<ThemeMode>(this.getStoredThemeMode());
  systemPrefersDark = signal<boolean>(this.systemDarkModeQuery.matches);

  constructor() {
    // Set up effect to update theme when signal changes
    effect(() => {
      this.applyTheme();
      this.saveThemePreference();
    });

    // Listen for system theme changes
    fromEvent(this.systemDarkModeQuery, 'change')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: any) => {
        this.systemPrefersDark.set(event.matches);

        // Only update if in system mode
        if (this.themeMode() === 'system') {
          this.applyTheme();
        }
      });

    // Initial theme application
    this.applyTheme();
  }

  /**
   * Check if dark mode is active based on theme mode and system preference
   */
  isDarkMode(): boolean {
    const mode = this.themeMode();
    return mode === 'dark' || (mode === 'system' && this.systemPrefersDark());
  }

  /**
   * Toggle between light and dark mode
   */
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

  /**
   * Set a specific theme mode
   */
  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
  }

  /**
   * Apply the current theme to the document
   */
  private applyTheme(): void {
    const isDark = this.isDarkMode();
    const root = this.document.documentElement;

    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.style.colorScheme = 'light';
    }
  }

  /**
   * Get stored theme preference from localStorage
   */
  private getStoredThemeMode(): ThemeMode {
    const stored = localStorage.getItem(this.THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored as ThemeMode;
    }

    // Default to system if no preference stored
    return 'system';
  }

  /**
   * Save current theme preference to localStorage
   */
  private saveThemePreference(): void {
    localStorage.setItem(this.THEME_KEY, this.themeMode());
  }
}
