import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Story } from '../../interfaces/story';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { HostNamePipe } from '../../pipes/host-name.pipe';

@Component({
  selector: 'app-story-item',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, HostNamePipe],
  templateUrl: './story-item.component.html',
  styleUrl: './story-item.component.scss',
})
export class StoryItemComponent {
  story = input.required<Story>();
  index = input.required<number>();

  /**
   * Determine if the story is a self-post (no external URL)
   */
  isSelfPost = computed(() => !this.story().url);

  /**
   * Get the URL for the story (external URL or HN discussion)
   */
  storyUrl = computed(() => {
    return (
      this.story().url ||
      `https://news.ycombinator.com/item?id=${this.story().id}`
    );
  });

  /**
   * Get the comments URL
   */
  commentsUrl = computed(() => {
    return `https://news.ycombinator.com/item?id=${this.story().id}`;
  });

  /**
   * Get the story type label for accessibility
   */
  storyTypeLabel = computed(() => {
    const story = this.story();

    if (story.url && story.url.includes('github.com')) {
      return 'GitHub repository';
    }

    if (story.title.startsWith('Ask HN:')) {
      return 'Ask Hacker News post';
    }

    if (story.title.startsWith('Show HN:')) {
      return 'Show Hacker News post';
    }

    if (story.title.startsWith('Tell HN:')) {
      return 'Tell Hacker News post';
    }

    return story.url ? 'External article' : 'Text post';
  });
}
