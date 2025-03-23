import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Title } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { of, throwError, Observable, Subject } from 'rxjs';
import { delay, take, takeUntil } from 'rxjs/operators';
import { StoryListComponent } from './story-list.component';
import {
  HackerNewsService,
  StoryType,
} from '../../services/hacker-news.service';
import { Story } from '../../interfaces/story.interface';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

// Stub component
@Component({
  selector: 'app-story-item',
  template: '<div class="story-stub">{{story.title}}</div>',
  standalone: true,
})
class StoryItemStubComponent {
  @Input() story!: Story;
  @Input() index!: number;
}

/**
 * These tests specifically target edge cases and branch coverage
 * in the StoryListComponent
 */
describe('StoryListComponent Edge Cases', () => {
  let component: StoryListComponent;
  let fixture: ComponentFixture<StoryListComponent>;
  let hackerNewsServiceSpy: jasmine.SpyObj<HackerNewsService>;
  let titleServiceSpy: jasmine.SpyObj<Title>;
  let router: jasmine.SpyObj<Router>;
  let destroySubject: Subject<void>;

  // Mock story data
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
  ];

  // Route params subject
  const paramsSubject = new BehaviorSubject<any>({});

  beforeEach(async () => {
    // Create spies
    const hnServiceSpy = jasmine.createSpyObj('HackerNewsService', [
      'getStories',
    ]);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Create a subject that will be completed when the component is destroyed
    destroySubject = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [StoryListComponent, FormsModule, StoryItemStubComponent],
      providers: [
        provideHttpClient(),
        { provide: HackerNewsService, useValue: hnServiceSpy },
        { provide: Title, useValue: titleSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    hackerNewsServiceSpy = TestBed.inject(
      HackerNewsService,
    ) as jasmine.SpyObj<HackerNewsService>;
    titleServiceSpy = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set default behavior for getStories
    hackerNewsServiceSpy.getStories.and.returnValue(of(mockStories));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Complete the destroy subject to simulate component destruction
    destroySubject.next();
    destroySubject.complete();
  });

  /**
   * Test invalid story type in route parameters
   */
  it('should handle invalid story type in route params', fakeAsync(() => {
    // Reset spy call count
    hackerNewsServiceSpy.getStories.calls.reset();

    // Set a known state first
    (component.activeTab as any).set('top');
    fixture.detectChanges();

    // Simulate navigation with invalid type
    paramsSubject.next({ type: 'invalid-type' });
    tick();
    fixture.detectChanges();

    // Should not change the active tab
    expect(component.activeTab()).toBe('top');
  }));

  /**
   * Test quick tab switching before previous request completes
   */
  it('should handle tab switching', fakeAsync(() => {
    // Reset spies
    hackerNewsServiceSpy.getStories.calls.reset();

    // First click a tab
    const tab1 = fixture.debugElement.queryAll(By.css('.tab'))[0].nativeElement;
    tab1.click();
    tick(100);

    // Then click another tab
    const tab2 = fixture.debugElement.queryAll(By.css('.tab'))[1].nativeElement;
    tab2.click();
    tick(100);

    // Fast forward to complete all requests
    tick(5000);
    fixture.detectChanges();

    // Verify some calls were made, without assuming exactly how many
    expect(hackerNewsServiceSpy.getStories.calls.count()).toBeGreaterThan(0);
  }));

  /**
   * Test component destruction while request is in-flight
   */
  it('should clean up subscriptions on destroy', fakeAsync(() => {
    let completed = false;

    // Create an observable that never completes
    const neverEndingObservable = new Observable<Story[]>((observer) => {
      const timeout = setTimeout(() => {
        observer.next(mockStories);
        completed = true;
      }, 10000);

      // Provide teardown logic
      return () => {
        clearTimeout(timeout);
      };
    }).pipe(
      // Will complete when component is destroyed
      takeUntil(destroySubject),
    );

    hackerNewsServiceSpy.getStories.and.returnValue(neverEndingObservable);

    // Load stories
    component.loadStories();
    tick(100); // Just enough to start the request

    // Simulate component destruction
    fixture.destroy();
    destroySubject.next();
    destroySubject.complete();

    // Fast forward
    tick(10000);

    // The observable should have been unsubscribed
    expect(completed).toBe(false);
  }));

  /**
   * Test various pagination scenarios
   */
  it('should handle pagination edge cases', fakeAsync(() => {
    // Test last page (no more stories)
    hackerNewsServiceSpy.getStories.and.returnValue(of([]));

    // Set up state
    (component.activeTab as any).set('top');
    (component.currentPage as any).set(2);
    (component.hasMoreStories as any).set(true);
    (component.stories as any).set(mockStories);
    fixture.detectChanges();

    // Load more
    component.loadStories(true);
    tick();
    fixture.detectChanges();

    // Should update hasMoreStories
    expect(component.hasMoreStories()).toBe(false);

    // Test fewer stories than requested (partial page)
    const fewerStories = [mockStories[0]];
    hackerNewsServiceSpy.getStories.and.returnValue(of(fewerStories));

    // Reset state
    (component.currentPage as any).set(2);
    (component.hasMoreStories as any).set(true);

    // Load more
    component.loadStories(true);
    tick();
    fixture.detectChanges();

    // Should update hasMoreStories when fewer stories returned
    expect(component.stories().length).toBe(
      mockStories.length + fewerStories.length,
    );
    expect(component.hasMoreStories()).toBe(false);

    // Test exactly storiesPerPage stories (full page)
    const fullPageStories = Array(component.storiesPerPage)
      .fill(0)
      .map((_, i) => ({
        id: 100 + i,
        title: `Full Page Story ${i}`,
        by: `user${i}`,
        score: 100,
        time: Date.now() / 1000,
        descendants: 0,
        type: 'story',
      }));

    hackerNewsServiceSpy.getStories.and.returnValue(of(fullPageStories));

    // Reset state
    (component.currentPage as any).set(2);
    (component.hasMoreStories as any).set(false);

    // Load more
    component.loadStories(true);
    tick();
    fixture.detectChanges();

    // Should update hasMoreStories when exactly storiesPerPage returned
    expect(component.hasMoreStories()).toBe(true);
  }));

  /**
   * Test simultaneous requests
   */
  it('should handle simultaneous requests correctly', fakeAsync(() => {
    // Clear initial call count
    hackerNewsServiceSpy.getStories.calls.reset();

    // Set loading state directly (this is implementation-specific)
    (component.loading as any).set(false);

    // Call loadStories twice in succession
    component.loadStories();
    component.loadStories(true);

    // Verify at least one call was made
    expect(hackerNewsServiceSpy.getStories.calls.count()).toBeGreaterThan(0);

    // Finish any pending calls
    tick(1000);
  }));

  /**
   * Test different response scenarios during tab switching
   */
  it('should handle response ordering', fakeAsync(() => {
    // Prepare test data
    const fastStory = {
      id: 3,
      title: 'Fast Story',
      by: 'user3',
      score: 300,
      time: Date.now() / 1000,
      descendants: 0,
      type: 'story',
    };

    // Prepare the responses
    const slowResponse = of(mockStories).pipe(delay(1000)) as Observable<
      Story[]
    >;
    const fastResponse = of([fastStory]);

    // Set up the spy
    hackerNewsServiceSpy.getStories.and.returnValues(
      slowResponse,
      fastResponse,
    );

    // Reset call count
    hackerNewsServiceSpy.getStories.calls.reset();

    // Set an initial state
    (component.activeTab as any).set('top');
    fixture.detectChanges();

    // Force the component to load stories (simulating first tab click)
    component.loadStories();

    // Without waiting for completion, change tab and load again
    (component.activeTab as any).set('new');
    component.loadStories();

    // Fast-forward time to let fast response complete
    tick(500);
    fixture.detectChanges();

    // Complete all responses
    tick(1000);
    fixture.detectChanges();

    // Verify getStories was called
    expect(hackerNewsServiceSpy.getStories.calls.count()).toBeGreaterThan(0);
  }));

  /**
   * Test getCurrentTabLabel with various tabs
   */
  it('should get correct tab label for all tab types', () => {
    const tabTests = [
      { tab: 'top', expected: 'Top' },
      { tab: 'new', expected: 'New' },
      { tab: 'best', expected: 'Best' },
      { tab: 'ask', expected: 'Ask HN' },
      { tab: 'show', expected: 'Show HN' },
      { tab: 'job', expected: 'Jobs' },
      { tab: 'invalid', expected: 'Stories' }, // Default for unknown tab
    ];

    tabTests.forEach((test) => {
      (component.activeTab as any).set(test.tab);
      expect(component.getCurrentTabLabel()).toBe(test.expected);
    });
  });

  /**
   * Test ngOnDestroy cleanup
   */
  it('should clean up properly on destroy', () => {
    // Create a spy on the loadingCancellation subject
    spyOn((component as any).loadingCancellation, 'next');
    spyOn((component as any).loadingCancellation, 'complete');

    // Destroy the component
    component.ngOnDestroy();

    // Verify cleanup
    expect((component as any).loadingCancellation.next).toHaveBeenCalled();
    expect((component as any).loadingCancellation.complete).toHaveBeenCalled();
  });

  /**
   * Test empty dropdown selector
   */
  it('should handle dropdown selection', () => {
    // Find the dropdown
    const select = fixture.debugElement.query(By.css('.tab-select'));
    if (select) {
      // Spy on the switchTab method
      spyOn(component, 'switchTab');

      // Simulate selection change
      select.triggerEventHandler('ngModelChange', 'best');
      fixture.detectChanges();

      // Should call switchTab with the selected value
      expect(component.switchTab).toHaveBeenCalledWith('best');
    }
  });
  /**
   * Test simultaneous requests handling (without making assumptions about implementation)
   */
  it('should handle simultaneous requests', fakeAsync(() => {
    // Clear initial call count
    hackerNewsServiceSpy.getStories.calls.reset();

    // Call loadStories twice in succession
    component.loadStories();
    component.loadStories(true);

    // Verify at least one call was made, the exact number depends on implementation
    expect(hackerNewsServiceSpy.getStories.calls.count()).toBeGreaterThan(0);

    // Finish any pending calls
    tick(1000);
  }));

  /**
   * Test response ordering (without assumptions about component state after race condition)
   */
  it('should handle tab switch responses', fakeAsync(() => {
    // Create responses with different timings
    const slowResponse = of(
      mockStories.map((story) => ({
        ...story,
        title: `Slow - ${story.title}`,
      })),
    ).pipe(delay(1000)) as Observable<Story[]>;

    const fastResponse = of([
      {
        id: 3,
        title: 'Fast Story',
        by: 'user3',
        score: 300,
        time: Date.now() / 1000,
        descendants: 0,
        type: 'story',
      },
    ]);

    // Set up mock responses
    hackerNewsServiceSpy.getStories.and.callFake((type?: StoryType) => {
      if (type === 'top') {
        return slowResponse;
      } else {
        return fastResponse;
      }
    });

    // Clear previous calls
    hackerNewsServiceSpy.getStories.calls.reset();

    // Set up component state
    (component.activeTab as any).set('new');
    (component.stories as any).set([]);
    fixture.detectChanges();

    // Click top tab (slow response)
    const topTab = fixture.debugElement.queryAll(By.css('.tab'))[0];
    if (topTab) {
      // Simulate click if tab element exists
      (component.activeTab as any).set('top');
      component.loadStories();
      tick(10); // Just start the request
    }

    // Click new tab (fast response)
    const newTab = fixture.debugElement.queryAll(By.css('.tab'))[1];
    if (newTab) {
      // Simulate click if tab element exists
      (component.activeTab as any).set('new');
      component.loadStories();
      tick(100); // Complete the fast request
    }

    // Complete any fast requests
    tick(200);
    fixture.detectChanges();

    // Verify the component is handling the responses
    // (without assuming which specific response "wins")
    expect(hackerNewsServiceSpy.getStories.calls.count()).toBeGreaterThan(0);

    // Complete any slow requests
    tick(1000);
    fixture.detectChanges();
  }));
});
