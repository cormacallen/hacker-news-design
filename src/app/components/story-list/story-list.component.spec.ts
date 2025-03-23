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
import { Story } from '../../interfaces/story.interface';
import { StoryItemComponent } from '../story-item/story-item.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { HostNamePipe } from '../../pipes/host-name.pipe';
import { Title } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

describe('StoryListComponent', () => {
  let component: StoryListComponent;
  let fixture: ComponentFixture<StoryListComponent>;
  let hackerNewsServiceSpy: jasmine.SpyObj<HackerNewsService>;
  let titleServiceSpy: jasmine.SpyObj<Title>;
  let documentSpy: Document;

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
        provideHttpClient(),
        { provide: HackerNewsService, useValue: hnServiceSpy },
        { provide: Title, useValue: titleSpy },
      ],
    }).compileComponents();

    hackerNewsServiceSpy = TestBed.inject(
      HackerNewsService,
    ) as jasmine.SpyObj<HackerNewsService>;
    titleServiceSpy = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    documentSpy = TestBed.inject(DOCUMENT);

    // Set default behavior for the service spy
    hackerNewsServiceSpy.getStories.and.returnValue(of(mockStories));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryListComponent);
    component = fixture.componentInstance;

    // Create a test-specific method for updating signals to make our tests cleaner
    (component as any).updateSignals = (
      updates: Partial<{
        stories: Story[];
        loading: boolean;
        error: string | null;
        activeTab: string;
        dropdownOpen: boolean;
        currentPage: number;
        hasMoreStories: boolean;
        loadingMore: boolean;
      }>,
    ) => {
      if (updates.stories !== undefined)
        (component.stories as any).set(updates.stories);
      if (updates.loading !== undefined)
        (component.loading as any).set(updates.loading);
      if (updates.error !== undefined)
        (component.error as any).set(updates.error);
      if (updates.activeTab !== undefined)
        (component.activeTab as any).set(updates.activeTab);
      if (updates.currentPage !== undefined)
        (component.currentPage as any).set(updates.currentPage);
      if (updates.hasMoreStories !== undefined)
        (component.hasMoreStories as any).set(updates.hasMoreStories);
      if (updates.loadingMore !== undefined)
        (component.loadingMore as any).set(updates.loadingMore);
    };

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
      jasmine.stringContaining('Top Stories'),
    );
  });

  it('should render stories when loaded', fakeAsync(() => {
    // Mock successful story loading
    (component as any).updateSignals({
      stories: mockStories,
      loading: false,
      error: null,
    });

    fixture.detectChanges();

    const storyElements = fixture.debugElement.queryAll(
      By.css('.stories-grid app-story-item'),
    );
    expect(storyElements.length).toBe(mockStories.length);
  }));

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

    // Reset spy counts
    hackerNewsServiceSpy.getStories.calls.reset();

    // Call the method directly
    component.switchTab('new');
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
      jasmine.stringContaining('New Stories'),
    );
  }));

  it('should show error message when story loading fails', fakeAsync(() => {
    // Setup spy to return an error
    hackerNewsServiceSpy.getStories.and.returnValue(
      throwError(() => new Error('Failed to load stories')),
    );

    // Reset component state and switch tab to trigger error
    (component as any).updateSignals({
      stories: [],
    });

    component.switchTab('best');
    tick();
    fixture.detectChanges();

    // Error state should be set
    expect(component.error()).toBeTruthy();

    // Update the template to show error
    fixture.detectChanges();

    // Should show error message
    const errorElement = fixture.debugElement.query(By.css('.error-container'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain(
      'Failed to load stories',
    );
  }));

  it('should show loading indicator initially', () => {
    // Set component to loading state
    (component as any).updateSignals({
      loading: true,
      stories: [],
    });

    fixture.detectChanges();

    const loadingElement = fixture.debugElement.query(
      By.css('.loading-container'),
    );
    expect(loadingElement).toBeTruthy();
  });

  it('should show empty state when no stories are found', () => {
    // Setup component state for empty stories
    (component as any).updateSignals({
      stories: [],
      loading: false,
      error: null,
    });

    fixture.detectChanges();

    // Should show empty state
    const emptyElement = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyElement).toBeTruthy();
  });

  it('should load more stories when loadMoreStories is called', fakeAsync(() => {
    // Setup initial state
    (component as any).updateSignals({
      stories: mockStories,
      hasMoreStories: true,
      currentPage: 2,
      loading: false,
    });

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

    // Reset spy counts
    hackerNewsServiceSpy.getStories.calls.reset();

    // Call the loadMoreStories method directly
    component.loadStories(true);
    tick();

    // Should call getStories with page 2
    expect(hackerNewsServiceSpy.getStories).toHaveBeenCalledWith(
      'top',
      2,
      component.storiesPerPage,
    );
  }));
});
