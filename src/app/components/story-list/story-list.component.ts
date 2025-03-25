import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  viewChild,
  signal,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  HackerNewsService,
  StoryType,
} from '../../services/hacker-news.service';
import { StoryItemComponent } from '../story-item/story-item.component';
import { Story } from '../../interfaces/story.interface';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface StoryTab {
  id: StoryType;
  label: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [CommonModule, StoryItemComponent, FormsModule],
  templateUrl: './story-list.component.html',
  styleUrl: './story-list.component.scss',
})
export class StoryListComponent implements OnInit, OnDestroy {
  private hackerNewsService = inject(HackerNewsService);
  private titleService = inject(Title);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Cancel previous requests
  private loadingCancellation = new Subject<void>();

  // Signal-based viewChild for the tabs container
  readonly tabsContainer = viewChild<ElementRef>('tabsContainer');

  // Reactive state using signals
  stories = signal<Story[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<StoryType>('top');
  currentPage = signal(1);
  hasMoreStories = signal(true);
  loadingMore = signal(false);
  tabsDisabled = signal(false);

  // Configuration
  readonly storiesPerPage = 30;

  // Available story categories
  tabs: StoryTab[] = [
    { id: 'top', label: 'Top', ariaLabel: 'Top stories' },
    { id: 'new', label: 'New', ariaLabel: 'New stories' },
    { id: 'best', label: 'Best', ariaLabel: 'Best stories' },
    { id: 'ask', label: 'Ask HN', ariaLabel: 'Ask Hacker News stories' },
    { id: 'show', label: 'Show HN', ariaLabel: 'Show Hacker News stories' },
    { id: 'job', label: 'Jobs', ariaLabel: 'Job postings' },
  ];

  // Computed value for current tab label
  getCurrentTabLabel(): string {
    const currentTab = this.tabs.find((tab) => tab.id === this.activeTab());
    return currentTab?.label || 'Stories';
  }

  ngOnInit(): void {
    // Get story type from route params if available
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['type'] && this.isValidStoryType(params['type'])) {
          this.activeTab.set(params['type'] as StoryType);
        }
        this.loadStories();
      });
  }

  ngOnDestroy(): void {
    this.loadingCancellation.next();
    this.loadingCancellation.complete();
  }

  /**
   * Check if string is valid story type
   */
  private isValidStoryType(type: string): boolean {
    return this.tabs.some((tab) => tab.id === type);
  }

  /**
   * Update page title
   */
  private updatePageTitle(): void {
    this.titleService.setTitle(
      `${this.getCurrentTabLabel()} Stories | HackerNews Redesigned`,
    );
  }

  /**
   * Switch to a different story category
   */
  switchTab(tab: StoryType): void {
    if (this.activeTab() === tab || this.tabsDisabled()) {
      return;
    }

    this.activeTab.set(tab);
    this.stories.set([]);
    this.currentPage.set(1);
    this.loading.set(true);
    this.error.set(null);
    this.hasMoreStories.set(true);
    this.tabsDisabled.set(true); // Disable tabs while loading

    // Update the URL without reloading
    this.router.navigate(['/stories', tab], { replaceUrl: true });

    // Fetch stories for the new tab
    this.loadStories();
    setTimeout(() => {
      this.updatePageTitle();
    });
  }

  /**
   * Load stories from API
   */
  loadStories(loadMore = false): void {
    // Cancel any previous in-flight requests, fix issues clicking tabs quickly
    this.loadingCancellation.next();

    if (!loadMore) {
      this.loading.set(true);
      this.currentPage.set(1);
    } else {
      // get focused element before loading more stories
      this.loadingMore.set(true);
    }

    const page = loadMore ? this.currentPage() : 1;

    const currentTab = this.activeTab(); // Capture current tab to verify later

    this.hackerNewsService
      .getStories(currentTab, page, this.storiesPerPage)
      .pipe(
        // Cancel this subscription if loadingCancellation emits
        takeUntil(this.loadingCancellation),
        // Also cancel when component is destroyed
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (newStories) => {
          // Only update if current tab hasn't changed during request
          if (currentTab === this.activeTab()) {
            // Get the current length before adding new stories
            const startIndex = this.stories().length;

            if (loadMore) {
              // Append new stories to existing ones
              this.stories.update((stories) => [...stories, ...newStories]);
              this.currentPage.update((page) => page + 1);
            } else {
              // Replace existing stories
              this.stories.set(newStories);
              this.currentPage.set(2);
            }

            // Check if we have more stories to load
            this.hasMoreStories.set(newStories.length >= this.storiesPerPage);
            this.loading.set(false);
            this.loadingMore.set(false);
            this.error.set(null);
            this.tabsDisabled.set(false); // Re-enable tabs once data is loaded

            // Handle focus for screen readers
            // After render, add an ID to the first new story
            setTimeout(() => {
              const newStoryElements = document.querySelectorAll('.story-item');

              if (newStoryElements.length > startIndex) {
                // Get the first new story element
                const firstNewStory = newStoryElements[startIndex];

                // Set an ID we can target
                firstNewStory.id = 'first-new-story';

                // Set focus to it
                firstNewStory.setAttribute('tabindex', '-1');
                (firstNewStory as HTMLElement).focus();
              }
            }, 10);
          }
          this.updatePageTitle();
        },
        error: (err) => {
          // Only update if current tab hasn't changed during request
          if (currentTab === this.activeTab()) {
            this.error.set('Failed to load stories. Please try again.');
            this.loading.set(false);
            this.loadingMore.set(false);
            this.tabsDisabled.set(false); // Re-enable tabs on error
          }
        },
      });
  }
}
