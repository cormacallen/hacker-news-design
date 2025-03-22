import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  getAriaLabel(): string {
    const currentMode = this.themeService.themeMode();
    if (currentMode === 'light') {
      return 'Switch to dark mode';
    } else if (currentMode === 'dark') {
      return 'Switch to system theme';
    } else {
      return 'Switch to light mode';
    }
  }
}
