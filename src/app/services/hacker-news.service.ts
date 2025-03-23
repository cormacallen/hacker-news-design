import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, retry } from 'rxjs/operators';
import { Story } from '../interfaces/story';
import { environment } from '../../environments/environment';

export type StoryType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'job';

@Injectable({
  providedIn: 'root',
})
export class HackerNewsService {
  private baseUrl = environment.hackerNewsApi.baseUrl;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = environment.hackerNewsApi.cacheDuration;
  private readonly STORIES_PER_PAGE = environment.hackerNewsApi.storiesPerPage;

  constructor(private http: HttpClient) {}

  /**
   * Get stories from Hacker News API with pagination
   * @param storyType Type of stories to fetch (top, new, best, ask, show, job)
   * @param page Page number (starting from 1)
   * @param limit Number of stories per page
   * @returns Observable of Story array
   */
  getStories(
    storyType: StoryType = 'top',
    page: number = 1,
    limit: number = this.STORIES_PER_PAGE,
  ): Observable<Story[]> {
    if (page < 1) {
      return throwError(() => new Error('Page number must be greater than 0'));
    }

    const cacheKey = `${storyType}_${page}_${limit}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http
      .get<number[]>(`${this.baseUrl}/${storyType}stories.json`)
      .pipe(
        map((ids) => {
          // Calculate start and end indices for pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          return ids.slice(startIndex, endIndex);
        }),
        switchMap((ids) => {
          if (ids.length === 0) {
            return of([]);
          }
          // Create an Observable for each story ID
          const storyRequests = ids.map((id) =>
            this.getStoryCached(id).pipe(catchError(() => of(null))),
          );
          // Combine all story Observables into one
          return forkJoin(storyRequests);
        }),
        map((stories) => {
          // Filter out null stories (failed requests)
          const filteredStories = stories.filter(
            (story) => story !== null,
          ) as Story[];

          // Cache the results
          this.setCachedData(cacheKey, filteredStories);
          return filteredStories;
        }),
        catchError((error) => {
          console.error('Error fetching stories:', error);
          return throwError(
            () => new Error('Failed to load stories. Please try again.'),
          );
        }),
      );
  }

  /**
   * Get a single story with caching
   * @param id Story ID
   * @returns Observable of Story
   */
  getStoryCached(id: number): Observable<Story> {
    const cacheKey = `story_${id}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<Story>(`${this.baseUrl}/item/${id}.json`).pipe(
      map((story) => {
        if (!story) {
          throw new Error(`Story with ID ${id} not found`);
        }
        this.setCachedData(cacheKey, story);
        return story;
      }),
      catchError((error) => {
        console.error(`Error fetching story ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get data from cache if not expired
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  private getCachedData(key: string): any | null {
    if (this.cache.has(key)) {
      const expiryTime = this.cacheExpiry.get(key) || 0;

      if (Date.now() < expiryTime) {
        return this.cache.get(key);
      } else {
        // Clean up expired cache
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }

    return null;
  }

  /**
   * Set data in cache with expiry time
   * @param key Cache key
   * @param data Data to cache
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}
