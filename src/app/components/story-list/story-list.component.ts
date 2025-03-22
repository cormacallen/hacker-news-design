import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  Renderer2,
  ElementRef,
  viewChild,
  signal,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  HackerNewsService,
  StoryType,
} from '../../services/hacker-news.service';
import { StoryItemComponent } from '../story-item/story-item.component';
import { Story } from '../../interfaces/story';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [CommonModule, StoryItemComponent],
  templateUrl: './story-list.component.html',
  styleUrl: './story-list.component.scss',
})
export class StoryListComponent implements OnInit {
  private hackerNewsService = inject(HackerNewsService);
  private destroyRef = inject(DestroyRef);
  private renderer = inject(Renderer2);

  // Using the signal-based viewChild approach
  readonly tabsContainer = viewChild<ElementRef<HTMLElement>>('tabsContainer');

  stories = signal<Story[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeTab = signal<StoryType>('top');
  dropdownOpen = signal<boolean>(false);
  currentPage = signal<number>(1);
  readonly storiesPerPage = 30;
  hasMoreStories = signal<boolean>(true);
  loadingMore = signal<boolean>(false);

  tabs = [
    { id: 'top' as StoryType, label: 'Top' },
    { id: 'new' as StoryType, label: 'New' },
    { id: 'best' as StoryType, label: 'Best' },
    { id: 'ask' as StoryType, label: 'Ask HN' },
    { id: 'show' as StoryType, label: 'Show HN' },
    { id: 'job' as StoryType, label: 'Jobs' },
  ];

  constructor() {
    // Set up effect to handle tab scrolling after view initialization
    effect(() => {
      const containerElement = this.tabsContainer();

      if (containerElement) {
        // Scroll active tab into view
        setTimeout(() => {
          this.scrollActiveTabIntoView();
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadStories();

    // Close dropdown when clicking outside
    this.renderer.listen('document', 'click', (event: Event) => {
      const dropdownEl = document.querySelector('.tabs-dropdown-container');
      if (
        dropdownEl &&
        !dropdownEl.contains(event.target as Node) &&
        this.dropdownOpen()
      ) {
        this.dropdownOpen.set(false);
      }
    });
  }

  private tabSwitchInProgress = false;
  private currentTabRequest: StoryType | null = null;

  switchTab(tab: StoryType): void {
    // Prevent tab switching if one is already in progress
    if (this.tabSwitchInProgress || this.activeTab() === tab) {
      return;
    }

    this.tabSwitchInProgress = true;
    this.currentTabRequest = tab;
    this.activeTab.set(tab); // Update UI immediately
    this.hasMoreStories.set(true);
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
    this.stories.set([]);

    // Load stories for the new tab
    this.loadStories(false);

    // Scroll the selected tab into view
    setTimeout(() => {
      this.scrollActiveTabIntoView();
    }, 0);
  }

  switchTabAndCloseDropdown(tab: StoryType): void {
    this.switchTab(tab);
    this.dropdownOpen.set(false);
  }

  toggleDropdown(): void {
    this.dropdownOpen.update((value) => !value);
  }

  getCurrentTabLabel(): string {
    const currentTab = this.tabs.find((tab) => tab.id === this.activeTab());
    return currentTab?.label || 'Stories';
  }

  loadStories(loadMore = false): void {
    // If not loading more, reset to initial state
    if (!loadMore) {
      this.currentPage.set(1);
    } else {
      // For loading more, we don't want to show the main loading indicator
      // but a separate "loading more" indicator
      this.loadingMore.set(true);
    }

    // Calculate pagination parameters
    const page = loadMore ? this.currentPage() : 1;
    const limit = this.storiesPerPage;
    const requestedTab = this.activeTab();

    this.hackerNewsService
      .getStories(requestedTab, page, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newStories) => {
          // Only update if this is still the current tab
          if (requestedTab === this.activeTab()) {
            if (loadMore) {
              // Append new stories to existing ones
              this.stories.update((existingStories) => [
                ...existingStories,
                ...newStories,
              ]);
              // Increment the page counter for next load
              this.currentPage.update((page) => page + 1);
            } else {
              // Replace existing stories
              this.stories.set(newStories);
              this.currentPage.set(2); // Next page to load would be 2
            }

            // Check if we received fewer stories than requested (indicating end of list)
            this.hasMoreStories.set(newStories.length === limit);
          }

          // Always clear loading states
          this.loading.set(false);
          this.loadingMore.set(false);

          // If this completes the current tab switch, release the lock
          if (this.currentTabRequest === requestedTab) {
            this.tabSwitchInProgress = false;
            this.currentTabRequest = null;
          }
        },
        error: (err) => {
          console.error('Error fetching stories:', err);

          // Only show error if this is still the current tab
          if (requestedTab === this.activeTab()) {
            this.error.set('Failed to load stories. Please try again.');
          }

          this.loading.set(false);
          this.loadingMore.set(false);

          // Release the lock on error too
          if (this.currentTabRequest === requestedTab) {
            this.tabSwitchInProgress = false;
            this.currentTabRequest = null;
          }
        },
      });
  }

  loadMoreStories(): void {
    if (!this.loading() && !this.loadingMore() && this.hasMoreStories()) {
      this.loadStories(true);
    }
  }

  scrollActiveTabIntoView(): void {
    const containerElement = this.tabsContainer()?.nativeElement;
    if (!containerElement) return;

    const activeTabElement = document.getElementById(`tab-${this.activeTab()}`);
    if (activeTabElement) {
      // Calculate position for centering the active tab
      const scrollLeft =
        activeTabElement.offsetLeft -
        containerElement.clientWidth / 2 +
        activeTabElement.offsetWidth / 2;

      containerElement.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }
}
