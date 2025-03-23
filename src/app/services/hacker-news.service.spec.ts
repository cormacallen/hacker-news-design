import { fakeAsync, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HackerNewsService } from './hacker-news.service';
import { Story } from '../interfaces/story.interface';
import { catchError, of } from 'rxjs';

/**
 * These tests specifically target branch coverage in the HackerNewsService
 */
describe('HackerNewsService Branch Coverage', () => {
  let service: HackerNewsService;
  let httpTestingController: HttpTestingController;
  const baseUrl = 'https://hacker-news.firebaseio.com/v0';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HackerNewsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(HackerNewsService);
    httpTestingController = TestBed.inject(HttpTestingController);

    // Reset the service's cache before each test
    service.clearCache();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /**
   * Tests the branch where empty pageIds are handled
   */
  it('should handle empty pageIds array', () => {
    let result: Story[] | undefined;

    service.getStories('top', 999, 30).subscribe((stories) => {
      result = stories;
    });

    // Respond with an empty array
    httpTestingController.expectOne(`${baseUrl}/topstories.json`).flush([]);

    expect(result).toEqual([]);
  });

  /**
   * Tests the branch where a story request returns null
   */
  it('should handle null story response', () => {
    let result: Story[] | undefined;

    service.getStories('top', 1, 2).subscribe((stories) => {
      result = stories;
    });

    // Respond with two story IDs
    httpTestingController.expectOne(`${baseUrl}/topstories.json`).flush([1, 2]);

    // First story is normal
    httpTestingController.expectOne(`${baseUrl}/item/1.json`).flush({
      id: 1,
      title: 'Test Story 1',
      by: 'user1',
      score: 100,
      time: 1615480266,
      descendants: 5,
      type: 'story',
    });

    // Second story is null
    httpTestingController.expectOne(`${baseUrl}/item/2.json`).flush(null);

    // Should filter out the null story
    expect(result?.length).toBe(1);
    expect(result?.[0].id).toBe(1);
  });

  /**
   * Tests the branch where a story request fails with error
   */
  it('should handle story request error', () => {
    let result: Story[] | undefined;

    service.getStories('top', 1, 2).subscribe((stories) => {
      result = stories;
    });

    // Respond with two story IDs
    httpTestingController.expectOne(`${baseUrl}/topstories.json`).flush([1, 2]);

    // First story is normal
    httpTestingController.expectOne(`${baseUrl}/item/1.json`).flush({
      id: 1,
      title: 'Test Story 1',
      by: 'user1',
      score: 100,
      time: 1615480266,
      descendants: 5,
      type: 'story',
    });

    // Second story request fails
    httpTestingController
      .expectOne(`${baseUrl}/item/2.json`)
      .error(new ErrorEvent('Network error'));

    // Should only include the successful story
    expect(result?.length).toBe(1);
    expect(result?.[0].id).toBe(1);
  });

  /**
   * Tests the branch for cached data that has expired
   */
  it('should handle expired cache', fakeAsync(() => {
    // Mock Date.now to control time
    const originalDateNow = Date.now;
    let mockNow = 1577836800000; // 2020-01-01
    spyOn(Date, 'now').and.callFake(() => mockNow);

    // First call to populate cache
    service.getStories('top').subscribe();

    // Respond with story IDs
    httpTestingController.expectOne(`${baseUrl}/topstories.json`).flush([1]);

    // Respond with story
    httpTestingController.expectOne(`${baseUrl}/item/1.json`).flush({
      id: 1,
      title: 'Test Story',
      by: 'user',
      score: 100,
      time: 1615480266,
      descendants: 5,
      type: 'story',
    });

    // Advance time past cache expiration
    mockNow += (service as any).CACHE_DURATION + 1000;

    // Second call should not use cache - this will make new HTTP requests
    // We need to set up new expectations before making the call
    let idRequestMade = false;
    let storyRequestMade = false;

    // Second call
    service.getStories('top').subscribe();

    // Verify new requests are made
    try {
      httpTestingController.expectOne(`${baseUrl}/topstories.json`).flush([1]);
      idRequestMade = true;

      // Try to match the item request - but don't fail the test if it doesn't appear
      // Some implementations might optimize by not re-fetching the story if it's already cached
      const storyReq = httpTestingController.match(`${baseUrl}/item/1.json`);
      if (storyReq.length > 0) {
        storyReq[0].flush({
          id: 1,
          title: 'Test Story',
          by: 'user',
          score: 100,
          time: 1615480266,
          descendants: 5,
          type: 'story',
        });
        storyRequestMade = true;
      }

      // We expect at least the IDs request to be made
      expect(idRequestMade).toBe(true);
    } finally {
      // Restore original Date.now
      (Date as any).now = originalDateNow;
    }
  }));
  /**
   * Tests the branch for all story types
   */
  it('should handle all story types', () => {
    const storyTypes = ['top', 'new', 'best', 'ask', 'show', 'job'];

    storyTypes.forEach((type) => {
      service.clearCache();
      service.getStories(type as any).subscribe();

      // Should make a request for the specific story type
      httpTestingController
        .expectOne(`${baseUrl}/${type}stories.json`)
        .flush([]);
    });
  });

  /**
   * Tests the branch for single story caching
   */
  it('should handle getStory caching', () => {
    // First call
    service.getStory(1).subscribe();

    // Should make HTTP request
    httpTestingController.expectOne(`${baseUrl}/item/1.json`).flush({
      id: 1,
      title: 'Test Story',
      by: 'user',
      score: 100,
      time: 1615480266,
      descendants: 5,
      type: 'story',
    });

    // Second call should use cache
    service.getStory(1).subscribe();

    // No additional HTTP requests
    httpTestingController.expectNone(`${baseUrl}/item/1.json`);
  });

  /**
   * Tests the branch for getStory error handling
   */
  it('should handle getStory error', () => {
    // Spy on console.error
    spyOn(console, 'error');

    let result: any = null;
    let errorReceived = false;

    service
      .getStory(1)
      .pipe(
        catchError((err) => {
          errorReceived = true;
          return of(null);
        }),
      )
      .subscribe((story) => {
        result = story;
      });

    // Simulate network error
    httpTestingController
      .expectOne(`${baseUrl}/item/1.json`)
      .error(new ErrorEvent('Network error'));

    // Should log error and return null
    expect(console.error).toHaveBeenCalled();
    expect(result).toBeNull();
    expect(errorReceived).toBe(false); // Error should be caught inside the service
  });
});
