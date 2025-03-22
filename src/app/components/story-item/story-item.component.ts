import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Story } from '../../interfaces/story';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { HostNamePipe } from '../../pipes/host-name.pipe';

@Component({
  selector: 'app-story-item',
  imports: [CommonModule, TimeAgoPipe, HostNamePipe],
  templateUrl: './story-item.component.html',
  styleUrl: './story-item.component.scss',
})
export class StoryItemComponent {
  story = input.required<Story>();
  index = input.required<number>();
}
