import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryItemComponent } from './story-item.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { HostNamePipe } from '../../pipes/host-name.pipe';
import { Story } from '../../interfaces/story.interface';
import { Component } from '@angular/core';

// Create a test host component to properly provide inputs to the StoryItemComponent
@Component({
  template: `<app-story-item [story]="story" [index]="index"></app-story-item>`,
  standalone: true,
  imports: [StoryItemComponent],
})
class TestHostComponent {
  story: Story = {
    id: 123,
    title: 'Test Story',
    url: 'https://example.com/test',
    score: 100,
    by: 'testuser',
    time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    descendants: 5,
    type: 'story',
  };
  index: number = 1;
}

describe('StoryItemComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let storyComponent: StoryItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        StoryItemComponent,
        TimeAgoPipe,
        HostNamePipe,
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();

    // Get the StoryItemComponent instance from the host
    storyComponent = hostFixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    expect(storyComponent).toBeTruthy();
  });

  it('should display the story title', () => {
    const titleElement =
      hostFixture.nativeElement.querySelector('.story-title');
    expect(titleElement.textContent).toContain('Test Story');
  });

  it('should display the correct domain for external links', () => {
    const domainElement =
      hostFixture.nativeElement.querySelector('.story-domain');
    expect(domainElement.textContent).toContain('example.com');
  });

  it('should compute isSelfPost correctly', () => {
    // Initially it's not a self post (has URL)
    expect(storyComponent.isSelfPost()).toBe(false);

    // Change to a self post (no URL)
    hostComponent.story = { ...hostComponent.story, url: undefined };
    hostFixture.detectChanges();
    expect(storyComponent.isSelfPost()).toBe(true);
  });

  it('should compute correct story URL', () => {
    // External URL
    expect(storyComponent.storyUrl()).toBe('https://example.com/test');

    // Self post
    hostComponent.story = { ...hostComponent.story, url: undefined };
    hostFixture.detectChanges();
    expect(storyComponent.storyUrl()).toBe(
      `https://news.ycombinator.com/item?id=123`,
    );
  });
});
