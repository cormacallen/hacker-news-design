import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ThemeToggleComponent, SearchComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  // Signal for tracking mobile search visibility
  isMobileSearchVisible = signal(false);

  // Toggle mobile search visibility
  toggleMobileSearch(): void {
    this.isMobileSearchVisible.update((isVisible) => !isVisible);
  }
}
