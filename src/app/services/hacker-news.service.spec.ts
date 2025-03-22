import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HackerNewsService, StoryType } from './hacker-news.service';
import { Story } from '../interfaces/story';
import { environment } from '../../environments/environment';

describe('HackerNewsService', () => {
  let service: HackerNewsService;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.hackerNewsApi.baseUrl;

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
  });

  afterEach(() => {
    // Verify that no requests are outstanding
    httpTestingController.verify();

    // Clear cache between tests
    service.clearCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStories', () => {
    it('should fetch story IDs and then get each story', () => {
      const storyIds = [111, 222, 333];
      const mockStories: Story[] = [
        {
          id: 111,
          by: 'user1',
          score: 100,
          time: 1615480266,
          title: 'Test Story 1',
          type: 'story',
          descendants: 5,
        },
        {
          id: 222,
          by: 'user2',
          score: 200,
          time: 1615480267,
          title: 'Test Story 2',
          type: 'story',
          descendants: 10,
        },
        {
          id: 333,
          by: 'user3',
          score: 300,
          time: 1615480268,
          title: 'Test Story 3',
          type: 'story',
          descendants: 15,
        },
      ];

      // Set up subscription to the service method
      service.getStories('top').subscribe((stories) => {
        expect(stories.length).toBe(3);
        expect(stories).toEqual(mockStories);
      });

      // Respond to the first request (story IDs)
      const idsRequest = httpTestingController.expectOne(
        `${baseUrl}/topstories.json`,
      );
      expect(idsRequest.request.method).toEqual('GET');
      idsRequest.flush(storyIds);

      // Respond to each story request
      mockStories.forEach((story) => {
        const storyRequest = httpTestingController.expectOne(
          `${baseUrl}/item/${story.id}.json`,
        );
        expect(storyRequest.request.method).toEqual('GET');
        storyRequest.flush(story);
      });
    });

    it('should handle pagination correctly', () => {
      // Create an array of 100 sequential IDs for testing pagination
      const allStoryIds = Array(100)
        .fill(0)
        .map((_, i) => 1000 + i);

      // We'll request page 2 with 10 items per page
      const page = 2;
      const limit = 10;
      const expectedIds = allStoryIds.slice((page - 1) * limit, page * limit);

      // Mock stories for the expected IDs
      const mockStories: Story[] = expectedIds.map((id) => ({
        id,
        by: `user${id}`,
        score: id - 990, // Just a formula to make different scores
        time: 1615480266,
        title: `Test Story ${id}`,
        type: 'story',
        descendants: id - 990,
      }));

      // Set up subscription
      service.getStories('new', page, limit).subscribe((stories) => {
        expect(stories.length).toBe(limit);
        expect(stories[0].id).toBe(expectedIds[0]);
        expect(stories[limit - 1].id).toBe(expectedIds[limit - 1]);
      });

      // Respond to the IDs request
      const idsRequest = httpTestingController.expectOne(
        `${baseUrl}/newstories.json`,
      );
      idsRequest.flush(allStoryIds);

      // Respond to each story request
      mockStories.forEach((story) => {
        const storyRequest = httpTestingController.expectOne(
          `${baseUrl}/item/${story.id}.json`,
        );
        storyRequest.flush(story);
      });
    });

    it('should return an empty array when there are no stories', () => {
      service.getStories('job').subscribe((stories) => {
        expect(stories).toEqual([]);
        expect(stories.length).toBe(0);
      });

      const idsRequest = httpTestingController.expectOne(
        `${baseUrl}/jobstories.json`,
      );
      idsRequest.flush([]);
    });

    it('should filter out null stories from failed requests', () => {
      const storyIds = [111, 222, 333];
      const mockStories: Story[] = [
        {
          id: 111,
          by: 'user1',
          score: 100,
          time: 1615480266,
          title: 'Test Story 1',
          type: 'story',
          descendants: 5,
        },
        {
          id: 333,
          by: 'user3',
          score: 300,
          time: 1615480268,
          title: 'Test Story 3',
          type: 'story',
          descendants: 15,
        },
      ];

      service.getStories('top').subscribe((stories) => {
        expect(stories.length).toBe(2);
        expect(stories).toEqual(mockStories);
      });

      const idsRequest = httpTestingController.expectOne(
        `${baseUrl}/topstories.json`,
      );
      idsRequest.flush(storyIds);

      // Respond to first and third story requests successfully
      const story1Request = httpTestingController.expectOne(
        `${baseUrl}/item/111.json`,
      );
      story1Request.flush(mockStories[0]);

      // Simulate a failed request for story 222
      const story2Request = httpTestingController.expectOne(
        `${baseUrl}/item/222.json`,
      );
      story2Request.error(new ErrorEvent('Network error'));

      const story3Request = httpTestingController.expectOne(
        `${baseUrl}/item/333.json`,
      );
      story3Request.flush(mockStories[1]);
    });

    it('should handle different story types correctly', () => {
      const storyTypes: StoryType[] = [
        'top',
        'new',
        'best',
        'ask',
        'show',
        'job',
      ];

      storyTypes.forEach((type) => {
        service.getStories(type, 1, 1).subscribe();
        const request = httpTestingController.expectOne(
          `${baseUrl}/${type}stories.json`,
        );
        request.flush([1000]);

        const storyRequest = httpTestingController.expectOne(
          `${baseUrl}/item/1000.json`,
        );
        storyRequest.flush({
          id: 1000,
          by: 'user',
          score: 100,
          time: 1615480266,
          title: `Test ${type} Story`,
          type: 'story',
          descendants: 5,
        });
      });
    });

    it('should use cached data when available', () => {
      const mockStoryIds = [123, 456];
      const mockStories: Story[] = [
        {
          id: 123,
          by: 'user1',
          score: 100,
          time: 1615480266,
          title: 'Cached Story 1',
          type: 'story',
          descendants: 5,
        },
        {
          id: 456,
          by: 'user2',
          score: 200,
          time: 1615480267,
          title: 'Cached Story 2',
          type: 'story',
          descendants: 10,
        },
      ];

      // First call should make HTTP requests
      service.getStories('best').subscribe((stories) => {
        expect(stories.length).toBe(2);
        expect(stories).toEqual(mockStories);
      });

      // Respond to the IDs request
      const idsRequest = httpTestingController.expectOne(
        `${baseUrl}/beststories.json`,
      );
      idsRequest.flush(mockStoryIds);

      // Respond to each story request
      mockStories.forEach((story) => {
        const storyRequest = httpTestingController.expectOne(
          `${baseUrl}/item/${story.id}.json`,
        );
        storyRequest.flush(story);
      });

      // Second call should use cached data
      service.getStories('best').subscribe((stories) => {
        expect(stories.length).toBe(2);
        expect(stories).toEqual(mockStories);
      });

      // No additional HTTP requests should be made
      httpTestingController.expectNone(`${baseUrl}/beststories.json`);
      httpTestingController.expectNone(`${baseUrl}/item/123.json`);
      httpTestingController.expectNone(`${baseUrl}/item/456.json`);
    });
  });

  describe('getStoryCached', () => {
    it('should fetch a story by ID', () => {
      const mockStory: Story = {
        id: 123,
        by: 'user1',
        score: 100,
        time: 1615480266,
        title: 'Test Story',
        type: 'story',
        descendants: 5,
      };

      service.getStoryCached(123).subscribe((story) => {
        expect(story).toEqual(mockStory);
      });

      const request = httpTestingController.expectOne(
        `${baseUrl}/item/123.json`,
      );
      expect(request.request.method).toEqual('GET');
      request.flush(mockStory);
    });

    it('should use cached story when available', () => {
      const mockStory: Story = {
        id: 123,
        by: 'user1',
        score: 100,
        time: 1615480266,
        title: 'Test Story',
        type: 'story',
        descendants: 5,
      };

      // First call should make HTTP request
      service.getStoryCached(123).subscribe((story) => {
        expect(story).toEqual(mockStory);
      });

      const request = httpTestingController.expectOne(
        `${baseUrl}/item/123.json`,
      );
      request.flush(mockStory);

      // Second call should use cached data
      service.getStoryCached(123).subscribe((story) => {
        expect(story).toEqual(mockStory);
      });

      // No additional HTTP requests should be made
      httpTestingController.expectNone(`${baseUrl}/item/123.json`);
    });

    it('should handle error when story is not found', () => {
      service.getStoryCached(999).subscribe({
        next: () => fail('Should have failed with 404 error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const request = httpTestingController.expectOne(
        `${baseUrl}/item/999.json`,
      );
      request.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });
});
