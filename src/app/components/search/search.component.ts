import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  searchQuery: string = '';

  onSearch(event: Event): void {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      // In a real implementation, this would navigate to search results
      console.log(`Search functionality would search for: ${this.searchQuery}`);
    }
  }
}
