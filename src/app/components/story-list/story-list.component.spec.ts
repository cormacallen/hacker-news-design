import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { StoryListComponent } from './story-list.component';
import { HackerNewsService } from '../../services/hacker-news.service';
import { Story } from '../../interfaces/story';
import { StoryItemComponent } from '../story-item/story-item.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { HostNamePipe } from '../../pipes/host-name.pipe';
import { Title } from '@angular/platform-browser';

describe('StoryListComponent', () => {
  let component: StoryListComponent;
  let fixture: ComponentFixture<StoryListComponent>;
  let hackerNewsServiceSpy: jasmine.SpyObj<HackerNewsService>;
  let titleServiceSpy: jasmine.SpyObj<Title>;

  // Mock stories data
  const mockStories: Story[] = [
    {
      id: 1,
      title: 'Test Story 1',
      by: 'user1',
      score: 100,
      time: Date.now() / 1000 - 3600,
      descendants: 10,
      type: 'story',
    },
    {
      id: 2,
      title: 'Test Story 2',
      by: 'user2',
      score: 200,
      time: Date.now() / 1000 - 7200,
      descendants: 20,
      type: 'story',
    },
    {
      id: 3,
      title: 'Test Story 3',
      by: 'user3',
      score: 300,
      time: Date.now() / 1000 - 10800,
      descendants: 30,
      type: 'story',
    },
  ];

  beforeEach(async () => {
    // Create spies for the services
    const hnServiceSpy = jasmine.createSpyObj('HackerNewsService', [
      'getStories',
    ]);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [
        StoryListComponent,
        StoryItemComponent,
        TimeAgoPipe,
        HostNamePipe,
      ],
      providers: [
        { provide: HackerNewsService, useValue: hnServiceSpy },
        { provide: Title, useValue: titleSpy },
      ],
    }).compileComponents();

    hackerNewsServiceSpy = TestBed.inject(
      HackerNewsService,
    ) as jasmine.SpyObj<HackerNewsService>;
    titleServiceSpy = TestBed.inject(Title) as jasmine.SpyObj<Title>;
  });

  beforeEach(() => {
    // Default behavior is to return mock stories
    hackerNewsServiceSpy.getStories.and.returnValue(of(mockStories));

    fixture = TestBed.createComponent(StoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getStories on initialization', () => {
    expect(hackerNewsServiceSpy.getStories).toHaveBeenCalledWith(
      'top',
      1,
      component.storiesPerPage,
    );
  });

  it('should set the page title based on the active tab', () => {
    expect(titleServiceSpy.setTitle).toHaveBeenCalledWith(
      'Top Stories | Hacker News Redesigned',
    );
  });

  it('should render the correct number of story items', () => {
    const storyItems = fixture.debugElement.queryAll(
      By.directive(StoryItemComponent),
    );
    expect(storyItems.length).toBe(mockStories.length);
  });

  it('should switch tabs and load new stories', fakeAsync(() => {
    // Setup spy to return different stories for 'new' tab
    const newStories: Story[] = [
      {
        id: 4,
        title: 'New Story 1',
        by: 'user4',
        score: 50,
        time: Date.now() / 1000 - 1800,
        descendants: 5,
        type: 'story',
      },
    ];
    hackerNewsServiceSpy.getStories.and.returnValue(of(newStories));

    // Find and click the 'New' tab
    const newTab = fixture.debugElement.query(By.css('[id="tab-new"]'));
    newTab.nativeElement.click();
    tick();
    fixture.detectChanges();

    // Should call getStories with 'new' type
    expect(hackerNewsServiceSpy.getStories).toHaveBeenCalledWith(
      'new',
      1,
      component.storiesPerPage,
    );

    // Should update the page title
    expect(titleServiceSpy.setTitle).toHaveBeenCalledWith(
      'New Stories | Hacker News Redesigned',
    );

    // Should update the displayed stories
    const storyItems = fixture.debugElement.queryAll(
      By.directive(StoryItemComponent),
    );
    expect(storyItems.length).toBe(newStories.length);
  }));

  it('should show error message when story loading fails', fakeAsync(() => {
    // Setup spy to return an error
    hackerNewsServiceSpy.getStories.and.returnValue(
      throwError(() => new Error('Failed to load stories')),
    );

    // Switch to a tab to trigger the error
    component.switchTab('best');
    tick();
    fixture.detectChanges();

    // Should show error message
    const errorElement = fixture.debugElement.query(By.css('.error-container'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain(
      'Failed to load stories',
    );

    // Should have a retry button
    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    expect(retryButton).toBeTruthy();

    // Clicking retry should try to load stories again
    hackerNewsServiceSpy.getStories.calls.reset();
    hackerNewsServiceSpy.getStories.and.returnValue(of(mockStories));
    retryButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(hackerNewsServiceSpy.getStories).toHaveBeenCalled();
  }));

  it('should show loading indicator initially', () => {
    // Reset component to simulate initial load
    hackerNewsServiceSpy.getStories.and.returnValue(of([])); // Don't complete immediately
    component.loading.set(true);
    fixture.detectChanges();

    const loadingElement = fixture.debugElement.query(
      By.css('.loading-container'),
    );
    expect(loadingElement).toBeTruthy();
  });

  it('should show empty state when no stories are found', fakeAsync(() => {
    // Setup spy to return empty array
    hackerNewsServiceSpy.getStories.and.returnValue(of([]));

    // Reset component state
    component.stories.set([]);
    component.loading.set(false);
    component.error.set(null);
    fixture.detectChanges();

    // Should show empty state
    const emptyElement = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyElement).toBeTruthy();
  }));

  it('should load more stories when "Load More" button is clicked', fakeAsync(() => {
    // Setup initial state
    component.stories.set(mockStories);
    component.hasMoreStories.set(true);
    component.currentPage.set(2);
    fixture.detectChanges();

    // Setup spy to return more stories
    const moreStories: Story[] = [
      {
        id: 4,
        title: 'More Story 1',
        by: 'user4',
        score: 400,
        time: Date.now() / 1000 - 14400,
        descendants: 40,
        type: 'story',
      },
    ];
    hackerNewsServiceSpy.getStories.and.returnValue(of(moreStories));

    // Find and click the "Load More" button
    const loadMoreButton = fixture.debugElement.query(
      By.css('.load-more-button'),
    );
    expect(loadMoreButton).toBeTruthy();
    loadMoreButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    // Should call getStories with page 2
    expect(hackerNewsServiceSpy.getStories).toHaveBeenCalledWith(
      'top',
      2,
      component.storiesPerPage,
    );

    // Combined stories should include both original and new stories
    expect(component.stories().length).toBe(
      mockStories.length + moreStories.length,
    );
  }));

  it('should toggle the dropdown menu on mobile', () => {
    // Initially dropdown should be closed
    expect(component.dropdownOpen()).toBe(false);

    // Find and click the dropdown button
    const dropdownButton = fixture.debugElement.query(
      By.css('.tabs-dropdown-button'),
    );
    dropdownButton.nativeElement.click();
    fixture.detectChanges();

    // Dropdown should now be open
    expect(component.dropdownOpen()).toBe(true);

    // Dropdown items should be visible
    const dropdownMenu = fixture.debugElement.query(
      By.css('.tabs-dropdown-menu.open'),
    );
    expect(dropdownMenu).toBeTruthy();

    // Click a dropdown item to select a new tab
    const dropdownItem = fixture.debugElement.query(
      By.css('.tabs-dropdown-item'),
    );
    dropdownItem.nativeElement.click();
    fixture.detectChanges();

    // Dropdown should be closed after selection
    expect(component.dropdownOpen()).toBe(false);
  });
});
