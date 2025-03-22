import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Story } from '../interfaces/story';

export type StoryType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'job';

@Injectable({
  providedIn: 'root',
})
export class HackerNewsService {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  getStories(
    storyType: StoryType,
    page: number = 1,
    limit: number = 30,
  ): Observable<Story[]> {
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
          const storyRequests = ids.map((id) =>
            this.getStoryCached(id).pipe(catchError(() => of(null))),
          );
          return forkJoin(storyRequests);
        }),
        map((stories) => {
          const filteredStories = stories.filter(
            (story) => story !== null,
          ) as Story[];
          this.setCachedData(cacheKey, filteredStories);
          return filteredStories;
        }),
        catchError((error) => {
          console.error('Error fetching stories:', error);
          return of([]);
        }),
      );
  }

  getStoryCached(id: number): Observable<Story> {
    const cacheKey = `story_${id}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<Story>(`${this.baseUrl}/item/${id}.json`).pipe(
      map((story) => {
        this.setCachedData(cacheKey, story);
        return story;
      }),
    );
  }

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

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }
}
