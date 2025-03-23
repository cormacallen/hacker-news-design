import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Story } from '../../interfaces/story.interface';
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
   * Determine if story is a self-post (no external URL)
   */
  isSelfPost = computed(() => !this.story().url);

  /**
   * Get the URL for the story (external or HN discussion)
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
   * Get accessibility label for comments link
   */
  storyCommentsLabel = computed(() => {
    const count = this.story().descendants || 0;
    return `${count} comment${count !== 1 ? 's' : ''}`;
  });
}
