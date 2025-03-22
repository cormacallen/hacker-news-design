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

  constructor(private http: HttpClient) {}

  getStories(
    storyType: StoryType,
    page: number = 1,
    limit: number = 30,
  ): Observable<Story[]> {
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
            this.http
              .get<Story>(`${this.baseUrl}/item/${id}.json`)
              .pipe(catchError(() => of(null))),
          );
          return forkJoin(storyRequests);
        }),
        map((stories) => stories.filter((story) => story !== null) as Story[]),
      );
  }

  getStory(id: number): Observable<Story> {
    return this.http.get<Story>(`${this.baseUrl}/item/${id}.json`);
  }
}
