import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Story } from '../interfaces/story.interface';
import { environment } from '../../environments/environment';

export type StoryType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'job';

@Injectable({
  providedIn: 'root',
})
export class HackerNewsService {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';
  private storiesCache = new Map<string, Story[]>();
  private storyCache = new Map<number, Story>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get stories from Hacker News API with pagination
   * @param type Type of stories to fetch
   * @param page Page number (starting from 1)
   * @param limit Number of stories per page
   */
  getStories(
    type: StoryType = 'top',
    page: number = 1,
    limit: number = environment.hackerNewsApi.storiesPerPage,
  ): Observable<Story[]> {
    const cacheKey = `${type}_${page}_${limit}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.getStoryIds(type).pipe(
      switchMap((ids) => {
        // Calculate pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const pageIds = ids.slice(start, end);

        if (pageIds.length === 0) {
          return of([]);
        }

        // Fetch all stories for the current page
        const storyRequests = pageIds.map((id) => this.getStory(id));
        return forkJoin(storyRequests);
      }),
      map((stories) => {
        // Filter out any null stories (in case of errors)
        const validStories = stories.filter(
          (story) => story !== null,
        ) as Story[];
        this.setCachedData(cacheKey, validStories);
        return validStories;
      }),
    );
  }

  /**
   * Get a list of story IDs for a specific type
   */
  private getStoryIds(type: StoryType): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/${type}stories.json`);
  }

  /**
   * Get a single story by ID
   */
  getStory(id: number): Observable<Story | null> {
    // Check cache first
    if (this.storyCache.has(id)) {
      return of(this.storyCache.get(id)!);
    }

    return this.http.get<Story>(`${this.baseUrl}/item/${id}.json`).pipe(
      map((story) => {
        if (story) {
          this.storyCache.set(id, story);
        }
        return story;
      }),
      catchError((error) => {
        console.error(`Error fetching story ${id}:`, error);
        return of(null);
      }),
    );
  }

  /**
   * Get cached data if not expired
   */
  private getCachedData(key: string): Story[] | null {
    if (this.storiesCache.has(key)) {
      const expiryTime = this.cacheExpiry.get(key) || 0;
      if (Date.now() < expiryTime) {
        return this.storiesCache.get(key) || null;
      } else {
        // Clean up expired cache
        this.storiesCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
    return null;
  }

  /**
   * Set data in cache with expiry time
   */
  private setCachedData(key: string, data: Story[]): void {
    this.storiesCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  clearCache(): void {
    this.storiesCache.clear();
    this.storyCache.clear();
    this.cacheExpiry.clear();
  }
}
