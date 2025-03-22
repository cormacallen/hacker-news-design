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
  afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  HackerNewsService,
  StoryType,
} from '../../services/hacker-news.service';
import { StoryItemComponent } from '../story-item/story-item.component';
import { Story } from '../../interfaces/story';
import { Title } from '@angular/platform-browser';

interface StoryTab {
  id: StoryType;
  label: string;
  ariaLabel: string;
}

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
  private titleService = inject(Title);

  // Using the signal-based viewChild approach
  readonly tabsContainer = viewChild<ElementRef<HTMLElement>>('tabsContainer');

  // Signals for reactive state management
  stories = signal<Story[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeTab = signal<StoryType>('top');
  dropdownOpen = signal<boolean>(false);
  currentPage = signal<number>(1);
  hasMoreStories = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  lastLoadTime = signal<number>(Date.now());

  readonly storiesPerPage = 30;

  tabs: StoryTab[] = [
    { id: 'top', label: 'Top', ariaLabel: 'Top stories' },
    { id: 'new', label: 'New', ariaLabel: 'New stories' },
    { id: 'best', label: 'Best', ariaLabel: 'Best stories' },
    { id: 'ask', label: 'Ask HN', ariaLabel: 'Ask Hacker News stories' },
    { id: 'show', label: 'Show HN', ariaLabel: 'Show Hacker News stories' },
    { id: 'job', label: 'Jobs', ariaLabel: 'Job postings' },
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

    // Set up effect for updating the page title based on active tab
    effect(() => {
      const currentTab = this.tabs.find((tab) => tab.id === this.activeTab());
      if (currentTab) {
        this.titleService.setTitle(
          `${currentTab.label} Stories | Hacker News Redesigned`,
        );
      }
    });

    // Initialize UI after DOM is ready
    afterNextRender(() => {
      this.setupEventListeners();
    });
  }

  ngOnInit(): void {
    this.loadStories();
  }

  setupEventListeners(): void {
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

    // Keyboard navigation for tabs
    this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      // Only handle keyboard events when tabs are focused
      const activeElement = document.activeElement;
      if (!activeElement || !activeElement.classList.contains('tab')) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const currentIndex = this.tabs.findIndex(
          (tab) => tab.id === this.activeTab(),
        );

        let newIndex;
        if (event.key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % this.tabs.length;
        } else {
          newIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        }

        this.switchTab(this.tabs[newIndex].id);

        // Focus the new tab
        setTimeout(() => {
          const newTabElement = document.getElementById(
            `tab-${this.tabs[newIndex].id}`,
          );
          if (newTabElement) {
            newTabElement.focus();
          }
        }, 50);
      }
    });
  }

  private tabSwitchInProgress = false;
  private currentTabRequest: StoryType | null = null;

  /**
   * Switch to a different tab/category
   * @param tab Tab ID to switch to
   */
  switchTab(tab: StoryType): void {
    // Prevent tab switching if one is already in progress or same tab
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

  /**
   * Switch tab and close dropdown menu
   * @param tab Tab ID to switch to
   */
  switchTabAndCloseDropdown(tab: StoryType): void {
    this.switchTab(tab);
    this.dropdownOpen.set(false);
  }

  /**
   * Toggle dropdown menu for mobile view
   */
  toggleDropdown(): void {
    this.dropdownOpen.update((value) => !value);
  }

  /**
   * Get the label of the current active tab
   * @returns Current tab label
   */
  getCurrentTabLabel(): string {
    const currentTab = this.tabs.find((tab) => tab.id === this.activeTab());
    return currentTab?.label || 'Stories';
  }

  /**
   * Load stories from API
   * @param loadMore Whether to load more stories or reset
   */
  loadStories(loadMore = false): void {
    // If not loading more, reset to initial state
    if (!loadMore) {
      this.currentPage.set(1);
    } else {
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
          this.lastLoadTime.set(Date.now());

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
            this.hasMoreStories.set(newStories.length >= limit);
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

  /**
   * Load more stories (pagination)
   */
  loadMoreStories(): void {
    if (!this.loading() && !this.loadingMore() && this.hasMoreStories()) {
      this.loadStories(true);
    }
  }

  /**
   * Scroll active tab into view for better UX
   */
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

  /**
   * Get the ARIA label for the current tab content
   */
  getTabAriaLabel(): string {
    const currentTab = this.tabs.find((tab) => tab.id === this.activeTab());
    return currentTab?.ariaLabel || 'Stories';
  }
}
